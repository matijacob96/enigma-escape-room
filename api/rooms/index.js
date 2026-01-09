import { supabase, getSupabaseClient, extractToken, corsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // GET - Obtener todas las salas (público)
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const rooms = data.map(room => ({
        id: room.id,
        name: room.name,
        image: room.image,
        accentColor: room.accent_color || room.theme_color || '#02f700'
      }));

      return res.json(rooms);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Crear sala (requiere autenticación)
  if (req.method === 'POST') {
    try {
      const { name, image, accentColor } = req.body;
      const token = extractToken(req);
      const client = getSupabaseClient(token);
      
      const { data, error } = await client
        .from('rooms')
        .insert([{ 
          name, 
          image, 
          accent_color: accentColor || '#02f700' 
        }])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        id: data.id,
        name: data.name,
        image: data.image,
        accentColor: data.accent_color
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
