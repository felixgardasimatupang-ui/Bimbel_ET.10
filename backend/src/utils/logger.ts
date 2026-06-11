import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        },
      }),
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.refreshToken'],
    censor: '[REDACTED]',
  },
});

export default logger;
