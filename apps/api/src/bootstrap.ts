import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Shared between `main.ts` and the e2e suite so both run the same pipeline.
 * Kept out of `main.ts` on purpose: importing that file would start a server.
 */
export function applyGlobals<T extends INestApplication>(app: T): T {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  return app;
}
