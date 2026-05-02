import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'

import { NotificationService } from '~/modules/notification/notificationService.js'
import { SettingService } from '~/modules/setting/settingService.js'
import { randomDelay } from '~/util/delay.js'
import { updateUserInterest } from '~/util/interest.js'
import uploadImagesToCloudinary from '~/util/uploadImagesToCloudinary.js'
import _Post from '~/db/post.model.js'
import _Tag from '~/db/tag.model.js'
import _View from '~/db/view.model.js'
import { User as _User } from '~/db/user.model.js'

type AnyQuery = any
const Post = _Post as {
  find: (filter: unknown) => AnyQuery
  findById: (id: unknown) => AnyQuery
  findOne: (filter: unknown) => AnyQuery
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => AnyQuery
  countDocuments: (filter: unknown) => Promise<number>
  create: (doc: unknown) => Promise<any>
  updateOne: (filter: unknown, update: unknown) => Promise<any>
}
const Tag = _Tag as {
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => AnyQuery
  updateOne: (filter: unknown, update: unknown) => Promise<any>
}
const View = _View as {
  findOne: (filter: unknown) => AnyQuery
  create: (doc: unknown) => Promise<any>
}
const User = _User as {
  findById: (id: unknown) => AnyQuery
  updateOne: (filter: unknown, update: unknown) => Promise<any>
}

function extractTagNames(text?: string): string[] {
  if (!text) return []
  const matches = text.match(/#(\w+)/g) ?? []
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))].slice(0, 5)
}

const AUTHOR_POPULATE = 'displayName username profile.avatarImg profile.coverImg profile.bio following followers'

@Injectable()
export class PostService {
  constructor(
    private readonly notifications: NotificationService,
    private readonly settings: SettingService
  ) {}

  private buildCursorResult<T extends { _id: any }>(docs: T[], limit: number) {
    const hasMore = docs.length > limit
    const result = docs.slice(0, limit)
    const nextCursor = hasMore ? result[result.length - 1]._id.toString() : null
    return { result, nextCursor, hasMore }
  }

  async getAllPosts(limit: number, cursor: string | null) {
    const filter: any = { parent: { $exists: false }, deleted: false }
    if (cursor) filter._id = { $lt: cursor }
    const posts = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({ path: 'author', select: AUTHOR_POPULATE })
    const { result, nextCursor, hasMore } = this.buildCursorResult(posts, limit)
    return { posts: result, nextCursor, hasMore }
  }

  async getPostsByFollowing(userId: string, limit: number, cursor: string | null) {
    const user = await User.findById(userId).select('following')
    if (!user) throw new NotFoundException('User not found')
    const following = user.following ?? []

    const filter: any = { author: { $in: following }, parent: { $exists: false }, deleted: false }
    if (cursor) filter._id = { $lt: cursor }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({ path: 'author', select: AUTHOR_POPULATE })

    const { result, nextCursor, hasMore } = this.buildCursorResult(posts, limit)
    return { posts: result, nextCursor, hasMore }
  }

  async getUserBookmarks(userId: string, limit: number, cursor: string | null) {
    const user = await User.findById(userId)
    if (!user) throw new NotFoundException('User not found')

    const bookmarks: Array<{ post: any; bookmarkedAt: Date }> = user.bookmarks ?? []
    if (bookmarks.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false }
    }

    const validBookmarks: typeof bookmarks = []
    const invalidPostIds: unknown[] = []

    for (const bookmark of bookmarks) {
      const post = await Post.findById(bookmark.post).select('id deleted')
      if (post && !post.deleted) {
        validBookmarks.push(bookmark)
      } else {
        invalidPostIds.push(bookmark.post)
      }
    }

    if (invalidPostIds.length > 0) {
      await User.updateOne(
        { _id: userId },
        { $pull: { bookmarks: { post: { $in: invalidPostIds } } } }
      )
    }

    if (validBookmarks.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false }
    }

    validBookmarks.sort((a, b) => (b.bookmarkedAt as any) - (a.bookmarkedAt as any))

    // cursor = post._id of the last bookmark from previous page
    let startIdx = 0
    if (cursor) {
      const idx = validBookmarks.findIndex((b) => b.post.toString() === cursor)
      if (idx !== -1) startIdx = idx + 1
    }

    const paged = validBookmarks.slice(startIdx, startIdx + limit + 1)
    const hasMore = paged.length > limit
    const pagePart = paged.slice(0, limit)
    const nextCursor = hasMore ? pagePart[pagePart.length - 1].post.toString() : null

    const postIds = pagePart.map((b) => b.post)
    const posts = await Post.find({ _id: { $in: postIds }, deleted: false }).populate({
      path: 'author',
      select: AUTHOR_POPULATE
    })
    const sortedPosts = postIds.map((id: any) =>
      posts.find((p: any) => p._id.toString() === id.toString())
    )

    return { posts: sortedPosts, nextCursor, hasMore }
  }

  async getPost(postId: string) {
    const post = await Post.findById(postId).populate({
      path: 'author',
      select: ' ' + AUTHOR_POPULATE
    })
    if (!post) throw new NotFoundException('Post not found')
    if (post.deleted) {
      return { _id: post._id, deleted: true, author: { username: post.author.username } }
    }
    return post
  }

  async createPost(userId: string, text: string | undefined, files: Express.Multer.File[]) {
    if (!text && files.length === 0) {
      throw new BadRequestException('Please provide text or image in the post')
    }
    const imageSecureURLs = await uploadImagesToCloudinary(files, 'Mesom/PostImage')

    const tagNames = extractTagNames(text)
    const tagIds: string[] = []
    for (const name of tagNames) {
      const tag = await Tag.findOneAndUpdate(
        { name },
        { $inc: { postCount: 1 } },
        { upsert: true, new: true }
      )
      tagIds.push(tag._id.toString())
    }

    const post = await Post.create({ author: userId, text, images: imageSecureURLs, tags: tagIds })
    return post
  }

  async deletePost(userId: string, postId: string) {
    const post = await Post.findById(postId)
    if (!post) throw new NotFoundException('Post not found')
    if (post.author.toString() !== userId) {
      throw new ForbiddenException('You are not authorized to delete this post')
    }

    if (post.images?.length > 0) {
      for (const img of post.images) {
        const publicId = img.split('/').pop()?.split('.')[0]
        if (publicId) await cloudinary.uploader.destroy(`Mesom/PostImage/${publicId}`)
      }
    }

    if (post.tags?.length > 0) {
      for (const tagId of post.tags) {
        await Tag.updateOne({ _id: tagId }, { $inc: { postCount: -1 } })
      }
    }

    await Post.updateOne({ _id: postId }, { $set: { deleted: true, images: [] } })

    if (post.parent?.parentPostID) {
      const updatedPost = await Post.findOneAndUpdate(
        { _id: post.parent.parentPostID },
        { $inc: { userReplies: -1 } },
        { new: true }
      )
      return { message: 'Reply deleted successfully', numberReplies: updatedPost?.userReplies }
    }
    return { message: 'Post deleted successfully' }
  }

  async getRepliesForPost(postId: string, limit: number, cursor: string | null) {
    const filter: any = { 'parent.parentPostID': postId, deleted: false }
    if (cursor) filter._id = { $lt: cursor }

    const replies = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({ path: 'author', select: AUTHOR_POPULATE })

    const { result, nextCursor, hasMore } = this.buildCursorResult(replies, limit)
    return { posts: result, nextCursor, hasMore }
  }

  async createReplyPost(
    userId: string,
    parentPostId: string,
    text: string | undefined,
    authorName: string | undefined,
    files: Express.Multer.File[]
  ) {
    const parentPost = await Post.findById(parentPostId)
    if (!parentPost) throw new NotFoundException('Parent post not found')

    const imageSecureURLs = await uploadImagesToCloudinary(files, 'Mesom/PostImage')
    const replyPost = await Post.create({
      author: userId,
      text,
      images: imageSecureURLs,
      parent: { parentPostID: parentPostId, authorName }
    })

    const updatedPost = await Post.findOneAndUpdate(
      { _id: parentPostId },
      { $inc: { userReplies: 1 } },
      { new: true }
    )

    if (parentPost.author.toString() !== userId) {
      const blocked = await this.settings.isNotificationBlockedForPost(
        parentPost.author.toString(),
        parentPostId,
        'reply'
      )
      if (!blocked) {
        await this.notifications.create(userId, parentPost.author.toString(), 'reply', replyPost._id.toString())
      }
    }

    setImmediate(() => updateUserInterest(userId, parentPostId, 'reply').catch(() => {}))
    return { replyPost, numberReplies: updatedPost?.userReplies }
  }

  async getPostsByUser(userId: string, limit: number, cursor: string | null) {
    const filter: any = {
      $or: [
        { parent: { $exists: false }, author: userId },
        { parent: { $exists: false }, userShared: userId }
      ],
      deleted: false
    }
    if (cursor) filter._id = { $lt: cursor }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({ path: 'author', select: AUTHOR_POPULATE })

    const { result, nextCursor, hasMore } = this.buildCursorResult(posts, limit)
    return { posts: result, nextCursor, hasMore }
  }

  async getRepliesByUser(userId: string, limit: number, cursor: string | null) {
    const filter: any = { parent: { $exists: true }, author: userId, deleted: false }
    if (cursor) filter._id = { $lt: cursor }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({ path: 'author', select: AUTHOR_POPULATE })

    const { result, nextCursor, hasMore } = this.buildCursorResult(posts, limit)
    return { posts: result, nextCursor, hasMore }
  }

  async getMediasByUser(userId: string, limit: number, cursor: string | null) {
    const filter: any = {
      parent: { $exists: false },
      author: userId,
      deleted: false,
      images: { $ne: [] }
    }
    if (cursor) filter._id = { $lt: cursor }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({ path: 'author', select: AUTHOR_POPULATE })

    const { result, nextCursor, hasMore } = this.buildCursorResult(posts, limit)
    return { posts: result, nextCursor, hasMore }
  }

  async getLikedPostsByUser(userId: string, limit: number, cursor: string | null) {
    const filter: any = { userLikes: userId, deleted: false }
    if (cursor) filter._id = { $lt: cursor }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({ path: 'author', select: AUTHOR_POPULATE })

    const { result, nextCursor, hasMore } = this.buildCursorResult(posts, limit)
    return { posts: result, nextCursor, hasMore }
  }

  async toggleLikePost(postId: string, userId: string) {
    const post = await Post.findById(postId)
    if (!post) throw new NotFoundException('Post not found')

    const isLiked = post.userLikes.includes(userId)
    const likeNotification = await this.notifications.findNotification(userId, post.author.toString(), 'like', postId)

    if (!isLiked) {
      post.userLikes.push(userId)
      if (post.author.toString() !== userId) {
        if (likeNotification) {
          await this.notifications.updateShow(likeNotification._id.toString(), true)
        } else {
          const blocked = await this.settings.isNotificationBlockedForPost(
            post.author.toString(),
            postId,
            'like'
          )
          if (!blocked) {
            await this.notifications.create(userId, post.author.toString(), 'like', postId)
          }
        }
      }
    } else {
      post.userLikes.pull(userId)
      if (likeNotification) {
        await this.notifications.updateShow(likeNotification._id.toString(), false)
      }
    }

    await post.save()
    if (!isLiked) setImmediate(() => updateUserInterest(userId, postId, 'like').catch(() => {}))
    return { message: !isLiked ? 'Post liked' : 'Post unliked', likes: post.userLikes }
  }

  async toggleSharePost(postId: string, userId: string) {
    const post = await Post.findById(postId)
    if (!post) throw new NotFoundException('Post not found')

    const isShared = post.userShared.includes(userId)
    const shareNotification = await this.notifications.findNotification(
      userId,
      post.author.toString(),
      'share',
      postId
    )

    if (!isShared) {
      post.userShared.push(userId)
      if (post.author.toString() !== userId) {
        if (shareNotification) {
          await this.notifications.updateShow(shareNotification._id.toString(), true)
        } else {
          const blocked = await this.settings.isNotificationBlockedForPost(
            post.author.toString(),
            postId,
            'share'
          )
          if (!blocked) {
            await this.notifications.create(userId, post.author.toString(), 'share', postId)
          }
        }
      }
    } else {
      post.userShared.pull(userId)
      if (shareNotification) {
        await this.notifications.updateShow(shareNotification._id.toString(), false)
      }
    }

    await post.save()
    if (!isShared) setImmediate(() => updateUserInterest(userId, postId, 'share').catch(() => {}))
    return { message: !isShared ? 'Post shared' : 'Post unshared', shares: post.userShared }
  }

  async toggleBookmarkPost(postId: string, userId: string) {
    const user = await User.findById(userId)
    if (!user) throw new NotFoundException('User not found')

    const isBookmarked = user.bookmarks.some(
      (b: { post: { toString: () => string } }) => b.post.toString() === postId
    )

    if (!isBookmarked) {
      user.bookmarks.push({ post: postId, bookmarkedAt: new Date() })
    } else {
      user.bookmarks = user.bookmarks.filter(
        (b: { post: { toString: () => string } }) => b.post.toString() !== postId
      )
    }
    await user.save()

    const bookmarkChange = isBookmarked ? -1 : 1
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      { $inc: { userBookmarks: bookmarkChange } },
      { new: true }
    )

    if (!isBookmarked) {
      setImmediate(() => updateUserInterest(userId, postId, 'bookmark').catch(() => {}))
    }
    return {
      message: !isBookmarked ? 'Post has been bookmarked' : 'Post has been removed from bookmarks',
      userBookmarks: updatedPost?.userBookmarks
    }
  }

  async increasePostView(postId: string, userId: string) {
    await randomDelay(500, 1500)
    const view = await View.findOne({ postID: postId, userID: userId })
    if (!view) {
      await View.create({ postID: postId, userID: userId })
      await Post.updateOne({ _id: postId }, { $inc: { views: 1 } })
      setImmediate(() => updateUserInterest(userId, postId, 'view').catch(() => {}))
      return { message: 'Post view increased' }
    }
    return { message: 'You just viewed this post' }
  }
}
