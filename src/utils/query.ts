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

export const applyFilter = <T>(q: Record<string, unknown>) => (db: T): T => {
  const db_ = db as unknown as Record<string, (column: string, value: unknown) => unknown>;
  Object.keys(q).forEach((key) => {
    const qValue = q[key];
    if (qValue) {
      if (/.*name.*/.test(key)) {
        (db_ as Record<string, (column: string, value: string) => unknown>).whereLike(key, `%${String(qValue).toLowerCase()}%`);
      } else {
        db_.where(key, qValue);
      }
    }
  });
  return db;
}

export const applySort = <T>(sort: { key?: string; order?: 'asc' | 'desc' }) => (db: T): T => {
  const { key, order } = sort;
  const db_ = db as unknown as Record<string, (column: string, direction: string) => unknown>;
  if (key && order) {
    db_.orderBy(key, order);
  }
  return db;
}

export const applyPagination = <T>(pagination: { limit?: number; offset?: number }) => (db: T): T => {
  const { limit, offset } = pagination;
  const db_ = db as unknown as Record<string, (n: number) => unknown>;
  if (limit) db_.limit(limit);
  if (offset) db_.offset(offset);
  return db;
}
