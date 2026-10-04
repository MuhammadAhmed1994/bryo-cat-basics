import { Global, Module } from '@nestjs/common';
import { ConsoleMailService, MAIL_SERVICE } from './mail.service';

@Global()
@Module({
  providers: [
    ConsoleMailService,
    { provide: MAIL_SERVICE, useExisting: ConsoleMailService },
  ],
  exports: [MAIL_SERVICE, ConsoleMailService],
})
export class MailModule {}
