import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionId } from '@utils/decorators/sessionId.decorator';
import { SignedUpGuard } from '@utils/guards/signed-up.guard';
import { GetMyPlaylistsDto, MyPlaylistsDto } from '../dto/my-playlists.dto';
import { MyPlaylistsService } from '../services/my-playlists.service';

@ApiTags('Api')
@Controller('me/playlists')
export class MyPlaylistsController {
  constructor(private readonly myPlaylistsService: MyPlaylistsService) {}

  @Get()
  @UseGuards(SignedUpGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "A player's Spotify and imported playlists, in one list",
  })
  @ApiResponse({ status: 200, type: MyPlaylistsDto })
  list(
    @SessionId() sessionId: string,
    @Query() query: GetMyPlaylistsDto,
  ): Promise<MyPlaylistsDto> {
    return this.myPlaylistsService.list(sessionId, {
      sortBy: query.sortBy,
      order: query.order,
    });
  }
}
