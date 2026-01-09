import { getSupabaseClient, extractToken, corsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { id } = req.query;
  const token = extractToken(req);
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

      return res.json({
        id: data.id,
        name: data.name,
        image: data.image,
        themeColor: data.theme_color
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
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

      return res.json({ message: 'Sala eliminada correctamente' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
