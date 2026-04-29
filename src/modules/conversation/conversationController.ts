import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import multer from 'multer'

import { CurrentUser } from '~/common/decorators/currentUser.js'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { ParseObjectIdPipe } from '~/common/pipes/parseObjectIdPipe.js'
import type { AccessTokenPayload } from '~/util/jwt.js'

import { CheckConversationDto } from './dto/checkConversationDto.js'
import { CreateConversationDto } from './dto/createConversationDto.js'
import { CreateMessageDto } from './dto/createMessageDto.js'
import { UpdateConversationDto } from './dto/updateConversationDto.js'
import { ConversationService } from './conversationService.js'

const uploadOptions = { storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }

function parseQuery(value: string | undefined, fallback: number) {
  const n = parseInt(value ?? String(fallback))
  return isNaN(n) ? fallback : n
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('conversation/check')
  @HttpCode(HttpStatus.OK)
  checkCreateConditions(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CheckConversationDto
  ) {
    return this.conversationService.checkCreateConditions(user.userId, dto.participants)
  }

  @Post('conversation')
  @HttpCode(HttpStatus.CREATED)
  createConversation(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateConversationDto
  ) {
    return this.conversationService.createConversation(user.userId, dto.participants, dto.name)
  }

  @Get('conversations')
  getUserConversations(
    @CurrentUser() user: AccessTokenPayload,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.conversationService.getUserConversations(
      user.userId,
      parseQuery(limit, 10),
      parseQuery(skip, 0)
    )
  }

  @Get('conversation/:id')
  getConversation(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) conversationId: string
  ) {
    return this.conversationService.getConversation(user.userId, conversationId)
  }

  @Patch('conversation/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }], uploadOptions))
  updateConversation(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) conversationId: string,
    @Body() dto: UpdateConversationDto,
    @UploadedFiles() files: { avatar?: Express.Multer.File[] }
  ) {
    return this.conversationService.updateConversation(
      user.userId,
      conversationId,
      dto.name,
      files?.avatar?.[0]
    )
  }

  @Post('conversation/:id/hide')
  @HttpCode(HttpStatus.OK)
  toggleHide(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) conversationId: string
  ) {
    return this.conversationService.toggleHideConversation(user.userId, conversationId)
  }

  // ── Message endpoints ─────────────────────────────────────────────────────

  @Post('conversation/:id/message')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 4 }], uploadOptions))
  createMessage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) conversationId: string,
    @Body() dto: CreateMessageDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] }
  ) {
    return this.conversationService.createMessage(
      user.userId,
      conversationId,
      dto.text,
      files?.images ?? [],
      dto.replyTo
    )
  }

  @Get('conversation/:id/messages')
  getMessages(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) conversationId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.conversationService.getMessages(
      user.userId,
      conversationId,
      parseQuery(limit, 10),
      parseQuery(skip, 0)
    )
  }
}
