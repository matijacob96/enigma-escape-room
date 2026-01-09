import { getSupabaseClient, extractToken, corsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  // Set CORS headers for all requests
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only PUT allowed
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ error: 'No autorizado - Token requerido' });
  }
  
  const client = getSupabaseClient(token);

  try {
    const { orderedIds } = req.body;
    
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: 'orderedIds debe ser un array no vacío' });
    }

    // Update each room's display_order one by one
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await client
        .from('rooms')
        .update({ display_order: i + 1 })
        .eq('id', orderedIds[i]);
      
      if (error) {
        console.error(`Error updating room ${orderedIds[i]}:`, error);
        throw error;
      }
    }

    return res.status(200).json({ success: true, message: 'Orden actualizado' });
  } catch (error) {
    console.error('Error reordering rooms:', error);
    return res.status(400).json({ error: error.message || 'Error al reordenar' });
  }
}
