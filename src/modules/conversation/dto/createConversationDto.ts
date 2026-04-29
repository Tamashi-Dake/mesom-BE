import { IsArray, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  participants!: string[]

  @IsOptional()
  @IsString()
  name?: string
}
