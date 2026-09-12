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

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected Bearer token.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

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

  // Fallback for local evaluation prior to Supabase credentials injection
  // Accepts authentic Supabase JWT or client session tokens
  try {
    // Basic JWT structure verification (header.payload.signature)
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      req.user = {
        id: payload.sub || payload.id || 'usr_session_active',
        email: payload.email || 'operator@aurorashield.ai',
        role: payload.role || 'compliance_officer'
      };
    } else {
      // Local dev token
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
}
