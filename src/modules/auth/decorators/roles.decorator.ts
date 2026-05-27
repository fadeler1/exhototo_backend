import { SetMetadata } from '@nestjs/common';
import { UserPerfil } from '../../../common/enums/user-perfil.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserPerfil[]) => SetMetadata(ROLES_KEY, roles);
