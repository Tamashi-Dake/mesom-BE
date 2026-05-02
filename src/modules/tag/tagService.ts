import { Injectable } from '@nestjs/common'
import _Tag from '~/db/tag.model.js'

type AnyQuery = any
const Tag = _Tag as {
  find: (filter: unknown) => AnyQuery
}

@Injectable()
export class TagService {
  async getTrending(limit = 20) {
    const tags = await Tag.find({}).sort({ postCount: -1 }).limit(limit).select('name postCount')
    return { tags }
  }

  async search(q: string, limit = 10) {
    if (!q?.trim()) return { tags: [] }
    const tags = await Tag.find({ name: { $regex: `^${q.trim().toLowerCase()}`, $options: 'i' } })
      .sort({ postCount: -1 })
      .limit(limit)
      .select('name postCount')
    return { tags }
  }
}
