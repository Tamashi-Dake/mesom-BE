import { Injectable, NotFoundException } from '@nestjs/common'
import _Setting from '~/db/setting.model.js'

type AnyDoc = any
type AnyQuery = any
const Setting = _Setting as {
  findOne: (filter: unknown) => AnyQuery
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => AnyQuery
  updateOne: (filter: unknown, update: unknown) => Promise<unknown>
  create: (doc: unknown) => Promise<AnyDoc>
}

@Injectable()
export class SettingService {
  async getByUser(userId: string) {
    const setting = await Setting.findOne({ user: userId })
    if (!setting) throw new NotFoundException('Setting not found')
    return { setting }
  }

  async getDisplayByUser(userId: string) {
    const userSetting = await Setting.findOne({ user: userId }).select('themePreferences')
    if (!userSetting) throw new NotFoundException('Setting not found')
    return {
      theme: userSetting.themePreferences.theme,
      accent: userSetting.themePreferences.accent
    }
  }

  async updateByUser(userId: string, setting: unknown) {
    const exists = await Setting.findOne({ user: userId })
    if (!exists) throw new NotFoundException('Setting not found')
    await Setting.updateOne({ user: userId }, { $set: setting })
    return { message: 'Setting updated successfully' }
  }

  async updateDisplayByUser(userId: string, theme?: string, accent?: string) {
    const updatedSetting = await Setting.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          'themePreferences.theme': theme || 'light',
          'themePreferences.accent': accent || 'blue'
        }
      },
      { new: true, runValidators: true }
    )
    if (!updatedSetting) throw new NotFoundException('Setting not found')
    return {
      message: 'Theme preferences updated successfully',
      themePreferences: updatedSetting.themePreferences
    }
  }

  async createForUser(userId: string) {
    return Setting.create({ user: userId })
  }

  // Used by UserService — check if follow notification is blocked for target user
  async isFollowNotificationBlocked(userId: string): Promise<boolean> {
    const settings = await Setting.findOne({ user: userId })
    if (!settings) return false
    return !settings.notificationPreferences?.blockedType?.follow
  }

  // Used by PostService — check if a notification type is blocked for a post's author
  async isNotificationBlockedForPost(
    authorId: string,
    postId: string,
    type: string
  ): Promise<boolean> {
    const settings = await Setting.findOne({ user: authorId })
    if (!settings) return false
    const isTypeBlocked = !settings.notificationPreferences?.blockedType?.[type]
    const isPostBlocked = (settings.notificationPreferences?.blockedPost ?? []).some(
      (id: { toString: () => string }) => id.toString() === postId
    )
    return isTypeBlocked || isPostBlocked
  }

  // Used by UserService — get blocked user IDs for a user
  async getBlockedUserIds(userId: string): Promise<unknown[]> {
    const setting = await Setting.findOne({ user: userId }).select('blockedUser')
    if (!setting) return []
    return setting.blockedUser
  }
}
