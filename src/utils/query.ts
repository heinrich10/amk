import { ExpressionBuilder, sql } from 'kysely';

export const extractQueryParams = (query: Record<string, unknown> = {}, validKeys: string[] = []) => {
  const params: Record<string, unknown> = {};
  for (const key of validKeys) {
    params[key] = query[key];
  }
  return params;
}

export const extractSort = (query: Record<string, unknown> = {}, validKeys: string[]) => {
  const { sort } = query;
  if (!sort || typeof sort !== 'string') return {};
  const firstChar = sort[0];
  const sortKey = ['+', '-'].includes(firstChar) ? sort.slice(1) : sort;
  if (validKeys.includes(sortKey)) {
    if(firstChar === '-') {
      return {
        key: sortKey,
        order: 'desc' as const
      }
    } else {
      return {
        key: sortKey,
        order: 'asc' as const
      }
    }
  } else {
    return {};
  }
}

export const extractPagination = (query: Record<string, unknown> = {}) => {
  const offset = typeof query.offset === 'string' ? +query.offset : 0;
  const limit = typeof query.limit === 'string' ? +query.limit : 10;
  return {
    offset: offset || 0,
    limit: limit || 10
  }
}

export const extract = (query: Record<string, unknown>, validKeys: string[]) => {
  return [
    extractQueryParams(query, validKeys),
    extractSort(query, validKeys),
    extractPagination(query)
  ] as const
}

export const applyFilter = <DB, TB extends keyof DB>(q: Record<string, unknown>) => {
  return (eb: ExpressionBuilder<DB, TB>) => {
    const conditions = [];
    for (const [key, value] of Object.entries(q)) {
      if (value !== undefined && value !== null && value !== '') {
        const strValue = typeof value === 'string' ? value : JSON.stringify(value);
        if (/.*name.*/.test(key)) {
          conditions.push(eb(sql.ref(key), 'like', `%${strValue.toLowerCase()}%`));
        } else {
          conditions.push(eb(sql.ref(key), '=', strValue));
        }
      }
    }
    if (conditions.length === 0) {
      return eb(sql`1`, '=', 1);
    }
    return conditions.length === 1 ? conditions[0] : eb.and(conditions);
  };
};
