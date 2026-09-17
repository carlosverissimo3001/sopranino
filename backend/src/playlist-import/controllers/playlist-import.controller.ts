import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SessionId } from '@utils/decorators/sessionId.decorator';
import { SignedUpGuard } from '@utils/guards/signed-up.guard';
import {
  THROTTLE_IMPORT,
  THROTTLE_IMPORT_LIMIT,
  THROTTLE_TTL,
} from '../../throttle/throttle.constants';
import { ImportPlaylistControllerDto } from '../dto/import-playlist-controller.dto';
import { ImportedSetDto } from '../dto/imported-set.dto';
import { PlaylistImportService } from '../services/playlist-import.service';

@ApiTags('Api')
@Controller('me/imports')
export class PlaylistImportController {
  constructor(private readonly playlistImportService: PlaylistImportService) {}

  @Post()
  @UseGuards(SignedUpGuard, ThrottlerGuard)
  @Throttle({
    [THROTTLE_IMPORT]: { limit: THROTTLE_IMPORT_LIMIT, ttl: THROTTLE_TTL },
  })
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Import a public playlist as a private set' })
  @ApiResponse({ status: 201, type: ImportedSetDto })
  @ApiResponse({ status: 404, description: 'Private or deleted playlist' })
  @ApiResponse({ status: 422, description: 'Service not supported yet' })
  @ApiResponse({ status: 429, description: 'Daily import used' })
  @ApiResponse({ status: 503, description: 'Import queue is full' })
  import(
    @SessionId() sessionId: string,
    @Body() body: ImportPlaylistControllerDto,
  ): Promise<ImportedSetDto> {
    return this.playlistImportService.import(sessionId, body);
  }

  @Delete(':trackGroupId')
  @HttpCode(204)
  @UseGuards(SignedUpGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Remove an import from this player' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Not one of theirs' })
  async leave(
    @SessionId() sessionId: string,
    @Param('trackGroupId', ParseUUIDPipe) trackGroupId: string,
  ): Promise<void> {
    await this.playlistImportService.leave(sessionId, trackGroupId);
  }
}
