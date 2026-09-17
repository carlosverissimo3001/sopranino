import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { PlaylistService } from '../services/playlist.service';
import { PlaylistDto } from '../dto/playlist.dto';
import { SessionId } from '../../utils/decorators/sessionId.decorator';
import { SessionGuard } from '../../utils/guards/session-guard';
import { SpotifyLinkedGuard } from '../../utils/guards/spotify-linked.guard';

@ApiTags('Api')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Not authenticated' })
@UseGuards(SessionGuard, SpotifyLinkedGuard)
@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistsService: PlaylistService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get playlist by ID' })
  @ApiNotFoundResponse({ description: 'Playlist not found' })
  @ApiResponse({ status: 200, type: PlaylistDto })
  async getPlaylistById(
    @SessionId() sessionId: string,
    @Param('id') playlistId: string,
  ): Promise<PlaylistDto> {
    return this.playlistsService.getPlaylistById(sessionId, playlistId);
  }
}
