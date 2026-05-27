import { ExhortoSchema } from './exhorto.schema';

export const RESPALDO_EXHORTO_MODEL = 'RespaldoExhorto';

export const RespaldoExhortoSchema = ExhortoSchema.clone();
RespaldoExhortoSchema.set('collection', 'respaldo_exhorto');
