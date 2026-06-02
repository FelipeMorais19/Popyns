import pino from 'pino';
import { isProduction } from '../config/env.js';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  base: undefined,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
});
