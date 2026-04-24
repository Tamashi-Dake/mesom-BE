import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const getAccessSecret = () => {
  const secret = process.env.ACCESS_TOKEN_SECRET
  if (!secret) throw new Error('Missing ACCESS_TOKEN_SECRET in environment')
  return secret
}

const getRefreshSecret = () => {
  const secret = process.env.REFRESH_TOKEN_SECRET
  if (!secret) throw new Error('Missing REFRESH_TOKEN_SECRET in environment')
  return secret
}

export interface AccessTokenPayload {
  userId: string
  role: string
}

export interface RefreshTokenPayload {
  userId: string
}

export const signAccessToken = ({ userId, role }: AccessTokenPayload) =>
  jwt.sign({ userId, role }, getAccessSecret(), { expiresIn: '15m' })

export const signRefreshToken = ({ userId }: RefreshTokenPayload) =>
  jwt.sign({ userId }, getRefreshSecret(), {
    expiresIn: '7d',
    jwtid: crypto.randomBytes(16).toString('hex')
  })

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, getAccessSecret()) as AccessTokenPayload & jwt.JwtPayload

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, getRefreshSecret()) as RefreshTokenPayload & jwt.JwtPayload

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')
