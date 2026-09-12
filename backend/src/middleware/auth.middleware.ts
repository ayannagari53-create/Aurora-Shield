import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

let supabaseClient: any = null;
if (config.supabaseUrl && config.supabaseServiceRoleKey) {
  supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
// Diagnostic logging for auth debugging (do not log token value)
console.log('--- Auth Middleware Debug ---');
console.log('Authorization header present:', !!authHeader);
if (authHeader) {
  console.log('Header starts with Bearer:', authHeader.startsWith('Bearer '));
}

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  console.log('Missing or malformed Authorization header');
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Missing or invalid Authorization header. Expected Bearer token.'
  });
  return;
}

const token = authHeader.split(' ')[1];

  // Reject demo token in production
  if (process.env.NODE_ENV !== 'development' && token === 'demo_token') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Demo token is not allowed in production.'
    });
    return;
  }

  // If Supabase keys are configured in environment, verify with Supabase Auth
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Session invalid or expired. Please re-authenticate.'
        });
        return;
      }
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role
      };
      next();
      return;
    } catch (err) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token verification failed.'
      });
      return;
    }
  }

  // Fallback for local development only – do NOT accept arbitrary JWTs in production
  if (process.env.NODE_ENV === 'development') {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        req.user = {
          id: payload.sub || payload.id || 'usr_session_active',
          email: payload.email || 'operator@aurorashield.ai',
          role: payload.role || 'compliance_officer'
        };
      } else {
        req.user = {
          id: token === 'demo_token' ? 'demo-judge-user' : `usr_${token.slice(0, 10)}`,
          email: 'operator@aurorashield.ai',
          role: 'compliance_officer'
        };
      }
      next();
    } catch (e) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Malformed authorization token.'
      });
    }
    return;
  }

  // If we reach here, no valid auth method available
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Authentication required.'
  });
}
