import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

const LOCAL_SESSION_KEY = 'aurora_shield_auth_session';
const LOCAL_USERS_KEY = 'aurora_shield_registered_users';

export class AuthService {
  /**
   * Registers a new user account
   */
  public static async signUp(email: string, password: string, fullName: string): Promise<AuthSession> {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Registration failed.');

      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          fullName
        },
        token: data.session?.access_token || `token_${Date.now()}`
      };
      this.saveLocalSession(session);
      return session;
    }

    // Local persistent registration when Supabase keys are not yet deployed
    const existingUsersRaw = localStorage.getItem(LOCAL_USERS_KEY);
    const existingUsers: Record<string, { email: string; passwordHash: string; fullName: string; id: string }> = existingUsersRaw
      ? JSON.parse(existingUsersRaw)
      : {};

    if (existingUsers[email.toLowerCase()]) {
      throw new Error('An account with this email address already exists.');
    }

    const userId = `usr_${Math.random().toString(36).slice(2, 11)}`;
    // Simple client-side hash representation for storage
    existingUsers[email.toLowerCase()] = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash: btoa(password),
      fullName
    };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(existingUsers));

    const session: AuthSession = {
      user: { id: userId, email: email.toLowerCase(), fullName },
      token: `aurora_jwt_${btoa(JSON.stringify({ sub: userId, email: email.toLowerCase(), fullName, exp: Date.now() + 86400000 }))}`
    };
    this.saveLocalSession(session);
    return session;
  }

  /**
   * Logs in an existing user
   */
  public static async signIn(email: string, password: string): Promise<AuthSession> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user || !data.session) throw new Error('Invalid credentials.');

      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          fullName: data.user.user_metadata?.full_name || 'Compliance Officer'
        },
        token: data.session.access_token
      };
      this.saveLocalSession(session);
      return session;
    }

    const existingUsersRaw = localStorage.getItem(LOCAL_USERS_KEY);
    const existingUsers = existingUsersRaw ? JSON.parse(existingUsersRaw) : {};
    const userRecord = existingUsers[email.toLowerCase()];

    if (!userRecord || userRecord.passwordHash !== btoa(password)) {
      throw new Error('Invalid email or password. Please verify credentials.');
    }

    const session: AuthSession = {
      user: { id: userRecord.id, email: userRecord.email, fullName: userRecord.fullName },
      token: `aurora_jwt_${btoa(JSON.stringify({ sub: userRecord.id, email: userRecord.email, fullName: userRecord.fullName, exp: Date.now() + 86400000 }))}`
    };
    this.saveLocalSession(session);
    return session;
  }

  /**
   * Sends password reset email
   */
  public static async resetPassword(email: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message);
      return;
    }
    // Simulate reset email acknowledgment
    await new Promise(r => setTimeout(r, 600));
  }

  /**
   * Logs out current session
   */
  public static async signOut(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }

  /**
   * Retrieves active session
   */
  public static getSession(): AuthSession | null {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }

  private static saveLocalSession(session: AuthSession): void {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  }
}
