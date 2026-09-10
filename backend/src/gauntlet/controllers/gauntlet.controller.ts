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
import { OptionalSessionId } from '../../utils/decorators/optionalSessionId.decorator';
import { SessionId } from '@utils/decorators/sessionId.decorator';
import { ProvisioningSessionGuard } from '@utils/guards/provisioning-session.guard';
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
// Guards sit on the routes rather than the class: the leaderboard is public
// and the rest are not, which a single class-level guard cannot express. A
// route added here gets no guard by default, so it has to name one.
export class GauntletController {
  constructor(private readonly gauntletService: GauntletService) {}

  // Provisioning, not Session: a first run should not require having played
  // something else first. The identity is minted by starting a run, never by
  // loading the page, so a crawler cannot create users.
  @Post('start')
  @UseGuards(ProvisioningSessionGuard)
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
  @UseGuards(SessionGuard, SessionThrottlerGuard)
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
  @UseGuards(SessionGuard)
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
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: "Get user's gauntlet personal best" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: PersonalBestDto })
  async getPersonalBest(
    @SessionId() sessionId: string,
  ): Promise<PersonalBestDto> {
    return this.gauntletService.getPersonalBest(sessionId);
  }

  // Public: a board nobody can open is a board nobody can share. Hidden
  // players stay hidden either way; a session only adds your own row.
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get gauntlet leaderboard' })
  @ApiResponse({ status: 200, type: GauntletLeaderboardDto })
  async getLeaderboard(
    @OptionalSessionId() sessionId: string | undefined,
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
  @UseGuards(SessionGuard)
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
  @UseGuards(SessionGuard)
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
