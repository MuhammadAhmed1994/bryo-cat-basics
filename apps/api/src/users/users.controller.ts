import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService, toAuthenticatedUser } from '../auth/auth.service';
import { UserRole } from './entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { SetActiveDto } from '../common/dto/set-active.dto';

/** Spec 2.5 — user administration is Admin-only. */
@Controller('users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}

  /** Spec 2.5.1 — creates an Invited user and mails the invitation. */
  @Post()
  async invite(@Body() dto: InviteUserDto, @CurrentUser() actor: RequestUser) {
    const inviter = await this.users.findOne(actor.id);
    const user = await this.users.invite(dto, actor.id);
    await this.auth.sendInvitation(user, inviter);
    return { ...toAuthenticatedUser(user), message: 'User added successfully' };
  }

  /** Spec 2.5.5 */
  @Get()
  list(@Query() query: ListUsersDto) {
    return this.users.findAll(query);
  }

  /** Spec 2.5.2 */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  /** Spec 2.5.3 */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const user = await this.users.update(id, dto, actor.id);
    return { ...toAuthenticatedUser(user), message: 'User updated successfully.' };
  }

  /** Spec 2.5.6 */
  @Patch(':id/status')
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const user = await this.users.setActive(id, dto.isActive, actor.id);
    return toAuthenticatedUser(user);
  }

  /** Spec 2.5.2 — Resend Invite. */
  @Post(':id/resend-invite')
  @HttpCode(202)
  async resendInvite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const user = await this.users.findOne(id);
    const inviter = await this.users.findOne(actor.id);
    await this.auth.sendInvitation(user, inviter);
    return { message: 'Invitation sent successfully.' };
  }

  /** Spec 2.5.4 */
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.users.remove(id, actor.id);
    return { message: 'User deleted successfully.' };
  }
}
