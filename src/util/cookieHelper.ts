import { Response } from 'express'

const ACCESS_MAX_AGE = 15 * 60 * 1000
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export const ACCESS_COOKIE_NAME = 'mesom-access'
export const REFRESH_COOKIE_NAME = 'mesom-refresh'
export const REFRESH_COOKIE_PATH = '/auth/refresh'

const baseCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax'
  }
}

export const setAccessCookie = (res: Response, token: string) =>
  res.cookie(ACCESS_COOKIE_NAME, token, { ...baseCookieOptions(), path: '/', maxAge: ACCESS_MAX_AGE })

export const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_MAX_AGE
  })

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: '/' })
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH })
}
