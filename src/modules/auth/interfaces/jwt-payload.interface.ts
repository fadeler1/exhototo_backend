import { UserPerfil } from '../../../common/enums/user-perfil.enum';

export interface JwtPayload {
  sub: string;
  login: string;
  nombre: string;
  perfil: UserPerfil;
}
