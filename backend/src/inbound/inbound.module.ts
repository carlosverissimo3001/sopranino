import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { RESEND_API_KEY } from '../email/consts';
import { RESEND_CLIENT } from './consts';
import { InboundController } from './controllers/inbound.controller';
import { InboundMailService } from './services/inbound-mail.service';

@Module({
  controllers: [InboundController],
  providers: [
    InboundMailService,
    {
      provide: RESEND_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const key = config.get<string>(RESEND_API_KEY);
        return key ? new Resend(key) : null;
      },
    },
  ],
})
export class InboundModule {}
