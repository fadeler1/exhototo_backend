import { Types } from 'mongoose';

export interface LegacyUserLookup {
  _id: Types.ObjectId;
  nombre: string;
  login: string;
}

export interface ResolvedLegacyUser {
  userId?: Types.ObjectId;
  nombre: string;
}

export interface LegacyUserResolver {
  resolve(legacyUsuario: string): ResolvedLegacyUser;
}

/** Normaliza nombres legacy para comparar con `users.nombre` / `users.login`. */
export function normalizeLegacyUserKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

export function buildLegacyUserResolver(
  users: LegacyUserLookup[],
): LegacyUserResolver {
  const byNombre = new Map<string, LegacyUserLookup>();
  const byLogin = new Map<string, LegacyUserLookup>();

  for (const user of users) {
    byNombre.set(normalizeLegacyUserKey(user.nombre), user);
    byLogin.set(user.login.trim().toLowerCase(), user);
  }

  return {
    resolve(legacyUsuario: string): ResolvedLegacyUser {
      const trimmed = legacyUsuario.trim().replace(/\s+/g, ' ');
      if (!trimmed) {
        return { nombre: 'migracion' };
      }

      const byName = byNombre.get(normalizeLegacyUserKey(trimmed));
      if (byName) {
        return { userId: byName._id, nombre: byName.nombre };
      }

      const byLoginKey = trimmed.toLowerCase();
      const byLoginMatch = byLogin.get(byLoginKey);
      if (byLoginMatch) {
        return { userId: byLoginMatch._id, nombre: byLoginMatch.nombre };
      }

      return { nombre: trimmed };
    },
  };
}
