declare module 'response-time' {
  import { RequestHandler } from 'express';
  function responseTime(options?: { suffix?: boolean; header?: string; digits?: number }): RequestHandler;
  export = responseTime;
}
