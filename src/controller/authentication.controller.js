import Setting from '../db/setting.model.js'
import { createUser, getUserById, getUserByUsername } from '../db/user.model.js'
import { hashPassword, comparePassword } from '../util/authenticationCrypto.js'
import { clearAuthCookies, setAccessCookie, setRefreshCookie } from '../util/cookieHelper.js'
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../util/jwt.js'
import validatePassword from '../util/validatePassword.js'

const issueTokens = async (user) => {
  const userId = user._id.toString()
  const role = user.role ?? 'user'
  const accessToken = signAccessToken({ userId, role })
  const refreshToken = signRefreshToken({ userId })
  user.authentication.refreshTokenHash = hashToken(refreshToken)
  await user.save()
  return { accessToken, refreshToken }
}

export const register = async (request, response) => {
  try {
    const { username, password, confirmPassword } = request.body

    if (!username || !password) {
      return response.status(400).json({ error: true, message: 'Missing username or password' })
    }

    const existingUser = await getUserByUsername(username)
    if (existingUser) {
      return response.status(400).json({ error: true, message: 'User already exists' })
    }

    const validationError = validatePassword(password, confirmPassword)
    if (validationError) {
      return response.status(400).json(validationError)
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({
      username,
      authentication: { passwordHash }
    })

    const userSettings = await Setting.create({ user: user._id.toString() })
    await userSettings.save()

    return response.status(200).json({
      error: false,
      message: 'Success',
      registerResult: {
        userId: user._id.toString(),
        name: user.name
      }
    })
  } catch (error) {
    console.log(error)
    return response.status(400).json({ error: true, message: 'Error registering user' })
  }
}

export const login = async (request, response) => {
  try {
    const { username, password } = request.body

    if (!username || !password) {
      return response.status(400).json({ error: true, message: 'Missing username or password' })
    }

    const user = await getUserByUsername(username).select(
      '+authentication.passwordHash +authentication.refreshTokenHash'
    )

    if (!user) {
      return response.status(404).json({ error: true, message: 'Login: User does not exist' })
    }

    if (!user.authentication?.passwordHash) {
      return response
        .status(409)
        .json({ error: true, message: 'Account uses legacy credentials. Please reset your password.' })
    }

    const ok = await comparePassword(password, user.authentication.passwordHash)
    if (!ok) {
      return response.status(403).json({ error: true, message: 'Invalid password' })
    }

    const { accessToken, refreshToken } = await issueTokens(user)

    setAccessCookie(response, accessToken)
    setRefreshCookie(response, refreshToken)

    // Strip sensitive fields from response payload
    user.authentication.passwordHash = undefined
    user.authentication.refreshTokenHash = undefined

    return response.status(200).json(user)
  } catch (error) {
    console.log(error)
    return response.status(400).json({ error: true, message: 'Error' })
  }
}

export const logout = async (request, response) => {
  try {
    const token = request.cookies['mesom-refresh']
    if (token) {
      try {
        const { userId } = verifyRefreshToken(token)
        const user = await getUserById(userId).select('+authentication.refreshTokenHash')
        if (user) {
          user.authentication.refreshTokenHash = null
          await user.save()
        }
      } catch {
        // token đã hết hạn hoặc không hợp lệ — tiếp tục clear cookie
      }
    }
    clearAuthCookies(response)
    return response.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.log(error)
    return response.status(400).json({ error: true, message: 'Error logging out' })
  }
}

export const refresh = async (request, response) => {
  const token = request.cookies['mesom-refresh']
  if (!token) {
    return response.status(401).json({ error: true, message: 'No refresh token' })
  }
  try {
    const { userId } = verifyRefreshToken(token)
    const user = await getUserById(userId).select('+authentication.refreshTokenHash')

    if (!user || user.authentication.refreshTokenHash !== hashToken(token)) {
      if (user) {
        user.authentication.refreshTokenHash = null
        await user.save()
      }
      clearAuthCookies(response)
      return response.status(401).json({ error: true, message: 'Token reuse detected' })
    }

    const { accessToken, refreshToken } = await issueTokens(user)

    setAccessCookie(response, accessToken)
    setRefreshCookie(response, refreshToken)

    user.authentication.refreshTokenHash = undefined

    return response.status(200).json(user)
  } catch {
    clearAuthCookies(response)
    return response.status(401).json({ error: true, message: 'Refresh token invalid or expired' })
  }
}

export const getCurrentUser = async (request, response) => {
  try {
    const user = await getUserById(request.identify.userId)
    if (!user) {
      return response.status(404).json({ error: true, message: 'User not found' })
    }
    return response.status(200).json(user)
  } catch (error) {
    console.log(error)
    return response.status(400).json({ error: true, message: 'Error getting current user' })
  }
}

export const updatePassword = async (request, response) => {
  const { userId } = request.identify
  const { oldPassword, newPassword, confirmPassword } = request.body
  try {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return response.status(400).json({ error: 'Please fill in all the fields' })
    }

    const user = await getUserById(userId).select('+authentication.passwordHash +authentication.refreshTokenHash')
    if (!user) {
      return response.status(404).json({ error: true, message: 'User does not exist' })
    }

    const oldOk = await comparePassword(oldPassword, user.authentication.passwordHash)
    if (!oldOk) {
      return response.status(403).json({ error: 'Your password is incorrect' })
    }

    const sameAsOld = await comparePassword(newPassword, user.authentication.passwordHash)
    if (sameAsOld) {
      return response.status(400).json({ error: 'New password cannot be same as old password' })
    }

    const validationError = validatePassword(newPassword, confirmPassword)
    if (validationError) {
      return response.status(400).json(validationError)
    }

    user.authentication.passwordHash = await hashPassword(newPassword)
    user.authentication.refreshTokenHash = null
    await user.save()

    clearAuthCookies(response)
    return response.status(200).json({ message: 'Password updated successfully. Please log in again.' })
  } catch (error) {
    console.log('Error in updatePassword', error)
    return response.status(500).json({ error: `Error: ${error}` })
  }
}
