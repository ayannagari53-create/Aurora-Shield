import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/auth';

export const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSessionFromUrl();
      if (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed', { replace: true });
        return;
      }
      if (data.session) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    };
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100">
      <p>Signing you in...</p>
    </div>
  );
};
