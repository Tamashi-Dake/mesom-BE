import { IsOptional, IsString } from 'class-validator'

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  text?: string

  @IsOptional()
  @IsString()
  replyTo?: string
}
