import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserService } from './admin-user.service';
import { PrismaService } from '@prisma/prisma.service';
import {
  AdminUserSortField,
  GetAdminUsersDto,
  SortOrder,
} from '../dto/get-admin-users.dto';

describe('AdminUserService', () => {
  let service: AdminUserService;

  const mockUsers = [
    {
      id: 'user-1',
      spotifyUserId: 'spotify-1',
      displayName: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
      encryptedRefreshToken: 'secret-token',
      isTrusted: false,
      isAdmin: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-06-01'),
      streakFreezes: 2,
      answeredQuestionIds: ['q1'],
    },
    {
      id: 'user-2',
      spotifyUserId: 'spotify-2',
      displayName: 'Bob',
      avatarUrl: null,
      encryptedRefreshToken: null,
      isTrusted: true,
      isAdmin: false,
      createdAt: new Date('2025-03-01'),
      updatedAt: new Date('2025-06-01'),
      streakFreezes: 0,
      answeredQuestionIds: [],
    },
  ];

  const query = (overrides: Partial<GetAdminUsersDto> = {}) =>
    ({
      page: 1,
      limit: 10,
      sortBy: AdminUserSortField.CreatedAt,
      sortOrder: SortOrder.Desc,
      ...overrides,
    }) as GetAdminUsersDto;

  const mockPrisma = {
    user: {
      findMany: jest.fn().mockResolvedValue(mockUsers),
      count: jest.fn().mockResolvedValue(2),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminUserService>(AdminUserService);
    jest.clearAllMocks();
    mockPrisma.user.findMany.mockResolvedValue(mockUsers);
    mockPrisma.user.count.mockResolvedValue(2);
  });

  describe('listUsers', () => {
    it('should return users mapped to AdminUserDto', async () => {
      const { items } = await service.listUsers(query());

      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        id: 'user-1',
        spotifyUserId: 'spotify-1',
        displayName: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
        isTrusted: false,
        isAdmin: true,
        createdAt: mockUsers[0].createdAt,
        updatedAt: mockUsers[0].updatedAt,
      });
      // Sensitive fields should not be present
      expect(items[0]).not.toHaveProperty('encryptedRefreshToken');
      expect(items[0]).not.toHaveProperty('streakFreezes');
    });

    it('should return avatarUrl as undefined when null', async () => {
      const { items } = await service.listUsers(query());

      expect(items[1].avatarUrl).toBeUndefined();
    });

    it('asks the database for one page', async () => {
      await service.listUsers(query({ page: 3, limit: 25 }));

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 50, take: 25 }),
      );
    });

    it('sorts by the requested column and direction', async () => {
      await service.listUsers(
        query({
          sortBy: AdminUserSortField.DisplayName,
          sortOrder: SortOrder.Asc,
        }),
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { displayName: 'asc' } }),
      );
    });

    it('searches the display name without regard to case', async () => {
      await service.listUsers(query({ search: 'ali' }));

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { displayName: { contains: 'ali', mode: 'insensitive' } },
        }),
      );
    });

    // Otherwise the pager reports the size of the page it is on.
    it('counts everything the search matched, not the page', async () => {
      mockPrisma.user.count.mockResolvedValue(42);

      const { meta } = await service.listUsers(query({ search: 'a' }));

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { displayName: { contains: 'a', mode: 'insensitive' } },
      });
      expect(meta.totalItems).toBe(42);
      expect(meta.totalPages).toBe(5);
    });
  });

  describe('role filters', () => {
    it('keeps only the trusted when asked', async () => {
      await service.listUsers(query({ isTrusted: true }));

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isTrusted: true } }),
      );
    });

    it('combines a role filter with a search', async () => {
      await service.listUsers(query({ isAdmin: true, search: 'bo' }));

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            displayName: { contains: 'bo', mode: 'insensitive' },
            isAdmin: true,
          },
        }),
      );
    });

    // Absent means every user, not the ones without the role.
    it('does not filter when no role is asked for', async () => {
      await service.listUsers(query());

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update isTrusted flag', async () => {
      const updatedUser = { ...mockUsers[1], isTrusted: false };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole('user-2', {
        isTrusted: false,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isTrusted: false },
      });
      expect(result.isTrusted).toBe(false);
    });

    it('should update isAdmin flag', async () => {
      const updatedUser = { ...mockUsers[1], isAdmin: true };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole('user-2', {
        isAdmin: true,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isAdmin: true },
      });
      expect(result.isAdmin).toBe(true);
    });

    it('should update both flags at once', async () => {
      const updatedUser = {
        ...mockUsers[1],
        isTrusted: true,
        isAdmin: true,
      };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole('user-2', {
        isTrusted: true,
        isAdmin: true,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isTrusted: true, isAdmin: true },
      });
      expect(result.isTrusted).toBe(true);
      expect(result.isAdmin).toBe(true);
    });

    it('should not include undefined fields in update data', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUsers[0]);

      await service.updateUserRole('user-1', {});

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {},
      });
    });
  });
});
