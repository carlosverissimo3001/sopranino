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

  /** Left where a blocked message was, so the room is not silently edited. */
  @ApiPropertyOptional({ type: Boolean })
  removed?: boolean;

  /** Said by the room rather than by a player, and shown without a name. */
  @ApiPropertyOptional({ type: Boolean })
  system?: boolean;
}
