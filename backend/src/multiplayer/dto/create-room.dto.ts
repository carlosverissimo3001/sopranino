import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty()
  hostId: string;

  @ApiProperty()
  inviteCode: string;

  @ApiProperty()
  roundCount: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  findable: boolean;
}
