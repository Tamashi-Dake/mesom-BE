import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'

import { CurrentUser } from '~/common/decorators/currentUser.js'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { ParseObjectIdPipe } from '~/common/pipes/parseObjectIdPipe.js'
import type { AccessTokenPayload } from '~/util/jwt.js'

import { UpdateUserDto } from './dto/updateUserDto.js'
import { UserService, type UploadedProfileFiles } from './userService.js'

@UseGuards(JwtAuthGuard)
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user/:username')
  getByUsername(@Param('username') username: string) {
    return this.userService.getByUsername(username)
  }

  @Get('users')
  getSuggested(@CurrentUser() user: AccessTokenPayload) {
    return this.userService.getSuggested(user.userId)
  }

  @Patch('user')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatarImg', maxCount: 1 },
        { name: 'coverImg', maxCount: 1 }
      ],
      { limits: { fileSize: 5 * 1024 * 1024 } }
    )
  )
  updateCurrent(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdateUserDto,
    @UploadedFiles() files: UploadedProfileFiles
  ) {
    return this.userService.updateCurrent(user.userId, dto, files ?? {})
  }

  @Delete('user')
  deleteCurrent(@CurrentUser() user: AccessTokenPayload) {
    return this.userService.deleteCurrent(user.userId)
  }

  @Post('follow/:id')
  @HttpCode(HttpStatus.OK)
  toggleFollow(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) targetId: string
  ) {
    return this.userService.toggleFollow(user.userId, targetId)
  }

  @Post('block/:id')
  @HttpCode(HttpStatus.OK)
  toggleBlock(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) targetId: string
  ) {
    return this.userService.toggleBlock(user.userId, targetId)
  }
}
