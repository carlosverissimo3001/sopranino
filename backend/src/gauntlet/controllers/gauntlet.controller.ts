import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GauntletDifficulty } from '@prisma/client';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionId } from '@utils/decorators/sessionId.decorator';
import { SessionGuard } from '@utils/guards/session-guard';
import { SessionThrottlerGuard } from '@throttle/guards/session-throttler.guard';
import {
  THROTTLE_GUESS,
  THROTTLE_GUESS_LIMIT,
  THROTTLE_TTL,
} from '@throttle/throttle.constants';
import { GauntletService } from '../services/gauntlet.service';
import { StartRunDto } from '../dto/start-run.dto';
import { SubmitGauntletGuessDto } from '../dto/submit-gauntlet-guess.dto';
import { GauntletRunStateDto } from '../dto/gauntlet-run-state.dto';
import { GauntletGuessResultDto } from '../dto/gauntlet-guess-result.dto';
import { GauntletLeaderboardDto } from '../dto/gauntlet-leaderboard.dto';
import { GauntletHistoryDto } from '../dto/gauntlet-history.dto';
import { GetGauntletHistoryDto } from '../dto/get-gauntlet-history.dto';
import { PersonalBestDto } from '../dto/personal-best.dto';
import { GetLeaderboardDto } from '../dto/get-leaderboard.dto';

@ApiTags('Api')
@Controller('gauntlet')
@UseGuards(SessionGuard)
export class GauntletController {
  constructor(private readonly gauntletService: GauntletService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new gauntlet run' })
  @ApiCookieAuth()
  @ApiResponse({ status: 201, type: GauntletRunStateDto })
  async startRun(
    @SessionId() sessionId: string,
    @Body() dto: StartRunDto,
  ): Promise<GauntletRunStateDto> {
    return this.gauntletService.startRun(sessionId, dto);
  }

  @Post(':id/guess')
  @UseGuards(SessionThrottlerGuard)
  @Throttle({
    [THROTTLE_GUESS]: { limit: THROTTLE_GUESS_LIMIT, ttl: THROTTLE_TTL },
  })
  @ApiOperation({ summary: 'Submit a guess for the current gauntlet track' })
  @ApiParam({ name: 'id', description: 'The gauntlet run ID' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GauntletGuessResultDto })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async submitGuess(
    @SessionId() sessionId: string,
    @Param('id') id: string,
    @Body() dto: SubmitGauntletGuessDto,
  ): Promise<GauntletGuessResultDto> {
    return this.gauntletService.submitGuess(sessionId, id, dto);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'Voluntarily end a gauntlet run (quit)' })
  @ApiParam({ name: 'id', description: 'The gauntlet run ID' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GauntletRunStateDto })
  async endRun(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<GauntletRunStateDto> {
    return this.gauntletService.endRun(sessionId, id);
  }

  @Get('personal-best')
  @ApiOperation({ summary: "Get user's gauntlet personal best" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: PersonalBestDto })
  async getPersonalBest(
    @SessionId() sessionId: string,
  ): Promise<PersonalBestDto> {
    return this.gauntletService.getPersonalBest(sessionId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get gauntlet leaderboard' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GauntletLeaderboardDto })
  async getLeaderboard(
    @SessionId() sessionId: string,
    @Query() dto: GetLeaderboardDto,
  ): Promise<GauntletLeaderboardDto> {
    return this.gauntletService.getLeaderboard(
      sessionId,
      dto.period ?? 'alltime',
      dto.limit ?? 10,
      dto.offset ?? 0,
      dto.difficulty ?? GauntletDifficulty.MEDIUM,
    );
  }

  @Get('history')
  @ApiOperation({ summary: "Get user's gauntlet run history (paginated)" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GauntletHistoryDto })
  async getHistory(
    @SessionId() sessionId: string,
    @Query() dto: GetGauntletHistoryDto,
  ): Promise<GauntletHistoryDto> {
    return this.gauntletService.getHistory(sessionId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get current gauntlet run state' })
  @ApiParam({ name: 'id', description: 'The gauntlet run ID' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GauntletRunStateDto })
  async getRunState(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<GauntletRunStateDto> {
    return this.gauntletService.getRunState(sessionId, id);
  }
}
