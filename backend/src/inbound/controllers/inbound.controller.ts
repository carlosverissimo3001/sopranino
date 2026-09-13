import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { InboundMailService } from '../services/inbound-mail.service';

@ApiExcludeController()
@Controller('webhooks')
export class InboundController {
  constructor(private readonly inboundMail: InboundMailService) {}

  @Post('resend')
  @HttpCode(200)
  async resend(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') id: string | undefined,
    @Headers('svix-timestamp') timestamp: string | undefined,
    @Headers('svix-signature') signature: string | undefined,
  ): Promise<{ outcome: string }> {
    // The signature covers the bytes as sent; re-serialised JSON would not match.
    const payload = req.rawBody?.toString('utf8') ?? '';
    const outcome = await this.inboundMail.handle({
      payload,
      id,
      timestamp,
      signature,
    });
    return { outcome };
  }
}
