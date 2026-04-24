import { Module } from '@nestjs/common'

import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'

import { UserController } from './userController.js'
import { UserRepository } from './userRepository.js'
import { UserService } from './userService.js'

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, JwtAuthGuard],
  exports: [UserService, UserRepository]
})
export class UserModule {}
