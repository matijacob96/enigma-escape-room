import { Component, signal, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackofficeComponent } from './components/backoffice.component';
import { DisplayComponent } from './components/display.component';
import { LoginComponent } from './components/login.component';
import { EscapeRoomService } from './services/escape-room.service';

type ViewMode = 'login' | 'admin' | 'display';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BackofficeComponent, DisplayComponent, LoginComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  private service = inject(EscapeRoomService);
  
  viewMode = signal<ViewMode>('display'); // Default: display (invitado)
  isLoading = signal(true);
  showControls = signal(true);
  
  private hideControlsTimeout: any;
  private readonly HIDE_DELAY = 5000; // 5 segundos

  async ngOnInit() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Verificar si hay un callback de autenticación en la URL
    if (hash.includes('access_token')) {
      const success = await this.service.handleAuthCallback();
      if (success) {
        this.navigateTo('/admin');
        this.viewMode.set('admin');
      } else {
        this.viewMode.set('display');
      }
    } 
    // Rutas basadas en URL
    else if (path === '/login') {
      this.viewMode.set('login');
    } 
    else if (path === '/admin') {
      // Si intenta acceder a admin, verificar autenticación
      if (this.service.isAuthenticated()) {
        this.viewMode.set('admin');
      } else {
        // Redirigir a login si no está autenticado
        this.navigateTo('/login');
        this.viewMode.set('login');
      }
    } 
    else {
      // Home (/) = Display por defecto (modo invitado)
      this.viewMode.set('display');
    }
    
    this.isLoading.set(false);
    this.startHideControlsTimer();
  }

  ngOnDestroy() {
    this.clearHideControlsTimer();
  }

  // Navegación sin recargar la página
  private navigateTo(path: string) {
    window.history.pushState({}, '', path);
  }

  // Detectar movimiento del mouse o toque
  @HostListener('document:mousemove')
  @HostListener('document:touchstart')
  @HostListener('document:keydown')
  onUserActivity() {
    // Solo aplicar auto-hide en modo display
    if (this.viewMode() === 'display') {
      this.showControls.set(true);
      this.startHideControlsTimer();
    }
  }

  private startHideControlsTimer() {
    this.clearHideControlsTimer();
    
    // Solo ocultar en modo display (invitado)
    if (this.viewMode() === 'display') {
      this.hideControlsTimeout = setTimeout(() => {
        this.showControls.set(false);
      }, this.HIDE_DELAY);
    }
  }

  private clearHideControlsTimer() {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
      this.hideControlsTimeout = null;
    }
  }

  onLoginSuccess() {
    this.navigateTo('/admin');
    this.viewMode.set('admin');
    this.showControls.set(true);
    this.clearHideControlsTimer();
  }

  goToAdmin() {
    if (this.service.isAuthenticated()) {
      this.navigateTo('/admin');
      this.viewMode.set('admin');
      this.showControls.set(true);
      this.clearHideControlsTimer();
    } else {
      this.navigateTo('/login');
      this.viewMode.set('login');
    }
  }

  goToDisplay() {
    this.navigateTo('/');
    this.viewMode.set('display');
    this.showControls.set(true);
    this.startHideControlsTimer();
  }

  async logout() {
    await this.service.logout();
    this.navigateTo('/');
    this.viewMode.set('display');
    this.showControls.set(true);
    this.startHideControlsTimer();
  }

  get isAuthenticated() {
    return this.service.isAuthenticated;
  }

  get user() {
    return this.service.user;
  }
}
