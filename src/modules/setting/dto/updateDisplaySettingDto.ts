import { IsOptional, IsString } from 'class-validator'

export class UpdateDisplaySettingDto {
  @IsOptional()
  @IsString()
  theme?: string

  @IsOptional()
  @IsString()
  accent?: string
}
