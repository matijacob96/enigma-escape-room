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
  const token = extractToken(req);
  
  if (!token && (req.method === 'PUT' || req.method === 'DELETE')) {
    return res.status(401).json({ error: 'No autorizado - Token requerido' });
  }
  
  const client = getSupabaseClient(token);

  // PUT - Actualizar sala
  if (req.method === 'PUT') {
    try {
      const { name, image, themeColor } = req.body;
      
      const { data, error } = await client
        .from('rooms')
        .update({ 
          name, 
          image, 
          theme_color: themeColor 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        id: data.id,
        name: data.name,
        image: data.image,
        themeColor: data.theme_color
      });
    } catch (error) {
      console.error('Error updating room:', error);
      return res.status(400).json({ error: error.message || 'Error al actualizar' });
    }
  }

  // DELETE - Eliminar sala
  if (req.method === 'DELETE') {
    try {
      const { error } = await client
        .from('rooms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Sala eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting room:', error);
      return res.status(400).json({ error: error.message || 'Error al eliminar' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
