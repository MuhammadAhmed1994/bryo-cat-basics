import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration } from './config/configuration';
import { ENTITIES } from './database/data-source';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { LocationsModule } from './locations/locations.module';
import { Location } from './locations/entities/location.entity';
import { MailModule } from './mail/mail.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('databaseUrl'),
        // The entity is included at the application root so Company relation
        // metadata and location repositories are available at runtime.
        entities: [...ENTITIES, Location],
        // Schema is owned by migrations in every environment; the e2e suite
        // builds it once in its global setup rather than per app instance.
        synchronize: false,
        logging: false,
      }),
    }),
    MailModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    LocationsModule,
  ],
  // Spec 2.1.4 — everything is protected unless explicitly marked @Public().
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
