import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import type { Response } from 'express'

// Setting module migrates in Phase 2.4; bridge directly until then.
import _Setting from '~/db/setting.model.js'

import { UserRepository } from '~/modules/user/userRepository.js'
import { comparePassword, hashPassword } from '~/util/authenticationCrypto.js'
import {
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie
} from '~/util/cookieHelper.js'
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '~/util/jwt.js'

import type { LoginDto } from './dto/loginDto.js'
import type { RegisterDto } from './dto/registerDto.js'
import type { UpdatePasswordDto } from './dto/updatePasswordDto.js'

const Setting = _Setting as { create: (doc: unknown) => Promise<unknown> }

@Injectable()
export class AuthService {
  constructor(private readonly users: UserRepository) {}

  private async issueTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const userId = user._id.toString()
    const role = user.role ?? 'user'
    const accessToken = signAccessToken({ userId, role })
    const refreshToken = signRefreshToken({ userId })
    user.authentication.refreshTokenHash = hashToken(refreshToken)
    await user.save()
    return { accessToken, refreshToken }
  }

  async register(dto: RegisterDto): Promise<{ userId: string; name: string | undefined }> {
    const { username, password, confirmPassword } = dto

    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match')
    }

    const existingUser = await this.users.findByUsername(username)
    if (existingUser) {
      throw new BadRequestException('User already exists')
    }

    const passwordHash = await hashPassword(password)
    const user = await this.users.create({ username, authentication: { passwordHash } })

    await Setting.create({ user: user._id.toString() })

    return { userId: user._id.toString(), name: user.name }
  }

  async login(dto: LoginDto, response: Response): Promise<unknown> {
    const { username, password } = dto

    const user = await this.users
      .findByUsername(username)
      .select('+authentication.passwordHash +authentication.refreshTokenHash')

    if (!user) {
      throw new NotFoundException('Login: User does not exist')
    }

    if (!user.authentication?.passwordHash) {
      throw new ConflictException('Account uses legacy credentials. Please reset your password.')
    }

    const ok = await comparePassword(password, user.authentication.passwordHash)
    if (!ok) {
      throw new ForbiddenException('Invalid password')
    }

    const { accessToken, refreshToken } = await this.issueTokens(user)
    setAccessCookie(response, accessToken)
    setRefreshCookie(response, refreshToken)

    user.authentication.passwordHash = undefined
    user.authentication.refreshTokenHash = undefined
    return user
  }

  async logout(refreshToken: string | undefined, response: Response): Promise<{ message: string }> {
    if (refreshToken) {
      try {
        const { userId } = verifyRefreshToken(refreshToken)
        const user = await this.users
          .findById(userId)
          .select('+authentication.refreshTokenHash')
        if (user) {
          user.authentication.refreshTokenHash = null
          await user.save()
        }
      } catch {
        // token expired or invalid — still clear cookies
      }
    }
    clearAuthCookies(response)
    return { message: 'Logged out successfully' }
  }

  async refresh(refreshToken: string | undefined, response: Response): Promise<unknown> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token')
    }
    let userId: string
    try {
      ;({ userId } = verifyRefreshToken(refreshToken))
    } catch {
      clearAuthCookies(response)
      throw new UnauthorizedException('Refresh token invalid or expired')
    }

    const user = await this.users.findById(userId).select('+authentication.refreshTokenHash')
    if (!user || user.authentication.refreshTokenHash !== hashToken(refreshToken)) {
      if (user) {
        user.authentication.refreshTokenHash = null
        await user.save()
      }
      clearAuthCookies(response)
      throw new UnauthorizedException('Token reuse detected')
    }

    const { accessToken, refreshToken: newRefresh } = await this.issueTokens(user)
    setAccessCookie(response, accessToken)
    setRefreshCookie(response, newRefresh)

    user.authentication.refreshTokenHash = undefined
    return user
  }

  async getCurrentUser(userId: string): Promise<unknown> {
    const user = await this.users.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async updatePassword(
    userId: string,
    dto: UpdatePasswordDto,
    response: Response
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword, confirmPassword } = dto

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match')
    }

    const user = await this.users
      .findById(userId)
      .select('+authentication.passwordHash +authentication.refreshTokenHash')
    if (!user) {
      throw new NotFoundException('User does not exist')
    }

    const oldOk = await comparePassword(oldPassword, user.authentication.passwordHash)
    if (!oldOk) {
      throw new ForbiddenException('Your password is incorrect')
    }

    const sameAsOld = await comparePassword(newPassword, user.authentication.passwordHash)
    if (sameAsOld) {
      throw new BadRequestException('New password cannot be same as old password')
    }

    user.authentication.passwordHash = await hashPassword(newPassword)
    user.authentication.refreshTokenHash = null
    await user.save()

    clearAuthCookies(response)
    return { message: 'Password updated successfully. Please log in again.' }
  }
}
