import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: 'employee' })
  userType: 'employee' | 'customer';

  @ApiProperty({ example: 'admin' })
  role?: string;

  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3' })
  userId: string;

  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3' })
  branchId?: string;
}
