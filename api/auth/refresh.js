import { supabase, corsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token no proporcionado' });
    }

    // Usar el refresh token para obtener una nueva sesión
    const { data, error } = await supabase.auth.refreshSession({ 
      refresh_token 
    });

    if (error) throw error;
    if (!data.session) throw new Error('No se pudo renovar la sesión');

    res.json({ 
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      },
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
