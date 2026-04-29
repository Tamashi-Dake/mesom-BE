import { Injectable, NotFoundException } from '@nestjs/common'
import _Notification from '~/db/notification.model.js'

type AnyQuery = any
const Notification = _Notification as {
  countDocuments: (filter: unknown) => Promise<number>
  find: (filter: unknown) => AnyQuery
  findOne: (filter: unknown) => AnyQuery
  updateOne: (filter: unknown, update: unknown) => Promise<any>
  updateMany: (filter: unknown, update: unknown) => Promise<any>
  create: (doc: unknown) => Promise<any>
}

@Injectable()
export class NotificationService {
  async getUserNotifications(userId: string, limit: number, skip: number) {
    const filter = { to: userId, deleted: false, show: true }
    const totalNotifications = await Notification.countDocuments(filter)

    if (totalNotifications === 0) {
      return { notifications: [], totalNotifications: 0, limit, skip, nextSkip: null }
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('from', 'displayName username profile.avatarImg profile.coverImg profile.bio following followers')

    const remaining = totalNotifications - skip - limit
    return { notifications, totalNotifications, limit, skip, nextSkip: remaining > 0 ? skip + limit : null }
  }

  async getUserMentions(userId: string, limit: number, skip: number) {
    const filter = { to: userId, type: 'reply', deleted: false, show: true }
    const totalNotifications = await Notification.countDocuments(filter)

    if (totalNotifications === 0) {
      return { mentions: [], totalNotifications: 0, limit, skip, nextSkip: null }
    }

    const mentions = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('from', 'displayName username profile.avatarImg profile.coverImg profile.bio following followers')
      .populate('post')

    const remaining = totalNotifications - skip - limit
    return { mentions, totalNotifications, limit, skip, nextSkip: remaining > 0 ? skip + limit : null }
  }

  async toggleRead(userId: string, notificationId: string) {
    const notification = await Notification.findOne({ _id: notificationId, to: userId })
    if (!notification) throw new NotFoundException(`Notification ${notificationId} not found`)

    const read = !notification.read
    await Notification.updateOne({ _id: notificationId }, { read })
    return { message: `Notification ${notificationId} marked as ${read ? 'read' : 'unread'}` }
  }

  async markAllRead(userId: string) {
    const notifications = await Notification.updateMany({ to: userId }, { read: true })
    return { notifications, message: 'All notifications marked as read' }
  }

  async delete(userId: string, notificationId: string) {
    const notification = await Notification.findOne({ _id: notificationId, to: userId })
    if (!notification) throw new NotFoundException(`Notification ${notificationId} not found`)

    await Notification.updateOne({ _id: notificationId }, { deleted: true, deletedAt: new Date() })
    return { message: 'Notification deleted successfully' }
  }

  async deleteAll(userId: string) {
    await Notification.updateMany({ to: userId }, { deleted: true, deletedAt: new Date() })
    return { message: 'All notifications deleted' }
  }

  // Used by UserService (follow/unfollow logic)
  async findFollowNotification(fromUserId: string, toUserId: string) {
    return Notification.findOne({ type: 'follow', from: fromUserId, to: toUserId })
  }

  // Used by PostService (like/share/reply)
  async findNotification(fromUserId: string, toUserId: string, type: string, postId?: string) {
    return Notification.findOne({
      from: fromUserId,
      to: toUserId,
      type,
      ...(postId ? { post: postId } : {})
    })
  }

  async create(from: string, to: string, type: string, post?: string) {
    return Notification.create({ from, to, type, ...(post ? { post } : {}) })
  }

  async updateShow(id: string, show: boolean) {
    return Notification.updateOne({ _id: id }, { show })
  }
}
