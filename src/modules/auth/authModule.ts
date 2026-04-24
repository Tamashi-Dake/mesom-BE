import { Module } from '@nestjs/common'

import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { ValidateOriginGuard } from '~/common/guards/validateOriginGuard.js'
import { UserModule } from '~/modules/user/userModule.js'

import { AuthController } from './authController.js'
import { AuthService } from './authService.js'
import { PasswordController } from './passwordController.js'

@Module({
  imports: [UserModule],
  controllers: [AuthController, PasswordController],
  providers: [AuthService, JwtAuthGuard, ValidateOriginGuard],
  exports: [AuthService]
})
export class AuthModule {}
