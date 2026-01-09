import { supabase, corsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    res.json({ 
      message: 'Usuario registrado. Verifica tu email.',
      user: data.user 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
