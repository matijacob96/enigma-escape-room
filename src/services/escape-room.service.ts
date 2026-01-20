import { Injectable, signal, computed, effect } from '@angular/core';

export interface Room {
  id: string;
  name: string;
  accentColor: string;  // Color hex para títulos y números
  image: string;
  displayOrder: number; // Orden en que se muestran las slides
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
  private refreshTokenSignal = signal<string | null>(null);
  private tokenExpiresAtSignal = signal<number | null>(null);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.loadStoredSession();
    this.loadData();
    // Iniciar auto-refresh check cada 5 minutos
    this.startAutoRefresh();
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
    const refreshToken = localStorage.getItem('enigma_refresh_token');
    const expiresAt = localStorage.getItem('enigma_token_expires_at');
    const userStr = localStorage.getItem('enigma_user');
    
    if (token && userStr) {
      try {
        this.tokenSignal.set(token);
        this.refreshTokenSignal.set(refreshToken);
        this.tokenExpiresAtSignal.set(expiresAt ? parseInt(expiresAt) : null);
        this.userSignal.set(JSON.parse(userStr));
        
        // Verificar si el token ya expiró al cargar
        if (this.isTokenExpired()) {
          this.refreshSession();
        }
      } catch (e) {
        this.clearSession();
      }
    }
  }

  private saveSession(token: string, user: User, refreshToken?: string, expiresAt?: number) {
    localStorage.setItem('enigma_token', token);
    localStorage.setItem('enigma_user', JSON.stringify(user));
    this.tokenSignal.set(token);
    this.userSignal.set(user);
    
    if (refreshToken) {
      localStorage.setItem('enigma_refresh_token', refreshToken);
      this.refreshTokenSignal.set(refreshToken);
    }
    
    if (expiresAt) {
      localStorage.setItem('enigma_token_expires_at', expiresAt.toString());
      this.tokenExpiresAtSignal.set(expiresAt);
    }
  }

  private clearSession() {
    localStorage.removeItem('enigma_token');
    localStorage.removeItem('enigma_refresh_token');
    localStorage.removeItem('enigma_token_expires_at');
    localStorage.removeItem('enigma_user');
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.tokenExpiresAtSignal.set(null);
    this.userSignal.set(null);
  }

  // Verifica si el token está por expirar (5 minutos antes)
  private isTokenExpired(): boolean {
    const expiresAt = this.tokenExpiresAtSignal();
    if (!expiresAt) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const bufferSeconds = 300; // 5 minutos de buffer
    return now >= (expiresAt - bufferSeconds);
  }

  // Refresca la sesión usando el refresh token
  async refreshSession(): Promise<boolean> {
    const refreshToken = this.refreshTokenSignal();
    if (!refreshToken) {
      this.clearSession();
      return false;
    }

    // Evitar múltiples refresh simultáneos
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh(refreshToken);
    
    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        this.clearSession();
        return false;
      }

      const data = await response.json();
      this.saveSession(
        data.session.access_token,
        { id: data.user.id, email: data.user.email },
        data.session.refresh_token,
        data.session.expires_at
      );
      
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      this.clearSession();
      return false;
    }
  }

  // Inicia el auto-refresh cada 5 minutos
  private startAutoRefresh() {
    setInterval(() => {
      if (this.tokenSignal() && this.isTokenExpired()) {
        this.refreshSession();
      }
    }, 5 * 60 * 1000); // Check cada 5 minutos
  }

  // Asegura que el token sea válido antes de hacer una request
  private async ensureValidToken(): Promise<boolean> {
    if (!this.tokenSignal()) return false;
    
    if (this.isTokenExpired()) {
      return await this.refreshSession();
    }
    return true;
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

  // Wrapper para hacer requests autenticadas con auto-refresh
  private async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Asegurar token válido antes de la request
    await this.ensureValidToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {})
      }
    });

    // Si recibimos 401, intentar refresh y reintentar
    if (response.status === 401 && this.refreshTokenSignal()) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        // Reintentar con el nuevo token
        return fetch(url, {
          ...options,
          headers: {
            ...this.getAuthHeaders(),
            ...(options.headers || {})
          }
        });
      }
    }

    return response;
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

      this.saveSession(
        data.session.access_token,
        { id: data.user.id, email: data.user.email },
        data.session.refresh_token,
        data.session.expires_at
      );
      
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
      await this.authenticatedFetch(`${API_URL}/auth/logout`, {
        method: 'POST'
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
      const expiresAt = params.get('expires_at');
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
            this.saveSession(
              accessToken,
              { id: data.user.id, email: data.user.email },
              refreshToken || undefined,
              expiresAt ? parseInt(expiresAt) : undefined
            );
            
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
        // Ordenar por displayOrder
        rooms.sort((a: Room, b: Room) => (a.displayOrder || 0) - (b.displayOrder || 0));
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

  async addRoom(name: string, image: string, accentColor: string = '#02f700'): Promise<boolean> {
    this.errorSignal.set(null);
    
    try {
      const response = await this.authenticatedFetch(`${API_URL}/rooms`, {
        method: 'POST',
        body: JSON.stringify({ name, image, accentColor })
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
        const currentRooms = this.roomsSignal();
        const newRoom: Room = {
          id: crypto.randomUUID(),
          name,
          image,
          accentColor,
          displayOrder: currentRooms.length + 1
        };
        this.roomsSignal.update(rooms => [...rooms, newRoom]);
        return true;
      }
      return false;
    }
  }

  async updateRoom(id: string, name: string, image: string, accentColor: string): Promise<boolean> {
    this.errorSignal.set(null);
    
    try {
      const response = await this.authenticatedFetch(`${API_URL}/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, image, accentColor })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar sala');
      }

      this.roomsSignal.update(rooms => 
        rooms.map(r => r.id === id ? { ...r, name, image, accentColor } : r)
      );
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message);
      // Fallback local
      if (error.message.includes('fetch')) {
        this.roomsSignal.update(rooms => 
          rooms.map(r => r.id === id ? { ...r, name, image, accentColor } : r)
        );
        return true;
      }
      return false;
    }
  }

  // Reorder rooms - updates displayOrder for all rooms
  async reorderRooms(orderedIds: string[]): Promise<boolean> {
    this.errorSignal.set(null);
    
    try {
      const response = await this.authenticatedFetch(`${API_URL}/rooms/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al reordenar salas');
      }

      // Update local state with new order
      this.roomsSignal.update(rooms => {
        return orderedIds.map((id, index) => {
          const room = rooms.find(r => r.id === id);
          return room ? { ...room, displayOrder: index + 1 } : null;
        }).filter(Boolean) as Room[];
      });
      
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message);
      // Fallback local
      if (error.message.includes('fetch')) {
        this.roomsSignal.update(rooms => {
          return orderedIds.map((id, index) => {
            const room = rooms.find(r => r.id === id);
            return room ? { ...room, displayOrder: index + 1 } : null;
          }).filter(Boolean) as Room[];
        });
        return true;
      }
      return false;
    }
  }

  async deleteRoom(id: string): Promise<boolean> {
    this.errorSignal.set(null);
    
    try {
      const response = await this.authenticatedFetch(`${API_URL}/rooms/${id}`, {
        method: 'DELETE'
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
      const response = await this.authenticatedFetch(`${API_URL}/records`, {
        method: 'POST',
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
      const response = await this.authenticatedFetch(`${API_URL}/records/${id}`, {
        method: 'DELETE'
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
        accentColor: '#9933ff',
        image: 'https://picsum.photos/id/1036/800/600',
        displayOrder: 1
      },
      { 
        id: 'room-2', 
        name: 'El Robo al Banco', 
        accentColor: '#02f700',
        image: 'https://picsum.photos/id/1076/800/600',
        displayOrder: 2
      },
      { 
        id: 'room-3', 
        name: 'Laboratorio Alien', 
        accentColor: '#00d4ff',
        image: 'https://picsum.photos/id/1026/800/600',
        displayOrder: 3
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
