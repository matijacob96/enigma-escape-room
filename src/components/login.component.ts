import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { EscapeRoomService } from '../services/escape-room.service';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      
      <!-- Animated Background Grid -->
      <div class="absolute inset-0 pointer-events-none opacity-10"
           style="background-image: linear-gradient(#02f700 1px, transparent 1px), linear-gradient(90deg, #02f700 1px, transparent 1px); background-size: 40px 40px;">
      </div>
      
      <!-- Glow Effect -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#02f700]/5 rounded-full blur-3xl"></div>

      <div class="relative z-10 w-full max-w-md">
        
        <!-- Logo -->
        <div class="text-center mb-10">
          <div class="inline-block border-4 border-[#02f700] p-6 neon-box bg-black/80 mb-6">
            <h1 class="text-5xl brand-font font-black text-[#02f700] leading-none tracking-tighter neon-text">
              ENIGMA
            </h1>
            <h2 class="text-lg brand-font font-bold text-white leading-none tracking-widest mt-2 opacity-80">
              SALAS DE ESCAPE
            </h2>
          </div>
          <p class="text-gray-500 text-sm tracking-wider uppercase">Sistema de Administración</p>
        </div>

        <!-- Login/Signup Card -->
        <div class="border border-[#02f700]/50 bg-black/80 p-8 relative neon-box">
          <!-- Corner Decorations -->
          <div class="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-[#02f700]"></div>
          <div class="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-[#02f700]"></div>
          <div class="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-[#02f700]"></div>
          <div class="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-[#02f700]"></div>

          <!-- Tab Switcher -->
          <div class="flex mb-8 border-b border-gray-800">
            <button 
              (click)="mode.set('login')"
              class="flex-1 py-3 text-center font-bold uppercase tracking-wider text-sm transition-all border-b-2"
              [class.border-[#02f700]]="mode() === 'login'"
              [class.text-[#02f700]]="mode() === 'login'"
              [class.border-transparent]="mode() !== 'login'"
              [class.text-gray-500]="mode() !== 'login'"
            >
              Iniciar Sesión
            </button>
            <button 
              (click)="mode.set('signup')"
              class="flex-1 py-3 text-center font-bold uppercase tracking-wider text-sm transition-all border-b-2"
              [class.border-[#02f700]]="mode() === 'signup'"
              [class.text-[#02f700]]="mode() === 'signup'"
              [class.border-transparent]="mode() !== 'signup'"
              [class.text-gray-500]="mode() !== 'signup'"
            >
              Registrarse
            </button>
          </div>

          <!-- Form -->
          <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <div>
              <label class="block text-xs font-bold text-[#02f700] mb-2 uppercase tracking-wider">
                Email
              </label>
              <input 
                type="email" 
                formControlName="email"
                class="w-full bg-gray-900/50 border border-gray-700 text-white p-4 focus:border-[#02f700] focus:ring-1 focus:ring-[#02f700] focus:outline-none transition-all placeholder-gray-600"
                placeholder="admin@enigma.com"
                autocomplete="email"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#02f700] mb-2 uppercase tracking-wider">
                Contraseña
              </label>
              <input 
                type="password" 
                formControlName="password"
                class="w-full bg-gray-900/50 border border-gray-700 text-white p-4 focus:border-[#02f700] focus:ring-1 focus:ring-[#02f700] focus:outline-none transition-all placeholder-gray-600"
                placeholder="••••••••"
                autocomplete="current-password"
              />
            </div>

            @if (mode() === 'signup') {
              <div>
                <label class="block text-xs font-bold text-[#02f700] mb-2 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                <input 
                  type="password" 
                  formControlName="confirmPassword"
                  class="w-full bg-gray-900/50 border border-gray-700 text-white p-4 focus:border-[#02f700] focus:ring-1 focus:ring-[#02f700] focus:outline-none transition-all placeholder-gray-600"
                  placeholder="••••••••"
                  autocomplete="new-password"
                />
              </div>
            }

            <!-- Error Message -->
            @if (service.error()) {
              <div class="bg-red-900/30 border border-red-500 text-red-400 p-3 text-sm text-center">
                {{ service.error() }}
              </div>
            }

            <!-- Success Message -->
            @if (successMessage()) {
              <div class="bg-[#02f700]/10 border border-[#02f700] text-[#02f700] p-3 text-sm text-center">
                {{ successMessage() }}
              </div>
            }

            <!-- Submit Button -->
            <button 
              type="submit" 
              [disabled]="authForm.invalid || service.loading()"
              class="w-full bg-[#02f700] hover:bg-[#02d000] disabled:bg-gray-800 disabled:text-gray-500 text-black font-black py-4 uppercase tracking-widest text-lg transition-all relative overflow-hidden group"
            >
              @if (service.loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              } @else {
                {{ mode() === 'login' ? 'Acceder' : 'Crear Cuenta' }}
              }
            </button>
          </form>

          <!-- Skip Login (for demo/TV mode) -->
          <div class="mt-6 text-center">
            <button 
              (click)="skipLogin()"
              class="text-gray-500 hover:text-[#02f700] text-sm transition-colors"
            >
              Continuar como invitado (Solo lectura)
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-6 text-gray-600 text-xs">
          <p>ENIGMA Salas de Escape © {{ currentYear }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .neon-text {
      text-shadow: 0 0 5px #02f700, 0 0 10px #02f700;
    }
    .neon-box {
      box-shadow: 0 0 20px rgba(2, 247, 0, 0.2), inset 0 0 15px rgba(2, 247, 0, 0.05);
    }
    .brand-font {
      font-family: 'Orbitron', sans-serif;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  service = inject(EscapeRoomService);
  
  mode = signal<AuthMode>('login');
  successMessage = signal<string | null>(null);
  
  // Output para notificar al padre que puede continuar
  loginSuccess = output<void>();
  guestMode = output<void>();

  currentYear = new Date().getFullYear();

  authForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['']
  });

  async onSubmit() {
    if (this.authForm.invalid) return;

    const { email, password, confirmPassword } = this.authForm.value;

    if (this.mode() === 'signup') {
      if (password !== confirmPassword) {
        this.service['errorSignal'].set('Las contraseñas no coinciden');
        return;
      }

      const success = await this.service.signup(email, password);
      if (success) {
        this.successMessage.set('¡Cuenta creada! Revisa tu email para verificar.');
        this.mode.set('login');
        this.authForm.patchValue({ password: '', confirmPassword: '' });
      }
    } else {
      const success = await this.service.login(email, password);
      if (success) {
        this.loginSuccess.emit();
      }
    }
  }

  skipLogin() {
    this.guestMode.emit();
  }
}
