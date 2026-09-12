import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';
import { toBoolean } from '../../utils/transformers/toBoolean.transform';
import { PaginationQueryDto } from '../../utils/pagination/pagination-query.dto';

/**
 * A whitelist, so nothing else can reach Prisma's orderBy. The role flags are
 * absent on purpose: ordering by a boolean only groups the rows, which is
 * what filtering does properly.
 */
export enum AdminUserSortField {
  DisplayName = 'displayName',
  CreatedAt = 'createdAt',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export class GetAdminUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Match against the display name' })
  @IsNotNullableOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Keep only users with the trusted role' })
  @IsNotNullableOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isTrusted?: boolean;

  @ApiPropertyOptional({ description: 'Keep only users with the admin role' })
  @IsNotNullableOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional({
    enum: AdminUserSortField,
    default: AdminUserSortField.CreatedAt,
  })
  @IsNotNullableOptional()
  @IsEnum(AdminUserSortField)
  sortBy: AdminUserSortField = AdminUserSortField.CreatedAt;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.Desc })
  @IsNotNullableOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.Desc;
}
