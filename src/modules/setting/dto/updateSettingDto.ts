import { IsOptional } from 'class-validator'

export class UpdateSettingDto {
  @IsOptional()
  setting?: Record<string, unknown>
}
