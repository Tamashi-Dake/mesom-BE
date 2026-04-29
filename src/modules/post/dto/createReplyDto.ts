import { IsOptional, IsString } from 'class-validator'

export class CreateReplyDto {
  @IsOptional()
  @IsString()
  text?: string

  @IsOptional()
  @IsString()
  authorName?: string
}
