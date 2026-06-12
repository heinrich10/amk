export interface HttpError {
  statusCode?: number;
  message: string;
  name?: string;
  errors?: unknown;
  stack?: string;
}
