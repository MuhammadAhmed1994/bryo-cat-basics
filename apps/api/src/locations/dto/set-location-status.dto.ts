import { IsBoolean } from 'class-validator';

/** Request contract for activating or deactivating a location. */
export class SetLocationStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
