import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrackGroupType } from '@prisma/client';
import { TrackGroupService } from '../services/track-group.service';
import { TrackGroupDto } from '../dto/track-group.dto';
import { ListTrackGroupsDto } from '../dto/list-track-groups.dto';
import { AuthService } from '../../auth/services/auth.service';
import { SESSION_COOKIE_NAME } from '../../consts';
import { UserEntity } from '@/auth/entities/user.entity';

@ApiTags('Api')
@Controller('track-groups')
export class TrackGroupController {
  constructor(
    private readonly trackGroupService: TrackGroupService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Curated sets of songs anyone can play, library or not',
  })
  @ApiResponse({ status: 200, type: [TrackGroupDto] })
  async list(
    @Query() query: ListTrackGroupsDto,
    @Req() req: Request,
  ): Promise<TrackGroupDto[]> {
    const type = query.type ?? TrackGroupType.DECADE;
    const user = await this.currentUser(req);

    if (!TrackGroupService.isVisible(type, user)) {
      // Empty rather than forbidden: whether a group exists is itself the
      // thing being kept back.
      return [];
    }

    return this.trackGroupService.list(type, user?.country);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'One group, by the name in its URL' })
  @ApiResponse({ status: 200, type: TrackGroupDto })
  @ApiResponse({ status: 404, description: 'No such group, or not for you' })
  async bySlug(
    @Param('slug') slug: string,
    @Req() req: Request,
  ): Promise<TrackGroupDto> {
    const user = await this.currentUser(req);
    return this.trackGroupService.bySlug(slug, user);
  }

  /** Null for a visitor with no session, rather than refusing the request. */
  private async currentUser(req: Request): Promise<UserEntity | null> {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (!sessionId) {
      return null;
    }
    try {
      return await this.authService.getUserBySessionId(sessionId);
    } catch {
      return null;
    }
  }
}
