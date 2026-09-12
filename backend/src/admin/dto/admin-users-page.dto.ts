import { Paginated } from '../../utils/pagination/paginated.dto';
import { AdminUserDto } from './admin-user.dto';

export class AdminUsersPageDto extends Paginated(AdminUserDto) {}
