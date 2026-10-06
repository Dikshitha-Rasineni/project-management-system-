import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import cors, { type CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createApiLimiter, createLoginLimiter, createRegisterLimiter } from './middleware/rateLimiters';
import { buildApiRouter } from './routes';

export interface AppOptions {
  /** Override the auth rate limit (used by tests). */
  authRateLimitMax?: number;
}

/**
 * Builds the Express application. Kept separate from server.ts so tests can
 * create an app instance without opening a network port.
 */
export function createApp(options: AppOptions = {}) {
  const app = express();
  const authMax = options.authRateLimitMax ?? env.AUTH_RATE_LIMIT_MAX;

  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);

  // ---- Request logging (structured, with a request id) ---------------------
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  // ---- API docs (Swagger UI) — served with a relaxed CSP of its own --------
  const specPath = path.resolve(__dirname, '..', 'openapi.yaml');
  if (fs.existsSync(specPath)) {
    const spec = YAML.parse(fs.readFileSync(specPath, 'utf8'));
    app.get('/api/openapi.json', (_req, res) => {
      res.json(spec);
    });
    app.use(
      '/api/docs',
      helmet({ contentSecurityPolicy: false }),
      swaggerUi.serve,
      swaggerUi.setup(spec, { customSiteTitle: 'Project Management API' }),
    );
  }

  // ---- Security headers ----------------------------------------------------
  app.use(helmet());

  // ---- CORS: only the configured web origins may call the API from a browser.
  // Requests with no Origin header (the native mobile app, curl, server-to-
  // server) are not subject to CORS and are allowed; they still need a JWT.
  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalised = origin.replace(/\/$/, '');
      return callback(null, env.corsOrigins.includes(normalised));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy', 'Retry-After'],
    maxAge: 600,
  };
  app.use(cors(corsOptions));

  // ---- Body parsing with a size cap ---------------------------------------
  app.use(express.json({ limit: '100kb' }));

  // ---- Routes --------------------------------------------------------------
  app.get('/', (_req, res) => {
    res.json({ success: true, data: { name: 'Project Management API', docs: '/api/docs' } });
  });

  app.use(
    '/api',
    createApiLimiter(),
    buildApiRouter({
      loginLimiter: createLoginLimiter(authMax),
      registerLimiter: createRegisterLimiter(authMax),
    }),
  );

  // ---- 404 + centralised error handling -----------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
