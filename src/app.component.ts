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
  
  viewMode = signal<ViewMode>('login');
  isLoading = signal(true);
  showControls = signal(true);
  
  private hideControlsTimeout: any;
  private readonly HIDE_DELAY = 5000; // 5 segundos

  async ngOnInit() {
    // Verificar si hay un callback de autenticación en la URL
    const hasCallback = window.location.hash.includes('access_token');
    
    if (hasCallback) {
      const success = await this.service.handleAuthCallback();
      if (success) {
        this.viewMode.set('admin');
      }
    } else if (this.service.isAuthenticated()) {
      // Si ya está autenticado, ir directo al admin
      this.viewMode.set('admin');
    }
    
    this.isLoading.set(false);
    this.startHideControlsTimer();
  }

  ngOnDestroy() {
    this.clearHideControlsTimer();
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
    this.viewMode.set('admin');
    this.showControls.set(true);
    this.clearHideControlsTimer();
  }

  onGuestMode() {
    // Modo invitado solo permite ver el display
    this.viewMode.set('display');
    this.showControls.set(true);
    this.startHideControlsTimer();
  }

  toggleMode() {
    this.viewMode.update(mode => {
      if (mode === 'admin') {
        this.startHideControlsTimer();
        return 'display';
      }
      if (mode === 'display') {
        this.clearHideControlsTimer();
        this.showControls.set(true);
        // Si está autenticado puede volver a admin, si no va a login
        return this.service.isAuthenticated() ? 'admin' : 'login';
      }
      return 'admin';
    });
  }

  async logout() {
    await this.service.logout();
    this.viewMode.set('login');
    this.showControls.set(true);
    this.clearHideControlsTimer();
  }

  get isAuthenticated() {
    return this.service.isAuthenticated;
  }

  get user() {
    return this.service.user;
  }
}
