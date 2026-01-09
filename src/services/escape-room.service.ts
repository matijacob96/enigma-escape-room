import { Injectable, signal, computed, effect } from '@angular/core';

export interface Room {
  id: string;
  name: string;
  themeColor: string;
  image: string;
}

export interface GameRecord {
  id: string;
  teamName: string;
  roomId: string;
  timeInSeconds: number;
  date: string;
}

export interface User {
  id: string;
  email: string;
}

// En producción (Vercel) usa rutas relativas, en desarrollo usa el backend local
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? '/api'  // Producción - Vercel Serverless
  : 'http://localhost:3000/api';  // Desarrollo local

@Injectable({
  providedIn: 'root'
})
export class EscapeRoomService {
  // State
  private roomsSignal = signal<Room[]>([]);
  private recordsSignal = signal<GameRecord[]>([]);
  private userSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  constructor() {
    this.loadStoredSession();
    this.loadData();
  }

  // Getters públicos
  get records() {
    return this.recordsSignal.asReadonly();
  }

  get rooms() {
    return this.roomsSignal.asReadonly();
  }

  get user() {
    return this.userSignal.asReadonly();
  }

  get isAuthenticated() {
    return computed(() => !!this.userSignal());
  }

  get loading() {
    return this.loadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  // ==================== AUTH ====================

  private loadStoredSession() {
    const token = localStorage.getItem('enigma_token');
    const userStr = localStorage.getItem('enigma_user');
    
    if (token && userStr) {
      try {
        this.tokenSignal.set(token);
        this.userSignal.set(JSON.parse(userStr));
      } catch (e) {
        this.clearSession();
      }
    }
  }

  private saveSession(token: string, user: User) {
    localStorage.setItem('enigma_token', token);
    localStorage.setItem('enigma_user', JSON.stringify(user));
    this.tokenSignal.set(token);
    this.userSignal.set(user);
  }

  private clearSession() {
    localStorage.removeItem('enigma_token');
    localStorage.removeItem('enigma_user');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.tokenSignal();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async login(email: string, password: string): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      this.saveSession(data.session.access_token, {
        id: data.user.id,
        email: data.user.email
      });
      
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async signup(email: string, password: string): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar');
      }

      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (e) {
      // Ignorar errores de logout
    } finally {
      this.clearSession();
    }
  }

  // Manejar callback de Supabase Auth (después de verificar email)
  async handleAuthCallback(): Promise<boolean> {
    const hash = window.location.hash;
    
    if (hash && hash.includes('access_token')) {
      // Parsear los parámetros del hash
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      
      if (accessToken) {
        try {
          // Verificar el token con el backend
          const response = await fetch(`${API_URL}/auth/verify-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
          });

          if (response.ok) {
            const data = await response.json();
            this.saveSession(accessToken, {
              id: data.user.id,
              email: data.user.email
            });
            
            // Limpiar el hash de la URL
            window.history.replaceState(null, '', window.location.pathname);
            return true;
          }
        } catch (error) {
          console.error('Error verificando token:', error);
        }
      }
      
      // Limpiar el hash aunque falle
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    return false;
  }

  // ==================== DATA LOADING ====================

  async loadData() {
    await Promise.all([
      this.loadRooms(),
      this.loadRecords()
    ]);
  }

  async loadRooms() {
    try {
      const response = await fetch(`${API_URL}/rooms`);
      if (response.ok) {
        const rooms = await response.json();
        this.roomsSignal.set(rooms);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      // Fallback a datos demo si el backend no está disponible
      this.seedDemoRooms();
    }
  }

  async loadRecords() {
    try {
      const response = await fetch(`${API_URL}/records`);
      if (response.ok) {
        const records = await response.json();
        this.recordsSignal.set(records);
      }
    } catch (error) {
      console.error('Error loading records:', error);
      // Fallback a datos demo si el backend no está disponible
      this.seedDemoRecords();
    }
  }

  // ==================== ROOM ACTIONS ====================

  async addRoom(name: string, image: string, themeColor: string = 'purple'): Promise<boolean> {
    this.errorSignal.set(null);
    
    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name, image, themeColor })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear sala');
      }

      this.roomsSignal.update(rooms => [...rooms, data]);
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message);
      // Fallback local si no hay backend
      if (error.message.includes('fetch')) {
        const newRoom: Room = {
          id: crypto.randomUUID(),
          name,
          image,
          themeColor
        };
        this.roomsSignal.update(rooms => [...rooms, newRoom]);
        return true;
      }
      return false;
    }
  }

  async deleteRoom(id: string): Promise<boolean> {
    this.errorSignal.set(null);
    
    try {
      const response = await fetch(`${API_URL}/rooms/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar sala');
      }

      this.roomsSignal.update(rooms => rooms.filter(r => r.id !== id));
      // También eliminar records asociados localmente
      this.recordsSignal.update(records => records.filter(r => r.roomId !== id));
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message);
      // Fallback local
      if (error.message.includes('fetch')) {
        this.roomsSignal.update(rooms => rooms.filter(r => r.id !== id));
        return true;
      }
      return false;
    }
  }

  // ==================== RECORD ACTIONS ====================

  async addRecord(teamName: string, roomId: string, minutes: number, seconds: number): Promise<boolean> {
    this.errorSignal.set(null);
    const timeInSeconds = (minutes * 60) + seconds;
    
    try {
      const response = await fetch(`${API_URL}/records`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ teamName, roomId, timeInSeconds })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar récord');
      }

      this.recordsSignal.update(records => [...records, data]);
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message);
      // Fallback local
      if (error.message.includes('fetch')) {
        const newRecord: GameRecord = {
          id: crypto.randomUUID(),
          teamName,
          roomId,
          timeInSeconds,
          date: new Date().toISOString()
        };
        this.recordsSignal.update(records => [...records, newRecord]);
        return true;
      }
      return false;
    }
  }

  async deleteRecord(id: string): Promise<boolean> {
    this.errorSignal.set(null);
    
    try {
      const response = await fetch(`${API_URL}/records/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar récord');
      }

      this.recordsSignal.update(records => records.filter(r => r.id !== id));
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message);
      // Fallback local
      if (error.message.includes('fetch')) {
        this.recordsSignal.update(records => records.filter(r => r.id !== id));
        return true;
      }
      return false;
    }
  }

  getTopRecordsForRoom(roomId: string, limit: number = 10) {
    return computed(() => {
      const all = this.recordsSignal();
      return all
        .filter(r => r.roomId === roomId)
        .sort((a, b) => a.timeInSeconds - b.timeInSeconds)
        .slice(0, limit);
    });
  }

  // ==================== DEMO DATA (Fallback) ====================

  private seedDemoRooms() {
    const demoRooms: Room[] = [
      { 
        id: 'room-1', 
        name: 'La Mansión Embrujada', 
        themeColor: 'purple',
        image: 'https://picsum.photos/id/1036/800/600'
      },
      { 
        id: 'room-2', 
        name: 'El Robo al Banco', 
        themeColor: 'emerald',
        image: 'https://picsum.photos/id/1076/800/600'
      },
      { 
        id: 'room-3', 
        name: 'Laboratorio Alien', 
        themeColor: 'cyan',
        image: 'https://picsum.photos/id/1026/800/600'
      }
    ];
    this.roomsSignal.set(demoRooms);
  }

  private seedDemoRecords() {
    const demoData: GameRecord[] = [
      { id: '1', teamName: 'Los Escapistas', roomId: 'room-1', timeInSeconds: 3450, date: new Date().toISOString() },
      { id: '2', teamName: 'Mente Maestra', roomId: 'room-1', timeInSeconds: 2900, date: new Date().toISOString() },
      { id: '3', teamName: 'Sherlock Homies', roomId: 'room-2', timeInSeconds: 3100, date: new Date().toISOString() },
      { id: '4', teamName: 'Sin Salida', roomId: 'room-3', timeInSeconds: 3599, date: new Date().toISOString() },
    ];
    this.recordsSignal.set(demoData);
  }
}
