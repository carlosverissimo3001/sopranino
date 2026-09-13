import { VALIDATION_CONFIG } from '../../utils/validators/validators';
import { GetFeedbackDto } from './get-feedback.dto';

// Through the app's own pipe: implicit conversion reads the string "false" as
// true, so a test that hands the DTO a real boolean cannot catch this.
const parse = async (query: Record<string, string>) =>
  (await VALIDATION_CONFIG.transform(query, {
    type: 'query',
    metatype: GetFeedbackDto,
  })) as GetFeedbackDto;

describe('GetFeedbackDto', () => {
  it('reads resolved=false as open reports', async () => {
    expect((await parse({ resolved: 'false' })).resolved).toBe(false);
  });

  it('reads resolved=true as resolved reports', async () => {
    expect((await parse({ resolved: 'true' })).resolved).toBe(true);
  });

  it('leaves resolved unset when it is not asked for', async () => {
    expect((await parse({})).resolved).toBeUndefined();
  });
});
