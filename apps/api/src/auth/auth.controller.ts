import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { AuthService, toAuthenticatedUser } from './auth.service';
import { UsersService } from '../users/users.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import {
  ChangePasswordDto,
  CompleteSignupDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  /** Spec 2.1.1 */
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Spec 2.1.2 */
  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentUser() user: RequestUser): Promise<void> {
    await this.auth.logout(user.sessionId, user.id);
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    const fresh = await this.users.findOne(user.id);
    return toAuthenticatedUser(fresh);
  }

  /**
   * Spec 2.1.6.1 — always 202 so the "Help is on its way" screen shows
   * regardless of whether the address is on file.
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(202)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.auth.requestPasswordReset(dto.email);
    return {
      message:
        'We have sent you an email with instructions to reset your password.',
    };
  }

  /** Spec 2.1.6.1 */
  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.auth.resetPassword(dto.token, dto.password);
    return { message: 'Your password has been reset successfully.' };
  }

  /** Spec 2.5.1.2 — prefill the create-account screen from the invite link. */
  @Public()
  @Get('invitation')
  invitation(@Query('token') token: string) {
    return this.auth.getInvitation(token ?? '');
  }

  /** Spec 2.5.1.2 — claim the invite and get signed straight in. */
  @Public()
  @Post('signup')
  @HttpCode(201)
  async signup(@Body() dto: CompleteSignupDto) {
    const result = await this.auth.completeSignup(dto);
    return { ...result, message: 'Your account has been created successfully.' };
  }

  /** Spec 2.3.2 */
  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return { message: 'Your password has been changed successfully.' };
  }
}
