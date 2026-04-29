import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'

import { NotificationService } from '~/modules/notification/notificationService.js'
import { SettingService } from '~/modules/setting/settingService.js'
import streamUpload from '~/util/streamUpload.js'

import type { UpdateUserDto } from './dto/updateUserDto.js'
import { UserRepository } from './userRepository.js'

const followLimitMessage = (verified: boolean, type: 'following' | 'followers') => {
  if (verified) {
    return type === 'following'
      ? 'You have reached the maximum following limit of 5000.'
      : 'This user has reached the maximum followers limit of 5000.'
  }
  return type === 'following'
    ? 'You have reached the maximum following limit, please upgrade to a verified account.'
    : 'This user has reached the maximum followers limit.'
}

const checkFollowLimit = (verified: boolean, type: 'following' | 'followers', length: number) => {
  const limit = verified ? 5000 : 1000
  if (length >= limit) return followLimitMessage(verified, type)
  return null
}

export interface UploadedProfileFiles {
  avatarImg?: Array<{ buffer: Buffer }>
  coverImg?: Array<{ buffer: Buffer }>
}

@Injectable()
export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly settings: SettingService,
    private readonly notifications: NotificationService
  ) {}

  async getByUsername(username: string): Promise<unknown> {
    const user = await this.users.findByUsername(username)
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async deleteCurrent(userId: string): Promise<{ message: string }> {
    await this.users.deleteById(userId)
    return { message: `User with id ${userId} deleted` }
  }

  async updateCurrent(
    userId: string,
    dto: UpdateUserDto,
    files: UploadedProfileFiles
  ): Promise<{ message: string; user: unknown }> {
    const user = await this.users.findById(userId)
    if (!user) throw new NotFoundException('User not found')

    if (dto.displayName !== undefined) user.displayName = dto.displayName || user.displayName
    if (dto.bio !== undefined) user.profile.bio = dto.bio || user.profile.bio
    if (dto.location !== undefined) user.profile.location = dto.location || user.profile.location
    if (dto.website !== undefined) user.profile.website = dto.website || user.profile.website

    const avatarFile = files?.avatarImg?.[0]
    if (avatarFile) {
      if (user.profile.avatarImg) {
        const publicId = user.profile.avatarImg.split('/').pop()?.split('.')[0]
        if (publicId) await cloudinary.uploader.destroy(`Mesom/AvatarImage/${publicId}`)
      }
      const result = await streamUpload(avatarFile.buffer, 'Mesom/AvatarImage')
      user.profile.avatarImg = result.secure_url
    }

    const coverFile = files?.coverImg?.[0]
    if (coverFile) {
      if (user.profile.coverImg) {
        const publicId = user.profile.coverImg.split('/').pop()?.split('.')[0]
        if (publicId) await cloudinary.uploader.destroy(`Mesom/CoverImage/${publicId}`)
      }
      const result = await streamUpload(coverFile.buffer, 'Mesom/CoverImage')
      user.profile.coverImg = result.secure_url
    }

    await user.save()
    return { message: 'User updated successfully', user }
  }

  async toggleFollow(
    currentUserId: string,
    targetUserId: string
  ): Promise<{ message: string; followers: unknown[] }> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself')
    }

    const currentUser = await this.users.findById(currentUserId)
    const targetUser = await this.users.findById(targetUserId)
    if (!targetUser) throw new NotFoundException('User not found')

    const isFollowing = currentUser.following.some(
      (id: { toString: () => string }) => id.toString() === targetUser._id.toString()
    )

    const followNotification = await this.notifications.findFollowNotification(
      currentUser._id.toString(),
      targetUser._id.toString()
    )

    const currentErr = checkFollowLimit(currentUser.verified, 'following', currentUser.following.length)
    if (currentErr) throw new ForbiddenException(currentErr)

    const targetErr = checkFollowLimit(targetUser.verified, 'followers', targetUser.followers.length)
    if (targetErr) throw new ForbiddenException(targetErr)

    const blocked = await this.settings.isFollowNotificationBlocked(targetUserId)

    if (!isFollowing) {
      currentUser.following.push(targetUser._id)
      targetUser.followers.push(currentUser._id)
      if (followNotification) {
        await this.notifications.updateShow(followNotification._id.toString(), true)
      } else if (!blocked) {
        await this.notifications.create(currentUserId, targetUserId, 'follow')
      }
    } else {
      currentUser.following.pull(targetUser._id)
      targetUser.followers.pull(currentUser._id)
      if (followNotification) {
        await this.notifications.updateShow(followNotification._id.toString(), false)
      }
    }

    await currentUser.save()
    await targetUser.save()

    return {
      message: !isFollowing
        ? `${targetUser.username} followed successfully`
        : `${targetUser.username} unfollowed successfully`,
      followers: targetUser.followers
    }
  }

  async toggleBlock(
    currentUserId: string,
    targetUserId: string
  ): Promise<{ message: string }> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot block yourself')
    }

    const { setting } = await this.settings.getByUser(currentUserId)

    const isBlocked = setting.blockedUser.some(
      (id: { toString: () => string }) => id.toString() === targetUserId
    )

    if (!isBlocked) {
      setting.blockedUser.push(targetUserId)
    } else {
      setting.blockedUser.pull(targetUserId)
    }

    await setting.save()
    return { message: !isBlocked ? 'User blocked successfully' : 'User unblocked successfully' }
  }

  async getSuggested(userId: string): Promise<{ admin: unknown; suggestedUsers: unknown[] }> {
    const currentUser = await this.users.findById(userId).select('following').lean()
    const following = currentUser?.following ?? []

    const users = await this.users.aggregate([
      { $match: { _id: { $ne: userId, $nin: following } } },
      { $project: { 'authentication.passwordHash': 0, 'authentication.refreshTokenHash': 0 } },
      { $sample: { size: 10 } }
    ])

    const admin = await this.users.findFirstByCreatedAt()

    const suggestedUsers = users
      .filter((u: { _id: { toString: () => string } }) => u._id.toString() !== admin?._id.toString())
      .slice(0, 2)

    return { admin, suggestedUsers }
  }
}
