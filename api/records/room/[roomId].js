import { supabase, corsHeaders } from '../../_lib/supabase.js';

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
    const { roomId } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('room_id', roomId)
      .order('time_in_seconds', { ascending: true })
      .limit(limit);

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
