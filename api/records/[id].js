import { getSupabaseClient, extractToken, corsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  // Set CORS headers for all requests
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  // DELETE - Eliminar record
  if (req.method === 'DELETE') {
    try {
      const token = extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'No autorizado - Token requerido' });
      }
      
      const client = getSupabaseClient(token);
      
      const { error } = await client
        .from('records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Récord eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting record:', error);
      return res.status(400).json({ error: error.message || 'Error al eliminar' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
