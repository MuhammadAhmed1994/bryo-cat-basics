import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';

export const MAIL_SERVICE = Symbol('MAIL_SERVICE');

export interface MailService {
  /** Spec 2.5.1.1 — "Nbryo has invited you to join Cattlytics IVF." */
  sendInvitation(invitee: User, inviter: User, link: string): Promise<void>;
  /** Spec 2.1.6.4 — "Reset your password!" */
  sendPasswordReset(user: User, link: string): Promise<void>;
}

export interface SentMail {
  to: string;
  subject: string;
  body: string;
}

/**
 * Logs mail instead of sending it. Swap this provider for a real transport
 * (SES, SendGrid) in production; the sent-mail log keeps local and test runs
 * able to assert on content.
 */
@Injectable()
export class ConsoleMailService implements MailService {
  private readonly logger = new Logger(ConsoleMailService.name);
  readonly outbox: SentMail[] = [];

  constructor(private readonly config: ConfigService) {}

  async sendInvitation(invitee: User, inviter: User, link: string): Promise<void> {
    this.send({
      to: invitee.email,
      subject: 'Nbryo has invited you to join Cattlytics IVF.',
      body: [
        'Sign Up',
        `Hi ${invitee.firstName},`,
        `${inviter.firstName} ${inviter.lastName} from Nbryo has invited you to join Cattlytics IVF.`,
        'You can create an account using the following button:',
        `Create Account: ${link}`,
        'Best Regards,',
        'Nbryo Support',
      ].join('\n'),
    });
  }

  async sendPasswordReset(user: User, link: string): Promise<void> {
    this.send({
      to: user.email,
      subject: 'Reset your password!',
      body: [
        'Reset Your Password',
        `Hi ${user.firstName},`,
        'Forgot your password? Don’t worry, we’ve got you covered. Click on the button below to reset your password.',
        `Reset Password: ${link}`,
        'Best Regards,',
        'Nbryo Team',
      ].join('\n'),
    });
  }

  private send(mail: SentMail): void {
    const fromName = this.config.get<string>('mail.fromName');
    const from = this.config.get<string>('mail.from');
    this.outbox.push(mail);
    this.logger.log(`[mail] ${fromName} <${from}> -> ${mail.to}: ${mail.subject}\n${mail.body}`);
  }
}
