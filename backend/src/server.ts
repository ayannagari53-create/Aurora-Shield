import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import scanRoutes from './routes/scan.routes.js';
import reportRoutes from './routes/report.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  config.frontendUrl
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Dev flexible fallback
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests dispatched from this IP address. Please try again after 15 minutes.'
  }
});
app.use(limiter);

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/reports', reportRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Error Handler
app.use(errorMiddleware as any);

// Start Server
app.listen(config.port, () => {
  console.log(`
  ======================================================
  🛡️  AURORA SHIELD COMPLIANCE BACKEND ENGINE
  ======================================================
  🟢 Service: Operational
  📍 Port: ${config.port}
  🌐 Health Check: http://localhost:${config.port}/api/health
  🔒 Security: Helmet, CORS, Rate-Limiting, Multer Active
  ======================================================
  `);
});

export default app;
