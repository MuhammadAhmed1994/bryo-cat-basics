import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { applyGlobals } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyGlobals(app);

  const config = app.get(ConfigService);
  app.enableCors({ origin: config.get<string>('webUrl'), credentials: true });

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}

void bootstrap();
