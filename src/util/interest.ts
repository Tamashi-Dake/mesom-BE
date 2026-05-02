import _Post from '~/db/post.model.js'
import _UserInterest from '~/db/userInterest.model.js'

type AnyQuery = any
const Post = _Post as { findById: (id: unknown) => AnyQuery }
const UserInterest = _UserInterest as {
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => AnyQuery
}

const ACTION_WEIGHTS: Record<string, number> = {
  like: 2,
  share: 3,
  bookmark: 1.5,
  reply: 2,
  view: 0.3
}

export async function updateUserInterest(
  userId: string,
  postId: string,
  action: string
): Promise<void> {
  const weight = ACTION_WEIGHTS[action]
  if (!weight) return

  const post = await Post.findById(postId).select('tags')
  if (!post?.tags?.length) return

  const inc: Record<string, number> = {}
  for (const tagId of post.tags) {
    inc[`tagWeights.${tagId}`] = weight
  }

  await UserInterest.findOneAndUpdate(
    { userId },
    { $inc: inc, $set: { updatedAt: new Date() } },
    { upsert: true }
  )
}
