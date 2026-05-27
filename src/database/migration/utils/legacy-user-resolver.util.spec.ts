import { Types } from 'mongoose';
import {
  buildLegacyUserResolver,
  normalizeLegacyUserKey,
} from './legacy-user-resolver.util';

describe('legacy-user-resolver', () => {
  const users = [
    {
      _id: new Types.ObjectId(),
      nombre: 'CATALINA CUBILLOS',
      login: 'ccubillos',
    },
    {
      _id: new Types.ObjectId(),
      nombre: 'pablo',
      login: 'pmagnere',
    },
  ];

  it('normaliza espacios y mayúsculas', () => {
    expect(normalizeLegacyUserKey('  catalina   cubillos ')).toBe(
      'CATALINA CUBILLOS',
    );
  });

  it('resuelve por nombre exacto', () => {
    const resolver = buildLegacyUserResolver(users);
    const result = resolver.resolve('CATALINA CUBILLOS');
    expect(result.userId).toEqual(users[0]._id);
    expect(result.nombre).toBe('CATALINA CUBILLOS');
  });

  it('resuelve por login', () => {
    const resolver = buildLegacyUserResolver(users);
    const result = resolver.resolve('pmagnere');
    expect(result.userId).toEqual(users[1]._id);
    expect(result.nombre).toBe('pablo');
  });

  it('devuelve solo nombre si no hay match', () => {
    const resolver = buildLegacyUserResolver(users);
    const result = resolver.resolve('DESCONOCIDO');
    expect(result.userId).toBeUndefined();
    expect(result.nombre).toBe('DESCONOCIDO');
  });
});
