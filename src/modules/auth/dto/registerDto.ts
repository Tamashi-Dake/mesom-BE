import { IsString, Matches, MinLength } from 'class-validator'

export class RegisterDto {
  @IsString()
  @MinLength(1)
  username!: string

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Matches(/[a-zA-Z]/, { message: 'Password must contain at least one letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/\W/, { message: 'Password must contain at least one special character' })
  password!: string

  @IsString()
  confirmPassword!: string
}
