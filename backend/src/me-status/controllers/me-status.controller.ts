import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionId } from '../../utils/decorators/sessionId.decorator';
import { SessionGuard } from '../../utils/guards/session-guard';
import { MeStatusService } from '../services/me-status.service';
import { MeStatusDto } from '../dto/me-status.dto';

@ApiTags('Api')
@Controller('me/status')
export class MeStatusController {
  constructor(private readonly meStatusService: MeStatusService) {}

  @Get()
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Streak, daily and speed run state, at once' })
  @ApiResponse({ status: 200, type: MeStatusDto })
  async get(@SessionId() sessionId: string): Promise<MeStatusDto> {
    return this.meStatusService.get(sessionId);
  }
}
