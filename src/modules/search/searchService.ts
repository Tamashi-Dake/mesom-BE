import { Injectable } from '@nestjs/common'
import _Conversation from '~/db/conversation.model.js'
import { User as _User } from '~/db/user.model.js'

type AnyQuery = any
const User = _User as {
  find: (filter: unknown) => AnyQuery
  countDocuments: (filter: unknown) => Promise<number>
}
const Conversation = _Conversation as {
  find: (filter: unknown) => AnyQuery
  countDocuments: (filter: unknown) => Promise<number>
}

@Injectable()
export class SearchService {
  async searchUsers(query: string, limit: number, skip: number) {
    const filter = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    }
    const users = await User.find(filter).select('-bookmarks -pinnedPost').skip(skip).limit(limit)
    if (!users || users.length === 0) return { users: [], totalUsers: 0, limit, skip, nextSkip: null }

    const totalUsers = await User.countDocuments(filter)
    const remaining = totalUsers - skip - limit
    return { users, totalUsers, limit, skip, nextSkip: remaining > 0 ? skip + limit : null }
  }

  async searchConversations(userId: string, query: string, limit: number, skip: number) {
    const filter = {
      name: { $regex: query, $options: 'i' },
      participants: userId
    }
    const conversations = await Conversation.find(filter)
      .populate('participants', 'displayName username profile.avatarImg')
      .populate('lastMessage', 'text type createdAt')
      .skip(skip)
      .limit(limit)

    if (!conversations || conversations.length === 0) {
      return { conversations: [], totalConversations: 0, limit, skip, nextSkip: null }
    }

    const totalConversations = await Conversation.countDocuments(filter)
    const remaining = totalConversations - skip - limit
    return {
      conversations,
      totalConversations,
      limit,
      skip,
      nextSkip: remaining > 0 ? skip + limit : null
    }
  }
}
