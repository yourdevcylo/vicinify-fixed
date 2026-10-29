import { renderHttpError } from './lib/http-errors.js';
export default async request => renderHttpError(request,429,{retryAfter:60});
export const config = { path: '/__rate-limited' };
