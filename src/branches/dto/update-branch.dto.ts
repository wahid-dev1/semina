import { PartialType, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import {
  CreateBranchDto,
  CancellationPolicyDto,
  CalendarSettingsDto,
  AddressDto,
} from './create-branch.dto';

class UpdateAddressDto extends PartialType(AddressDto) {}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiProperty({ type: UpdateAddressDto, required: false, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto | null;

  @ApiProperty({ type: CancellationPolicyDto, required: false, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CancellationPolicyDto)
  cancellationPolicy?: CancellationPolicyDto | null;

  @ApiProperty({ type: CalendarSettingsDto, required: false, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalendarSettingsDto)
  calendarSettings?: CalendarSettingsDto | null;
}
