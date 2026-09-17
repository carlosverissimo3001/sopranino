import {
  Body,
  Controller,
  Delete,
  Get,
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
import { ImportQuotaDto } from '../dto/import-quota.dto';
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
  import(
    @SessionId() sessionId: string,
    @Body() body: ImportPlaylistControllerDto,
  ): Promise<ImportedSetDto> {
    return this.playlistImportService.import(sessionId, body);
  }

  @Get('quota')
  @UseGuards(SignedUpGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Playlist reads left in the player's day" })
  @ApiResponse({ status: 200, type: ImportQuotaDto })
  quota(@SessionId() sessionId: string): Promise<ImportQuotaDto> {
    return this.playlistImportService.quotaFor(sessionId);
  }

  @Post(':trackGroupId/refresh')
  @UseGuards(SignedUpGuard, ThrottlerGuard)
  @Throttle({
    [THROTTLE_IMPORT]: { limit: THROTTLE_IMPORT_LIMIT, ttl: THROTTLE_TTL },
  })
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Read an imported playlist again' })
  @ApiResponse({ status: 201, type: ImportedSetDto })
  refresh(
    @SessionId() sessionId: string,
    @Param('trackGroupId', ParseUUIDPipe) trackGroupId: string,
  ): Promise<ImportedSetDto> {
    return this.playlistImportService.refresh(sessionId, trackGroupId);
  }

  @Delete(':trackGroupId')
  @HttpCode(204)
  @UseGuards(SignedUpGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Remove an import from this player' })
  async leave(
    @SessionId() sessionId: string,
    @Param('trackGroupId', ParseUUIDPipe) trackGroupId: string,
  ): Promise<void> {
    await this.playlistImportService.leave(sessionId, trackGroupId);
  }
}
