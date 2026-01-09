import { getSupabaseClient, extractToken, corsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const client = getSupabaseClient(token);
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error) throw error;

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
