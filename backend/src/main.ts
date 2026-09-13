import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { VALIDATION_CONFIG } from './utils/validators/validators';
import { RedisIoAdapter } from './redis/redis-io.adapter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const module: any;

async function bootstrap() {
  // rawBody keeps the request bytes beside the parsed JSON, for webhook
  // signatures; parsing is unchanged.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.set('trust proxy', 1);

  app.use(cookieParser());

  const portfolioOrigins = (process.env.PORTFOLIO_URL?.split(',') ?? [])
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (portfolioOrigins.length) {
    app.use('/demo', (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      if (origin && portfolioOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
      }
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      next();
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.enableCors({
    origin: (origin, callback) => callback(null, origin === frontendUrl),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(VALIDATION_CONFIG);

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connect();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(process.env.PORT ?? 3001);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
