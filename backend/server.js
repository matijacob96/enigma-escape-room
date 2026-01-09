import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para extraer el token JWT del usuario autenticado
const extractToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    req.token = authHeader.split(' ')[1];
  }
  next();
};

app.use(extractToken);

// Helper para crear cliente con token del usuario
const getSupabaseClient = (token) => {
  if (token) {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return supabase;
};

// ==================== AUTENTICACIÓN ====================

// Registro de usuario
app.post('/api/auth/signup', async (req, res) => {
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
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({ 
      session: data.session,
      user: data.user 
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const client = getSupabaseClient(req.token);
    const { error } = await client.auth.signOut();
    
    if (error) throw error;

    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verificar sesión
app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.token) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const client = getSupabaseClient(req.token);
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error) throw error;

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Verificar token del callback de Supabase (después de confirmar email)
app.post('/api/auth/verify-token', async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    // Crear cliente con el token para verificar
    const client = getSupabaseClient(access_token);
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error) throw error;
    if (!user) throw new Error('Usuario no encontrado');

    res.json({ 
      user: {
        id: user.id,
        email: user.email
      },
      session: {
        access_token,
        refresh_token
      }
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// ==================== ROOMS ====================

// Obtener todas las salas (público)
app.get('/api/rooms', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mapear a formato esperado por el frontend
    const rooms = data.map(room => ({
      id: room.id,
      name: room.name,
      image: room.image,
      themeColor: room.theme_color
    }));

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear sala (requiere autenticación)
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, image, themeColor } = req.body;
    const client = getSupabaseClient(req.token);
    
    const { data, error } = await client
      .from('rooms')
      .insert([{ 
        name, 
        image, 
        theme_color: themeColor || 'purple' 
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      id: data.id,
      name: data.name,
      image: data.image,
      themeColor: data.theme_color
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar sala (requiere autenticación)
app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, themeColor } = req.body;
    const client = getSupabaseClient(req.token);
    
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

    res.json({
      id: data.id,
      name: data.name,
      image: data.image,
      themeColor: data.theme_color
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar sala (requiere autenticación)
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient(req.token);
    
    const { error } = await client
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Sala eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== RECORDS ====================

// Obtener todos los records (público)
app.get('/api/records', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .order('time_in_seconds', { ascending: true });

    if (error) throw error;

    // Mapear a formato esperado por el frontend
    const records = data.map(record => ({
      id: record.id,
      teamName: record.team_name,
      roomId: record.room_id,
      timeInSeconds: record.time_in_seconds,
      date: record.date
    }));

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener records por sala (público)
app.get('/api/records/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

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

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear record (requiere autenticación)
app.post('/api/records', async (req, res) => {
  try {
    const { teamName, roomId, timeInSeconds } = req.body;
    const client = getSupabaseClient(req.token);
    
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

    res.status(201).json({
      id: data.id,
      teamName: data.team_name,
      roomId: data.room_id,
      timeInSeconds: data.time_in_seconds,
      date: data.date
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar record (requiere autenticación)
app.delete('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient(req.token);
    
    const { error } = await client
      .from('records')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Récord eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 ENIGMA Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 Conectado a Supabase: ${supabaseUrl}`);
});
