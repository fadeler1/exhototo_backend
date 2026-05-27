import { UserPerfil } from '../../common/enums/user-perfil.enum';

/** Datos migrados desde tabla MySQL `USUARIO` (legacy tramitador). */
export interface LegacyUserSeed {
  legacyId: number;
  nombre: string;
  login: string;
  password: string;
  perfil: UserPerfil;
  email: string;
  autorizacion: number;
}

export const USERS_SEED_DATA: LegacyUserSeed[] = [
  {
    legacyId: 1,
    nombre: 'PATRICIA ABARCA',
    login: 'pipe1507',
    password: 'patyabarca',
    perfil: UserPerfil.TODO,
    email: 'patricia.abarca@tramitadorexhorto.cl',
    autorizacion: 31636,
  },
  {
    legacyId: 12,
    nombre: 'HELEN GONZALEZ',
    login: 'hgonzalez',
    password: 'helen131',
    perfil: UserPerfil.TODO,
    email: 'helen.gonzalez@tramitadorexhorto.cl',
    autorizacion: 0,
  },
  {
    legacyId: 13,
    nombre: 'CATALINA CUBILLOS',
    login: 'ccubillos',
    password: 'cata131',
    perfil: UserPerfil.INGRESAR,
    email: 'tramitadorexhorto@gmail.com',
    autorizacion: 30845,
  },
  {
    legacyId: 14,
    nombre: 'pablo',
    login: 'pmagnere',
    password: 'password123',
    perfil: UserPerfil.TODO,
    email: 'pablo.magnere.neira@gmail.com',
    autorizacion: 20239,
  },
];
