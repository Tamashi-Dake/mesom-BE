import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import multer from 'multer'

import { CurrentUser } from '~/common/decorators/currentUser.js'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { ParseObjectIdPipe } from '~/common/pipes/parseObjectIdPipe.js'
import type { AccessTokenPayload } from '~/util/jwt.js'

import { CreatePostDto } from './dto/createPostDto.js'
import { CreateReplyDto } from './dto/createReplyDto.js'
import { PostService } from './postService.js'

const uploadOptions = {
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
}

function parseQuery(value: string | undefined, fallback: number) {
  const n = parseInt(value ?? String(fallback))
  return isNaN(n) ? fallback : n
}

@Controller()
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  // ── List endpoints ────────────────────────────────────────────────────────

  @Get('posts')
  getAllPosts(@Query('limit') limit?: string, @Query('skip') skip?: string) {
    return this.postService.getAllPosts(parseQuery(limit, 10), parseQuery(skip, 0))
  }

  @Get('posts/following')
  getPostsByFollowing(
    @CurrentUser() user: AccessTokenPayload,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.postService.getPostsByFollowing(
      user.userId,
      parseQuery(limit, 10),
      parseQuery(skip, 0)
    )
  }

  @Get('posts/bookmarks')
  getUserBookmarks(
    @CurrentUser() user: AccessTokenPayload,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.postService.getUserBookmarks(
      user.userId,
      parseQuery(limit, 10),
      parseQuery(skip, 0)
    )
  }

  // ── Single post CRUD ──────────────────────────────────────────────────────

  @Get('post/:id')
  getPost(@Param('id', ParseObjectIdPipe) postId: string) {
    return this.postService.getPost(postId)
  }

  @Post('post')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 4, uploadOptions))
  createPost(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    return this.postService.createPost(user.userId, dto.text, files ?? [])
  }

  @Delete('post/:id')
  @HttpCode(HttpStatus.OK)
  deletePost(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) postId: string
  ) {
    return this.postService.deletePost(user.userId, postId)
  }

  // ── Replies ───────────────────────────────────────────────────────────────

  @Get('post/:id/replies')
  getRepliesForPost(
    @Param('id', ParseObjectIdPipe) postId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.postService.getRepliesForPost(
      postId,
      parseQuery(limit, 10),
      parseQuery(skip, 0)
    )
  }

  @Post('post/:id')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 4, uploadOptions))
  createReplyPost(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) parentPostId: string,
    @Body() dto: CreateReplyDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    return this.postService.createReplyPost(
      user.userId,
      parentPostId,
      dto.text,
      dto.authorName,
      files ?? []
    )
  }

  // ── Posts by user ─────────────────────────────────────────────────────────

  @Get('user/:id/posts')
  getPostsByUser(
    @Param('id', ParseObjectIdPipe) userId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.postService.getPostsByUser(userId, parseQuery(limit, 10), parseQuery(skip, 0))
  }

  @Get('user/:id/replies')
  getRepliesByUser(
    @Param('id', ParseObjectIdPipe) userId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.postService.getRepliesByUser(userId, parseQuery(limit, 10), parseQuery(skip, 0))
  }

  @Get('user/:id/medias')
  getMediasByUser(
    @Param('id', ParseObjectIdPipe) userId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.postService.getMediasByUser(userId, parseQuery(limit, 10), parseQuery(skip, 0))
  }

  @Get('user/:id/likes')
  getLikedPostsByUser(
    @Param('id', ParseObjectIdPipe) userId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.postService.getLikedPostsByUser(userId, parseQuery(limit, 10), parseQuery(skip, 0))
  }

  // ── Interactions ──────────────────────────────────────────────────────────

  @Post('post/:id/like')
  @HttpCode(HttpStatus.OK)
  toggleLikePost(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) postId: string
  ) {
    return this.postService.toggleLikePost(postId, user.userId)
  }

  @Post('post/:id/share')
  @HttpCode(HttpStatus.OK)
  toggleSharePost(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) postId: string
  ) {
    return this.postService.toggleSharePost(postId, user.userId)
  }

  @Post('post/:id/bookmark')
  @HttpCode(HttpStatus.OK)
  toggleBookmarkPost(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) postId: string
  ) {
    return this.postService.toggleBookmarkPost(postId, user.userId)
  }

  @Post('post/:id/increase-view')
  @HttpCode(HttpStatus.OK)
  increasePostView(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) postId: string
  ) {
    return this.postService.increasePostView(postId, user.userId)
  }
}
