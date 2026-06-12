export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface ContinentResponse {
  code: string;
  name: string;
}

export interface CountryItem {
  code: string;
  name: string;
  continent?: { code: string; name: string };
}

export interface PersonItem {
  id: number;
  first_name: string;
  country?: { continent?: Record<string, unknown> };
}

export interface ErrorResponse {
  message: string;
  errors?: unknown[];
}
