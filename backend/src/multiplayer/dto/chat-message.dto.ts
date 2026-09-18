import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * A line in a room or in the lobby. Socket-only and never persisted, so this
 * is the shape on the wire rather than a row.
 */
export class ChatMessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional({ type: String })
  avatarUrl?: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  sentAt: string;
}
