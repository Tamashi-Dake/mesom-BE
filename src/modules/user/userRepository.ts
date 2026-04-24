import { Injectable } from '@nestjs/common'

// Bridge wrapper around the legacy `User` mongoose model. Swapped to
// `@InjectModel(User.name)` once `src/db/user.model.js` is deleted in Phase 3.
import {
  User as _User,
  createUser as _createUser,
  deleteUserById as _deleteUserById,
  getUserById as _getUserById,
  getUserByUsername as _getUserByUsername
} from '~/db/user.model.js'

type AnyUserDoc = any
type AnyQuery = any

const User = _User as {
  find: (...args: unknown[]) => AnyQuery
  findOne: (...args: unknown[]) => AnyQuery
  aggregate: (pipeline: unknown[]) => Promise<AnyUserDoc[]>
}

@Injectable()
export class UserRepository {
  findById(id: string): AnyQuery {
    return (_getUserById as (id: string) => AnyQuery)(id)
  }

  findByUsername(username: string): AnyQuery {
    return (_getUserByUsername as (username: string) => AnyQuery)(username)
  }

  create(data: unknown): Promise<AnyUserDoc> {
    return (_createUser as (data: unknown) => Promise<AnyUserDoc>)(data)
  }

  deleteById(id: string): Promise<AnyUserDoc> {
    return (_deleteUserById as (id: string) => Promise<AnyUserDoc>)(id)
  }

  aggregate(pipeline: unknown[]): Promise<AnyUserDoc[]> {
    return User.aggregate(pipeline)
  }

  findFirstByCreatedAt(): AnyQuery {
    return User.findOne()
      .sort({ createdAt: 1 })
      .select('-authentication.passwordHash -authentication.refreshTokenHash')
  }
}
