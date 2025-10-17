import { SelectQueryBuilder } from 'typeorm';
import { z } from 'zod';

let globalParamIdx = 0;

function nextParam(): string {
  globalParamIdx += 1;
  return `p${globalParamIdx}`;
}

function isPlainObject(v: any): v is Record<string, any> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

// Basic column resolver; can be overridden by consumers via their own fork if needed
function toColumn(alias: string, key: string): string {
  if (!key) return '';
  // prevent SQL injection-ish keys; allow a-z0-9_ and dot for JSON paths if needed later
  if (!/^[a-zA-Z0-9_]+$/.test(key)) return '';
  return `${alias}.${key}`;
}

export type MongoLike = any;

// Field type definition for schema builder
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | { enum: readonly string[] } | z.ZodTypeAny;
export type EntityFields = Record<string, FieldType>;

// Build a Zod schema for a single field according to its type
function zodForFieldType(ft: FieldType) {
  if (typeof ft === 'object' && 'enum' in ft) return z.enum(ft.enum as [string, ...string[]]);
  switch (ft) {
    case 'string':
      return z.string();
    case 'number':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'date':
      // allow string ISO or Date, transform to Date in validation step if desired
      return z.union([z.date(), z.string().datetime().transform((s) => new Date(s))]);
    default:
      return z.any();
  }
}

// Allowed operators per primitive type
function buildOpsSchemaForType(base: z.ZodTypeAny, kind: 'string' | 'number' | 'boolean' | 'date' | 'enum') {
  const eqne = z.object({ $eq: base }).partial().and(z.object({ $ne: base }).partial());

  if (kind === 'boolean') {
    return eqne;
  }
  if (kind === 'string' || kind === 'enum') {
    const inOps = z.object({ $in: z.array(base).min(1), $nin: z.array(base).min(1) }).partial();
    const regexOps = z
      .object({ $regex: z.union([z.string(), z.instanceof(RegExp)]), $options: z.string().optional() })
      .partial();
    return eqne.and(inOps).and(regexOps);
  }
  // number/date: gt/gte/lt/lte and in/nin
  const cmpOps = z.object({ $gt: base, $gte: base, $lt: base, $lte: base }).partial();
  const inOps = z.object({ $in: z.array(base).min(1), $nin: z.array(base).min(1) }).partial();
  return eqne.and(cmpOps).and(inOps);
}

// Create a Zod schema for a Mongo-like filter bound to an entity fields spec
export function createFilterSchema(fields: EntityFields) {
  // Forward declaration for recursive schema
  type AnyFilter = Record<string, unknown>;
  let FilterSchema: z.ZodType<AnyFilter>;

  const fieldSchemas: Record<string, z.ZodTypeAny> = {};
  for (const [name, ft] of Object.entries(fields)) {
    const kind = typeof ft === 'object' && 'enum' in ft ? 'enum' : (ft as any);
    const base = zodForFieldType(ft);
    const ops = buildOpsSchemaForType(base, kind as any);
    // Field value can be direct base value or operators object
    fieldSchemas[name] = z.union([base, ops]);
  }

  // This is filled after FilterSchema is set up so we can reference recursively
  FilterSchema = z.lazy(() =>
    z
      .object({
        // Logical operators
        $and: z.array(FilterSchema).min(1).optional(),
        $or: z.array(FilterSchema).min(1).optional(),
        $not: FilterSchema.optional(),
        // Fields for the entity
        ...fieldSchemas,
      })
      // Disallow unknown keys outside declared fields and logical keys
      .strict()
  );

  return FilterSchema;
}

// Convenience type helper for consumers
export type FilterFor<F extends EntityFields> = z.infer<ReturnType<typeof createFilterSchema>>;

// Overload: allow passing a Zod schema for validation. If provided, invalid filters are ignored by default.
export function applyFilter(
  qb: SelectQueryBuilder<any>,
  alias: string,
  filter: MongoLike,
  options?: { schema?: z.ZodTypeAny; onInvalid?: 'ignore' | 'throw' }
): void {
  if (!filter || !isPlainObject(filter)) return;
  if (options?.schema) {
    const parsed = options.schema.safeParse(filter);
    if (!parsed.success) {
      if (options.onInvalid === 'throw') {
        throw parsed.error;
      }
      return; // ignore invalid filter
    }
    // use parsed.data to ensure transformed values like dates are applied
    filter = parsed.data as any;
  }
  const { clause, params } = buildClause(alias, filter);
  if (clause) qb.andWhere(clause, params);
}

function buildClause(alias: string, filter: any): { clause: string; params: Record<string, any> } {
  const parts: string[] = [];
  const params: Record<string, any> = {};

  const push = (cl: string, pr: Record<string, any>) => {
    if (cl) parts.push(`(${cl})`);
    Object.assign(params, pr);
  };

  for (const [key, value] of Object.entries(filter as Record<string, unknown>)) {
    if (key === '$and' && Array.isArray(value)) {
      const subClauses = value.map((v) => buildClause(alias, v));
      const clause = subClauses.map((c) => (c.clause ? `(${c.clause})` : '')).filter(Boolean).join(' AND ');
      const pr = Object.assign({}, ...subClauses.map((c) => c.params));
      push(clause, pr);
      continue;
    }
    if (key === '$or' && Array.isArray(value)) {
      const subClauses = value.map((v) => buildClause(alias, v));
      const clause = subClauses.map((c) => (c.clause ? `(${c.clause})` : '')).filter(Boolean).join(' OR ');
      const pr = Object.assign({}, ...subClauses.map((c) => c.params));
      push(clause, pr);
      continue;
    }
    if (key === '$not' && isPlainObject(value)) {
      const sub = buildClause(alias, value);
      if (sub.clause) push(`NOT (${sub.clause})`, sub.params);
      continue;
    }

    const column = toColumn(alias, key);
    if (!column) {
      continue;
    }

    if (isPlainObject(value)) {
      for (const [op, val] of Object.entries(value as Record<string, unknown>)) {
        switch (op) {
          case '$eq': {
            const p = nextParam();
            push(`${column} = :${p}`, { [p]: val });
            break;
          }
          case '$ne': {
            const p = nextParam();
            push(`${column} != :${p}`, { [p]: val });
            break;
          }
          case '$gt': {
            const p = nextParam();
            push(`${column} > :${p}`, { [p]: column.endsWith('scraped_at') ? new Date(val as any) : (val as any) });
            break;
          }
          case '$gte': {
            const p = nextParam();
            push(`${column} >= :${p}`, { [p]: column.endsWith('scraped_at') ? new Date(val as any) : (val as any) });
            break;
          }
          case '$lt': {
            const p = nextParam();
            push(`${column} < :${p}`, { [p]: column.endsWith('scraped_at') ? new Date(val as any) : (val as any) });
            break;
          }
          case '$lte': {
            const p = nextParam();
            push(`${column} <= :${p}`, { [p]: column.endsWith('scraped_at') ? new Date(val as any) : (val as any) });
            break;
          }
          case '$in': {
            if (Array.isArray(val) && val.length) {
              const p = nextParam();
              push(`${column} IN (:...${p})`, { [p]: val });
            }
            break;
          }
          case '$nin': {
            if (Array.isArray(val) && val.length) {
              const p = nextParam();
              push(`${column} NOT IN (:...${p})`, { [p]: val });
            }
            break;
          }
          case '$regex': {
            const pattern = String(val);
            const options = typeof (value).$options === 'string' ? String((value).$options) : '';
            const like = `%${pattern.replace(/[%_]/g, '\\$&')}%`;
            const p = nextParam();
            if (options.includes('i')) {
              push(`LOWER(${column}) LIKE :${p}`, { [p]: like.toLowerCase() });
            } else {
              push(`${column} LIKE :${p}`, { [p]: like });
            }
            break;
          }
          default:
            break;
        }
      }
    } else {
      const p = nextParam();
      push(`${column} = :${p}`, { [p]: column.endsWith('scraped_at') ? new Date(value as any) : (value as any) });
    }
  }

  return { clause: parts.filter(Boolean).join(' AND '), params };
}
