import { IsOptional, IsString } from 'class-validator'

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  name?: string
}
