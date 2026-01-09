import { getSupabaseClient, extractToken, corsHeaders } from '../_lib/supabase.js';

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
    const token = extractToken(req);
    const client = getSupabaseClient(token);
    const { error } = await client.auth.signOut();
    
    if (error) throw error;

    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
