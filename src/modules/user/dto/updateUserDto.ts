import { IsOptional, IsString } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  displayName?: string

  @IsOptional()
  @IsString()
  bio?: string

  @IsOptional()
  @IsString()
  location?: string

  @IsOptional()
  @IsString()
  website?: string
}
