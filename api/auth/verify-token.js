import { getSupabaseClient, corsHeaders } from '../_lib/supabase.js';

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
    const { access_token, refresh_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    const client = getSupabaseClient(access_token);
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error) throw error;
    if (!user) throw new Error('Usuario no encontrado');

    res.json({ 
      user: {
        id: user.id,
        email: user.email
      },
      session: {
        access_token,
        refresh_token
      }
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
