import { Paginated } from '../../utils/pagination/paginated.dto';
import { FeedbackDto } from './feedback.dto';

export class FeedbackPageDto extends Paginated(FeedbackDto) {}
