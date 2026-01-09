import { getSupabaseClient, extractToken, corsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { id } = req.query;

  // DELETE - Eliminar record
  if (req.method === 'DELETE') {
    try {
      const token = extractToken(req);
      const client = getSupabaseClient(token);
      
      const { error } = await client
        .from('records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Récord eliminado correctamente' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
