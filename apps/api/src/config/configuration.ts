export interface AppConfig {
  port: number;
  webUrl: string;
  databaseUrl: string;
  jwt: { secret: string };
  /** Spec 2.1.3 — session auto-ends after N days of inactivity. Configurable; 90 for MVP. */
  sessionInactivityDays: number;
  /** Spec 2.1.6.3 — password reset link expiry. Configurable; 48h for MVP. */
  passwordResetExpiryHours: number;
  /** Spec 2.5.1.1 — invitation link expiry. Configurable; 72h for MVP. */
  invitationExpiryHours: number;
  mail: { from: string; fromName: string };
}

export const configuration = (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  webUrl: process.env.APP_WEB_URL ?? 'http://localhost:3000',
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgres://nbryo:nbryo@localhost:5433/nbryo',
  jwt: { secret: process.env.JWT_SECRET ?? 'dev-only-change-me' },
  sessionInactivityDays: parseInt(process.env.SESSION_INACTIVITY_DAYS ?? '90', 10),
  passwordResetExpiryHours: parseInt(
    process.env.PASSWORD_RESET_EXPIRY_HOURS ?? '48',
    10,
  ),
  invitationExpiryHours: parseInt(process.env.INVITATION_EXPIRY_HOURS ?? '72', 10),
  mail: {
    from: process.env.MAIL_FROM ?? 'noreply@nbryo.cattlytics.com',
    fromName: process.env.MAIL_FROM_NAME ?? 'Nbryo',
  },
});
