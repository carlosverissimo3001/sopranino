import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { normalizeEmail } from '../utils/password';
import { IsDeliverableEmail } from '../../utils/decorators/isDeliverableEmail.decorator';

export class RequestEmailChangeControllerDto {
  @ApiProperty({ description: 'The password of the signed in account' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'The address to move the account to' })
  @Transform(({ value }) => normalizeEmail(String(value)))
  @IsEmail()
  @IsDeliverableEmail()
  newEmail: string;
}

export class EmailChangeResultDto {
  @ApiProperty({
    example: false,
    description:
      'Whether the link was live. False covers wrong, expired, used and replaced alike.',
  })
  done: boolean;
}
