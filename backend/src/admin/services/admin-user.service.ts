import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { AdminUserDto } from '../dto/admin-user.dto';
import { AdminUsersPageDto } from '../dto/admin-users-page.dto';
import { GetAdminUsersDto } from '../dto/get-admin-users.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { paginate, skipTake } from '../../utils/pagination/paginate';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: Move to a repo layer later
  async listUsers(dto: GetAdminUsersDto): Promise<AdminUsersPageDto> {
    // Sorting and searching happen in the query, not on the page: sorting the
    // rows already fetched would order a slice rather than the set.
    const where: Prisma.UserWhereInput = {
      ...(dto.search && {
        displayName: { contains: dto.search, mode: 'insensitive' },
      }),
      ...(dto.isTrusted !== undefined && { isTrusted: dto.isTrusted }),
      ...(dto.isAdmin !== undefined && { isAdmin: dto.isAdmin }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { [dto.sortBy]: dto.sortOrder },
        ...skipTake(dto),
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(users.map(AdminUserDto.fromEntity), total, dto);
  }

  async updateUserRole(
    userId: string,
    dto: UpdateUserRoleDto,
  ): Promise<AdminUserDto> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.isTrusted !== undefined && { isTrusted: dto.isTrusted }),
        ...(dto.isAdmin !== undefined && { isAdmin: dto.isAdmin }),
      },
    });

    return AdminUserDto.fromEntity(updated);
  }
}
