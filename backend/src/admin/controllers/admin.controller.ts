import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StreakQuizService } from '../../streak/services/streak-quiz.service';
import { StreakQuestionDto } from '../../streak/dto/streak-question.dto';
import { CreateStreakQuestionDto } from '../../streak/dto/create-streak-question.dto';
import { UpdateStreakQuestionDto } from '../../streak/dto/update-streak-question.dto';
import { SessionGuard } from '@utils/guards/session-guard';
import { AdminGuard } from '@utils/guards/admin-guard';
import { SessionId } from '@utils/decorators/sessionId.decorator';
import { AdminUserService } from '../services/admin-user.service';
import { AdminUserDto } from '../dto/admin-user.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { AdminUsersPageDto } from '../dto/admin-users-page.dto';
import { GetAdminUsersDto } from '../dto/get-admin-users.dto';
import { FeedbackService } from '../../feedback/services/feedback.service';
import { FeedbackDto } from '../../feedback/dto/feedback.dto';
import { FeedbackPageDto } from '../../feedback/dto/feedback-page.dto';
import { ArtistRequestPageDto } from '../../feedback/dto/artist-request.dto';
import { PaginationQueryDto } from '../../utils/pagination/pagination-query.dto';
import { GetFeedbackDto } from '../../feedback/dto/get-feedback.dto';
import { UpdateFeedbackDto } from '../../feedback/dto/update-feedback.dto';

@ApiTags('Api')
@Controller('admin')
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly streakQuizService: StreakQuizService,
    private readonly adminUserService: AdminUserService,
    private readonly feedbackService: FeedbackService,
  ) {}

  @Get('streak-questions')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List all streak quiz questions' })
  @ApiResponse({ status: 200, type: [StreakQuestionDto] })
  async listStreakQuestions(): Promise<StreakQuestionDto[]> {
    return this.streakQuizService.listAllQuestions();
  }

  @Post('streak-questions')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a streak quiz question' })
  @ApiResponse({ status: 201, type: StreakQuestionDto })
  async createStreakQuestion(
    @SessionId() sessionId: string,
    @Body() dto: CreateStreakQuestionDto,
  ): Promise<StreakQuestionDto> {
    return this.streakQuizService.createQuestion(sessionId, dto);
  }

  @Patch('streak-questions/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a streak quiz question' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: StreakQuestionDto })
  async updateStreakQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateStreakQuestionDto,
  ): Promise<StreakQuestionDto> {
    return this.streakQuizService.updateQuestion(id, dto);
  }

  @Delete('streak-questions/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Soft-delete a streak quiz question' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204 })
  async deleteStreakQuestion(@Param('id') id: string): Promise<void> {
    return this.streakQuizService.deleteQuestion(id);
  }

  @Get('users')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List users, paged' })
  @ApiResponse({ status: 200, type: AdminUsersPageDto })
  async listUsers(@Query() dto: GetAdminUsersDto): Promise<AdminUsersPageDto> {
    return this.adminUserService.listUsers(dto);
  }

  @Patch('users/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update user role flags' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: AdminUserDto })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<AdminUserDto> {
    return this.adminUserService.updateUserRole(id, dto);
  }

  @Get('feedback')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List player reports, newest first' })
  @ApiResponse({ status: 200, type: FeedbackPageDto })
  async listFeedback(@Query() dto: GetFeedbackDto): Promise<FeedbackPageDto> {
    return this.feedbackService.list(dto);
  }

  @Get('feedback/requests')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Artists players asked for, most asked first' })
  @ApiResponse({ status: 200, type: ArtistRequestPageDto })
  async listArtistRequests(
    @Query() dto: PaginationQueryDto,
  ): Promise<ArtistRequestPageDto> {
    return this.feedbackService.listRequests(dto);
  }

  @Patch('feedback/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Resolve or reopen a player report' })
  @ApiResponse({ status: 200, type: FeedbackDto })
  async updateFeedback(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
  ): Promise<FeedbackDto> {
    return this.feedbackService.setResolved(id, dto.resolved);
  }
}
