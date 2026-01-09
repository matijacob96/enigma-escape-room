import { supabase, getSupabaseClient, extractToken, corsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // GET - Obtener todos los records (público)
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .order('time_in_seconds', { ascending: true });

      if (error) throw error;

      const records = data.map(record => ({
        id: record.id,
        teamName: record.team_name,
        roomId: record.room_id,
        timeInSeconds: record.time_in_seconds,
        date: record.date
      }));

      return res.json(records);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Crear record (requiere autenticación)
  if (req.method === 'POST') {
    try {
      const { teamName, roomId, timeInSeconds } = req.body;
      const token = extractToken(req);
      const client = getSupabaseClient(token);
      
      const { data, error } = await client
        .from('records')
        .insert([{ 
          team_name: teamName, 
          room_id: roomId, 
          time_in_seconds: timeInSeconds 
        }])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        id: data.id,
        teamName: data.team_name,
        roomId: data.room_id,
        timeInSeconds: data.time_in_seconds,
        date: data.date
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
