import { Injectable } from '@nestjs/common'
import { SettingService } from '~/modules/setting/settingService.js'
import _Post from '~/db/post.model.js'
import _UserInterest from '~/db/userInterest.model.js'
import _View from '~/db/view.model.js'
import { User as _User } from '~/db/user.model.js'

type AnyQuery = any
const Post = _Post as {
  find: (filter: unknown) => AnyQuery
  insertMany: (docs: unknown[], options: unknown) => Promise<any>
}
const UserInterest = _UserInterest as {
  findOne: (filter: unknown) => AnyQuery
}
const View = _View as {
  distinct: (field: string, filter: unknown) => Promise<any[]>
  insertMany: (docs: unknown[], options: unknown) => Promise<any>
}
const User = _User as {
  findById: (id: unknown) => AnyQuery
  distinct: (field: string, filter: unknown) => Promise<any[]>
}

const TIME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

const POST_SELECT =
  'author content text images tags userLikes userShared userBookmarks userReplies views deleted createdAt'

const AUTHOR_POPULATE =
  'displayName username profile.avatarImg profile.coverImg profile.bio following followers'

interface ScoredPost {
  _id: any
  author: any
  [key: string]: any
  _score: number
  _isFollowing: boolean
}

// ── Phase 2 — Candidate collection ──────────────────────────────────────────

async function collectCandidates(
  userId: string,
  blockedIds: string[],
  blockedByIds: string[],
  cursor: string | null,
  limit: number
) {
  const user = await User.findById(userId).select('following')
  const following: any[] = user?.following ?? []

  // Exclude blocked + users who blocked me from following list
  const excludedSet = new Set([...blockedIds, ...blockedByIds, userId])
  const safeFollowing = following.filter((id: any) => !excludedSet.has(id.toString()))

  const timeWindow = new Date(Date.now() - TIME_WINDOW_MS)
  const cursorFilter = cursor ? { _id: { $lt: cursor } } : {}

  // Pool 1: posts from followed users (70% of candidates)
  const followingPosts = await Post.find({
    author: { $in: safeFollowing },
    parent: { $exists: false },
    deleted: false,
    createdAt: { $gte: timeWindow },
    ...cursorFilter
  })
    .sort({ createdAt: -1 })
    .limit(limit * 3)
    .select(POST_SELECT)
    .populate({ path: 'author', select: AUTHOR_POPULATE })
    .lean()

  // Pool 2: friends-of-friends suggested posts (30% of candidates)
  const fofIds: any[] = await User.distinct('following', { _id: { $in: safeFollowing } })
  const suggestedAuthors = fofIds.filter((id: any) => {
    const s = id.toString()
    return !excludedSet.has(s) && !safeFollowing.some((f: any) => f.toString() === s)
  })

  const suggestedPosts = await Post.find({
    author: { $in: suggestedAuthors },
    parent: { $exists: false },
    deleted: false,
    createdAt: { $gte: timeWindow },
    ...cursorFilter
  })
    .sort({ createdAt: -1 })
    .limit(limit * 2)
    .select(POST_SELECT)
    .populate({ path: 'author', select: AUTHOR_POPULATE })
    .lean()

  return { followingPosts, suggestedPosts }
}

// ── Phase 2 — Scoring ────────────────────────────────────────────────────────

function calculateScore(
  post: any,
  userInterest: any,
  viewedPostIds: Set<string>
): number {
  const likes = post.userLikes?.length ?? 0
  const shares = post.userShared?.length ?? 0
  const replies = post.userReplies ?? 0
  const views = post.views ?? 0
  const bookmarks = post.userBookmarks ?? 0

  let score = likes * 2 + shares * 3 + replies * 2 + views * 0.5 + bookmarks * 1.5

  // Freshness decay — half-life 24 hours
  const hoursOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60)
  score *= Math.pow(0.5, hoursOld / 24)

  // Social graph bonus — posts from following score 50% higher
  if (post._isFollowing) score *= 1.5

  // Interest matching — bonus for matching user's tag interests
  if (userInterest?.tagWeights && post.tags?.length) {
    let interestBonus = 0
    for (const tag of post.tags) {
      const tagId = tag._id?.toString() ?? tag.toString()
      // tagWeights can be a Map (document) or plain object (lean)
      const weight =
        typeof userInterest.tagWeights.get === 'function'
          ? (userInterest.tagWeights.get(tagId) ?? 0)
          : (userInterest.tagWeights[tagId] ?? 0)
      interestBonus += weight
    }
    score *= 1 + Math.min(interestBonus / 10, 2)
  }

  // Seen penalty — posts viewed recently score 80% lower
  if (viewedPostIds.has(post._id.toString())) score *= 0.2

  return score
}

// ── Phase 4 — Author diversity ───────────────────────────────────────────────

function diversify(posts: ScoredPost[], maxConsecutive = 2): ScoredPost[] {
  const result: ScoredPost[] = []
  const remaining = [...posts]

  while (remaining.length > 0) {
    let placed = false
    for (let i = 0; i < remaining.length; i++) {
      const post = remaining[i]
      const authorId = post.author?._id?.toString() ?? post.author?.toString() ?? ''
      const recentAuthors = result
        .slice(-maxConsecutive)
        .map((p) => p.author?._id?.toString() ?? p.author?.toString() ?? '')
      const consecutive = recentAuthors.filter((a) => a === authorId).length

      if (consecutive < maxConsecutive) {
        result.push(post)
        remaining.splice(i, 1)
        placed = true
        break
      }

      // Last candidate — add it anyway to avoid infinite loop
      if (i === remaining.length - 1) {
        result.push(remaining.shift()!)
        placed = true
      }
    }
    if (!placed) break
  }

  return result
}

// ── Phase 2 — Main timeline function ─────────────────────────────────────────

@Injectable()
export class TimelineService {
  constructor(private readonly settings: SettingService) {}

  async getTimeline(userId: string, cursor: string | null = null, limit = 20) {
    // Phase 4 — gather exclude lists before fetching
    const [blockedIds, blockedByIds] = await Promise.all([
      this.settings.getBlockedUserIds(userId),
      this.settings.getUsersWhoBlocked(userId)
    ])

    const blockedStrings = (blockedIds as any[]).map((id: any) => id.toString())
    const blockedByStrings = (blockedByIds as any[]).map((id: any) => id.toString())

    const { followingPosts, suggestedPosts } = await collectCandidates(
      userId,
      blockedStrings,
      blockedByStrings,
      cursor,
      limit
    )

    // Tag following posts, merge, deduplicate
    ;(followingPosts as any[]).forEach((p: any) => { p._isFollowing = true })
    ;(suggestedPosts as any[]).forEach((p: any) => { p._isFollowing = false })

    const seen = new Set<string>()
    const unique = [...followingPosts, ...suggestedPosts].filter((p: any) => {
      const id = p._id.toString()
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    // Load scoring context
    const [userInterest, recentViewIds] = await Promise.all([
      UserInterest.findOne({ userId }).lean(),
      View.distinct('postID', { userID: userId })
    ])

    const viewedPostIds = new Set<string>(recentViewIds.map((id: any) => id.toString()))

    // Score → sort → diversify (Phase 4) → paginate
    const scored: ScoredPost[] = unique.map((post: any) => ({
      ...post,
      _score: calculateScore(post, userInterest, viewedPostIds)
    }))

    scored.sort((a, b) => b._score - a._score)

    const diversified = diversify(scored)
    const page = diversified.slice(0, limit)
    const nextCursor = page.length === limit ? page[page.length - 1]._id.toString() : null

    // Strip internal fields before returning
    const posts = page.map(({ _score, _isFollowing, ...post }) => post)

    // Record served posts in background (for seen-penalty on next load)
    setImmediate(async () => {
      try {
        const viewDocs = posts.map((post: any) => ({
          userID: userId,
          postID: post._id,
          createdAt: new Date()
        }))
        await View.insertMany(viewDocs, { ordered: false })
      } catch {
        // ignore — view recording is best-effort
      }
    })

    return { posts, nextCursor, hasMore: nextCursor !== null }
  }
}
