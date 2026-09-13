import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InboundMailService } from '../services/inbound-mail.service';
import { InboundController } from './inbound.controller';

// Through a real HTTP stack: the signature covers the bytes as sent, and only
// an app booted with rawBody keeps them.
describe('InboundController', () => {
  let app: INestApplication;
  let url: string;
  const handle = jest.fn().mockResolvedValue('forwarded');

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [InboundController],
      providers: [{ provide: InboundMailService, useValue: { handle } }],
    }).compile();

    app = module.createNestApplication({ rawBody: true });
    await app.listen(0);
    url = `${await app.getUrl()}/webhooks/resend`.replace('[::1]', 'localhost');
  });

  afterAll(() => app.close());

  it('hands the service the body exactly as sent, with the svix headers', async () => {
    // Spacing JSON.stringify would not reproduce.
    const body = '{"type": "email.received",  "data":{"email_id":"e-1"}}';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'svix-id': 'msg_1',
        'svix-timestamp': '1700000000',
        'svix-signature': 'v1,abc',
      },
      body,
    });

    expect(res.status).toBe(200);
    expect(handle).toHaveBeenCalledWith({
      payload: body,
      id: 'msg_1',
      timestamp: '1700000000',
      signature: 'v1,abc',
    });
  });
});
