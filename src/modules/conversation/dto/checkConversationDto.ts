import { IsArray, IsString } from 'class-validator'

export class CheckConversationDto {
  @IsArray()
  @IsString({ each: true })
  participants!: string[]
}
