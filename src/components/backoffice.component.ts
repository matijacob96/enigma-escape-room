import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { EscapeRoomService, Room } from '../services/escape-room.service';

type Tab = 'records' | 'rooms';

@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-black text-gray-300 font-mono p-4 md:p-8 overflow-y-auto">
      
      <!-- Header -->
      <header class="mb-6 flex flex-col md:flex-row justify-between items-center border-b border-[#02f700]/30 pb-4">
        <div>
          <h2 class="text-3xl md:text-4xl brand-font text-[#02f700] mb-2 neon-text">ENIGMA ADMIN</h2>
          <p class="text-[#02f700]/70 text-sm tracking-widest uppercase">Sistema de Control - Salas de Escape</p>
        </div>
        <div class="mt-4 md:mt-0 flex gap-4">
          <button 
            (click)="currentTab.set('records')"
            class="px-6 py-2 border font-bold uppercase transition-all"
            [class.bg-[#02f700]]="currentTab() === 'records'"
            [class.text-black]="currentTab() === 'records'"
            [class.border-[#02f700]]="currentTab() === 'records'"
            [class.text-[#02f700]]="currentTab() !== 'records'"
            [class.border-gray-800]="currentTab() !== 'records'"
          >
            Tiempos
          </button>
          <button 
            (click)="currentTab.set('rooms')"
            class="px-6 py-2 border font-bold uppercase transition-all"
            [class.bg-[#02f700]]="currentTab() === 'rooms'"
            [class.text-black]="currentTab() === 'rooms'"
            [class.border-[#02f700]]="currentTab() === 'rooms'"
            [class.text-[#02f700]]="currentTab() !== 'rooms'"
            [class.border-gray-800]="currentTab() !== 'rooms'"
          >
            Salas (ABM)
          </button>
        </div>
      </header>

      <!-- Error Banner -->
      @if (service.error()) {
        <div class="mb-4 bg-red-900/30 border border-red-500 text-red-400 p-3 text-sm flex justify-between items-center">
          <span>⚠️ {{ service.error() }}</span>
          <button (click)="clearError()" class="text-red-500 hover:text-white">✕</button>
        </div>
      }

      <div class="max-w-7xl mx-auto">
        
        <!-- ======================= -->
        <!-- TAB: RECORDS MANAGEMENT -->
        <!-- ======================= -->
        @if (currentTab() === 'records') {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 fade-in">
            
            <!-- Left: Add Record Form -->
            <div class="border border-[#02f700]/50 bg-black/50 p-6 relative neon-box">
              <div class="absolute top-0 left-0 w-2 h-2 bg-[#02f700]"></div>
              <div class="absolute top-0 right-0 w-2 h-2 bg-[#02f700]"></div>
              <div class="absolute bottom-0 left-0 w-2 h-2 bg-[#02f700]"></div>
              <div class="absolute bottom-0 right-0 w-2 h-2 bg-[#02f700]"></div>

              <h3 class="text-xl font-bold mb-6 text-white flex items-center gap-3 border-b border-gray-800 pb-2">
                <span class="text-[#02f700]">></span> CARGAR TIEMPO
              </h3>

              @if (rooms().length === 0) {
                 <div class="text-red-500 text-center py-10 border border-red-900 bg-red-900/10">
                    ¡NO HAY SALAS CREADAS!<br/>
                    Ve a la pestaña "Salas" para crear una.
                 </div>
              } @else {
                <form [formGroup]="recordForm" (ngSubmit)="onSubmitRecord()" class="space-y-6">
                  <!-- Team Name (max 80 chars) -->
                  <div class="group">
                    <label class="block text-xs font-bold text-[#02f700] mb-2 uppercase tracking-wider">
                      Nombre del Equipo 
                      <span class="text-gray-500 font-normal">({{ recordForm.get('teamName')?.value?.length || 0 }}/80)</span>
                    </label>
                    <input 
                      type="text" 
                      formControlName="teamName"
                      maxlength="80"
                      class="w-full bg-gray-900/50 border border-gray-700 text-white p-4 focus:border-[#02f700] focus:ring-1 focus:ring-[#02f700] focus:outline-none transition-all placeholder-gray-600 text-lg uppercase"
                      placeholder="EJ: LOS VENGADORES"
                    />
                  </div>

                  <!-- Room Selection -->
                  <div>
                    <label class="block text-xs font-bold text-[#02f700] mb-2 uppercase tracking-wider">Sala de Escape</label>
                    <div class="relative">
                      <select 
                        formControlName="roomId"
                        class="w-full bg-gray-900/50 border border-gray-700 text-white p-4 appearance-none focus:border-[#02f700] focus:outline-none text-lg"
                      >
                        @for (room of rooms(); track room.id) {
                          <option [value]="room.id">{{ room.name }}</option>
                        }
                      </select>
                      <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#02f700]">▼</div>
                    </div>
                  </div>

                  <!-- Time Input -->
                  <div class="grid grid-cols-2 gap-6">
                    <div>
                      <label class="block text-xs font-bold text-[#02f700] mb-2 uppercase tracking-wider">Minutos</label>
                      <input 
                        type="number" 
                        min="0" max="180"
                        formControlName="minutes"
                        class="w-full bg-gray-900/50 border border-gray-700 text-white p-4 text-center text-2xl brand-font focus:border-[#02f700] focus:outline-none"
                        placeholder="00"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-[#02f700] mb-2 uppercase tracking-wider">Segundos</label>
                      <input 
                        type="number" 
                        min="0" max="59"
                        formControlName="seconds"
                        class="w-full bg-gray-900/50 border border-gray-700 text-white p-4 text-center text-2xl brand-font focus:border-[#02f700] focus:outline-none"
                        placeholder="00"
                      />
                    </div>
                  </div>

                  <!-- Action Button -->
                  <button 
                    type="submit" 
                    [disabled]="recordForm.invalid || isSubmitting()"
                    class="w-full bg-[#02f700] hover:bg-[#02d000] disabled:bg-gray-800 disabled:text-gray-500 text-black font-black py-4 uppercase tracking-widest text-lg transition-all mt-6 relative overflow-hidden"
                  >
                    @if (isSubmitting()) {
                      <span class="flex items-center justify-center gap-2">
                        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </span>
                    } @else {
                      Guardar Récord
                    }
                  </button>
                  
                  @if (successMessage()) {
                    <div class="bg-[#02f700]/10 border border-[#02f700] text-[#02f700] p-3 text-center text-sm font-bold uppercase tracking-wide fade-in">
                      Datos guardados correctamente
                    </div>
                  }
                </form>
              }
            </div>

            <!-- Right: Leaderboard Overview per Room -->
            <div class="border border-gray-800 bg-gray-900/30 p-6 h-fit">
              <h3 class="text-xl font-bold mb-6 text-white flex items-center gap-3 border-b border-gray-800 pb-2">
                <span class="text-gray-500">></span> ESTADO ACTUAL POR SALA
              </h3>

              <div class="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                @for (room of rooms(); track room.id) {
                  <div class="bg-black border border-gray-800 p-4 rounded-lg">
                    <div class="flex justify-between items-center mb-3">
                      <h4 class="text-[#02f700] font-bold uppercase tracking-wider">{{ room.name }}</h4>
                      <span class="text-xs text-gray-500">TOP 10</span>
                    </div>

                    @let topRecords = getTopForRoom(room.id)();
                    
                    @if (topRecords.length > 0) {
                      <div class="space-y-2">
                        @for (record of topRecords; track record.id; let i = $index) {
                          <div class="flex justify-between items-center text-sm p-2 bg-gray-900/50 rounded group hover:bg-gray-800 transition-colors">
                             <div class="flex items-center gap-3">
                               <span class="font-mono font-bold w-4" 
                                     [class.text-yellow-400]="i===0" 
                                     [class.text-gray-500]="i>0">{{ i + 1 }}</span>
                               <span class="text-white uppercase truncate max-w-[150px]">{{ record.teamName }}</span>
                             </div>
                             <div class="flex items-center gap-3">
                               <span class="brand-font text-[#02f700]">{{ formatTime(record.timeInSeconds) }}</span>
                               <button 
                                (click)="deleteRecord(record.id)"
                                [disabled]="deletingId() === record.id"
                                class="text-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                title="Eliminar"
                               >
                                @if (deletingId() === record.id) {
                                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                } @else {
                                  ✕
                                }
                               </button>
                             </div>
                          </div>
                        }
                      </div>
                    } @else {
                       <div class="text-gray-600 text-xs text-center py-2 italic">Sin registros aún</div>
                    }
                  </div>
                }
                @if (rooms().length === 0) {
                   <div class="text-center text-gray-600 italic">No hay salas configuradas.</div>
                }
              </div>
            </div>
          </div>
        }

        <!-- ======================= -->
        <!-- TAB: ROOMS MANAGEMENT   -->
        <!-- ======================= -->
        @if (currentTab() === 'rooms') {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 fade-in">
             <!-- Create Room Form -->
             <div class="border border-purple-500/50 bg-black/50 p-6 neon-box shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <h3 class="text-xl font-bold mb-6 text-white flex items-center gap-3 border-b border-gray-800 pb-2">
                  <span class="text-purple-500">></span> CREAR NUEVA SALA
                </h3>

                <form [formGroup]="roomForm" (ngSubmit)="onSubmitRoom()" class="space-y-6">
                   <div>
                    <label class="block text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider">Nombre de la Sala</label>
                    <input 
                      type="text" 
                      formControlName="name"
                      class="w-full bg-gray-900/50 border border-gray-700 text-white p-4 focus:border-purple-500 focus:outline-none transition-all placeholder-gray-600 text-lg"
                      placeholder="Ej. El Secreto del Faraón"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider">URL de Imagen</label>
                    <input 
                      type="text" 
                      formControlName="image"
                      class="w-full bg-gray-900/50 border border-gray-700 text-white p-4 focus:border-purple-500 focus:outline-none transition-all placeholder-gray-600 text-sm font-mono"
                      placeholder="https://picsum.photos/..."
                    />
                    <p class="text-gray-500 text-xs mt-1">Usa https://picsum.photos/800/600 para pruebas</p>
                  </div>

                  <!-- Color Picker -->
                  <div>
                    <label class="block text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider">Color de Acento</label>
                    <div class="flex items-center gap-4">
                      <input 
                        type="color" 
                        formControlName="accentColor"
                        class="w-16 h-16 cursor-pointer border-2 border-gray-700 rounded-lg bg-transparent"
                      />
                      <div class="flex-1">
                        <input 
                          type="text" 
                          formControlName="accentColor"
                          class="w-full bg-gray-900/50 border border-gray-700 text-white p-3 focus:border-purple-500 focus:outline-none font-mono text-sm uppercase"
                          placeholder="#02f700"
                        />
                        <p class="text-gray-500 text-xs mt-1">Este color se usará para títulos y números en el display</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    [disabled]="roomForm.invalid || isSubmitting()"
                    class="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-4 uppercase tracking-widest text-lg transition-all"
                  >
                    @if (isSubmitting()) {
                      <span class="flex items-center justify-center gap-2">
                        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Creando...
                      </span>
                    } @else {
                      Crear Sala
                    }
                  </button>
                </form>
             </div>

             <!-- List Existing Rooms with Drag & Drop -->
             <div class="border border-gray-800 bg-gray-900/30 p-6">
                <h3 class="text-xl font-bold mb-4 text-white flex items-center gap-3 border-b border-gray-800 pb-2">
                  <span class="text-gray-500">></span> SALAS ACTIVAS ({{ rooms().length }})
                </h3>
                <p class="text-xs text-gray-500 mb-4 flex items-center gap-2">
                  <span class="text-purple-400">↕</span> Arrastrá para cambiar el orden de las slides en TV
                </p>

                <div class="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                  @for (room of rooms(); track room.id; let idx = $index) {
                    <div 
                      class="bg-black border border-gray-700 p-3 group hover:border-gray-600 transition-all cursor-grab active:cursor-grabbing"
                      [class.border-purple-500]="dragOverIndex() === idx"
                      [class.opacity-50]="draggingIndex() === idx"
                      draggable="true"
                      (dragstart)="onDragStart($event, idx)"
                      (dragover)="onDragOver($event, idx)"
                      (dragleave)="onDragLeave()"
                      (drop)="onDrop($event, idx)"
                      (dragend)="onDragEnd()"
                    >
                       <div class="flex gap-4 items-center">
                         <!-- Drag Handle -->
                         <div class="text-gray-600 hover:text-purple-400 transition-colors flex flex-col items-center">
                           <span class="text-xs font-mono text-gray-500">{{ idx + 1 }}</span>
                           <span class="text-lg leading-none">⋮⋮</span>
                         </div>
                         <img [src]="room.image" class="w-14 h-14 object-cover border border-gray-800 bg-gray-800" alt="Room preview" (error)="onImageError($event)">
                         <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                              <div class="w-4 h-4 rounded-full border border-gray-600" [style.background]="room.accentColor"></div>
                              <div class="text-white font-bold text-lg truncate">{{ room.name }}</div>
                            </div>
                            <div class="text-xs text-gray-500 font-mono">Slide #{{ idx + 1 }}</div>
                         </div>
                         <div class="flex gap-2">
                           <button 
                             (click)="startEditRoom(room)"
                             class="px-3 py-2 text-purple-400 border border-purple-900 hover:bg-purple-900/20 text-xs uppercase font-bold transition-all"
                           >
                             Editar
                           </button>
                           <button 
                             (click)="deleteRoom(room.id)"
                             [disabled]="deletingId() === room.id"
                             class="px-3 py-2 text-red-500 border border-red-900 hover:bg-red-900/20 text-xs uppercase font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                           >
                             @if (deletingId() === room.id) {
                               <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                 <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                                 <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                               </svg>
                             }
                             Borrar
                           </button>
                         </div>
                       </div>
                       
                       <!-- Edit Form (inline) -->
                       @if (editingRoomId() === room.id) {
                         <div class="mt-4 pt-4 border-t border-gray-800 fade-in">
                           <form [formGroup]="editRoomForm" (ngSubmit)="onUpdateRoom()" class="space-y-4">
                             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                 <label class="block text-xs font-bold text-purple-400 mb-1 uppercase">Nombre</label>
                                 <input 
                                   type="text" 
                                   formControlName="name"
                                   class="w-full bg-gray-900/50 border border-gray-700 text-white p-3 focus:border-purple-500 focus:outline-none"
                                 />
                               </div>
                               <div>
                                 <label class="block text-xs font-bold text-purple-400 mb-1 uppercase">URL Imagen</label>
                                 <input 
                                   type="text" 
                                   formControlName="image"
                                   class="w-full bg-gray-900/50 border border-gray-700 text-white p-3 focus:border-purple-500 focus:outline-none font-mono text-xs"
                                 />
                               </div>
                             </div>
                             <div>
                               <label class="block text-xs font-bold text-purple-400 mb-1 uppercase">Color de Acento</label>
                               <div class="flex items-center gap-3">
                                 <input 
                                   type="color" 
                                   formControlName="accentColor"
                                   class="w-12 h-12 cursor-pointer border-2 border-gray-700 rounded bg-transparent"
                                 />
                                 <input 
                                   type="text" 
                                   formControlName="accentColor"
                                   class="flex-1 bg-gray-900/50 border border-gray-700 text-white p-3 focus:border-purple-500 focus:outline-none font-mono text-sm uppercase"
                                 />
                               </div>
                             </div>
                             <div class="flex gap-2 justify-end">
                               <button 
                                 type="button"
                                 (click)="cancelEditRoom()"
                                 class="px-4 py-2 text-gray-400 border border-gray-700 hover:bg-gray-800 text-xs uppercase font-bold"
                               >
                                 Cancelar
                               </button>
                               <button 
                                 type="submit"
                                 [disabled]="editRoomForm.invalid || isSubmitting()"
                                 class="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 text-white text-xs uppercase font-bold"
                               >
                                 Guardar Cambios
                               </button>
                             </div>
                           </form>
                         </div>
                       }
                    </div>
                  } @empty {
                    <div class="text-center py-10 text-gray-500">
                       No hay salas. Crea una a la izquierda.
                    </div>
                  }
                </div>
             </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #000; 
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #02f700; 
      border-radius: 3px;
    }
    .neon-box {
      box-shadow: 0 0 15px rgba(2, 247, 0, 0.3), inset 0 0 10px rgba(2, 247, 0, 0.1);
    }
    .brand-font {
      font-family: 'Orbitron', sans-serif;
    }
    .neon-text {
      text-shadow: 0 0 5px #02f700, 0 0 10px #02f700;
    }
  `]
})
export class BackofficeComponent {
  private fb: FormBuilder = inject(FormBuilder);
  service = inject(EscapeRoomService);
  
  currentTab = signal<Tab>('records');
  successMessage = signal(false);
  isSubmitting = signal(false);
  deletingId = signal<string | null>(null);
  editingRoomId = signal<string | null>(null);
  
  // Drag and drop state
  draggingIndex = signal<number | null>(null);
  dragOverIndex = signal<number | null>(null);
  
  // Record Form
  recordForm: FormGroup = this.fb.group({
    teamName: ['', [Validators.required, Validators.maxLength(80)]],
    roomId: ['', Validators.required],
    minutes: [45, [Validators.required, Validators.min(0)]],
    seconds: [0, [Validators.required, Validators.min(0), Validators.max(59)]]
  });

  // Room Form (create)
  roomForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    image: ['https://picsum.photos/seed/escape/800/600', Validators.required],
    accentColor: ['#02f700', Validators.required]
  });

  // Room Form (edit)
  editRoomForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    image: ['', Validators.required],
    accentColor: ['#02f700', Validators.required]
  });

  startEditRoom(room: Room) {
    this.editingRoomId.set(room.id);
    this.editRoomForm.patchValue({
      name: room.name,
      image: room.image,
      accentColor: room.accentColor || '#02f700'
    });
  }

  cancelEditRoom() {
    this.editingRoomId.set(null);
    this.editRoomForm.reset();
  }

  async onUpdateRoom() {
    if (this.editRoomForm.valid && this.editingRoomId()) {
      this.isSubmitting.set(true);
      
      try {
        const { name, image, accentColor } = this.editRoomForm.value;
        const success = await this.service.updateRoom(this.editingRoomId()!, name, image, accentColor);
        
        if (success) {
          this.editingRoomId.set(null);
          this.editRoomForm.reset();
        }
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  get rooms() {
    return this.service.rooms;
  }

  // Helper to ensure first room is selected if available when form resets
  private updateDefaultRoom() {
    const rooms = this.rooms();
    if (rooms.length > 0 && !this.recordForm.get('roomId')?.value) {
      this.recordForm.patchValue({ roomId: rooms[0].id });
    }
  }

  getTopForRoom(roomId: string) {
    return this.service.getTopRecordsForRoom(roomId, 10);
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  clearError() {
    // Método para limpiar errores del servicio
    (this.service as any).errorSignal?.set(null);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://picsum.photos/seed/fallback/800/600';
  }

  // Actions
  async deleteRecord(id: string) {
    if (!confirm('¿Eliminar este tiempo?')) return;
    
    this.deletingId.set(id);
    try {
      await this.service.deleteRecord(id);
    } finally {
      this.deletingId.set(null);
    }
  }

  async deleteRoom(id: string) {
    if (!confirm('¿Eliminar esta sala? Los registros asociados también serán eliminados.')) return;
    
    this.deletingId.set(id);
    try {
      await this.service.deleteRoom(id);
    } finally {
      this.deletingId.set(null);
    }
  }

  async onSubmitRecord() {
    if (this.recordForm.valid) {
      this.isSubmitting.set(true);
      
      try {
        const { teamName, roomId, minutes, seconds } = this.recordForm.value;
        const success = await this.service.addRecord(teamName, roomId, minutes, seconds);
        
        if (success) {
          this.recordForm.reset({
            teamName: '',
            roomId: roomId, // Keep selected room
            minutes: 45,
            seconds: 0
          });
          
          this.successMessage.set(true);
          setTimeout(() => this.successMessage.set(false), 3000);
        }
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  async onSubmitRoom() {
    if (this.roomForm.valid) {
      this.isSubmitting.set(true);
      
      try {
        const { name, image, accentColor } = this.roomForm.value;
        const success = await this.service.addRoom(name, image, accentColor);
        
        if (success) {
          this.roomForm.reset({
            name: '',
            image: 'https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/800/600',
            accentColor: '#02f700'
          });
          this.updateDefaultRoom();
        }
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  // ==================== DRAG AND DROP ====================
  
  onDragStart(event: DragEvent, index: number) {
    this.draggingIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.draggingIndex() !== index) {
      this.dragOverIndex.set(index);
    }
  }

  onDragLeave() {
    this.dragOverIndex.set(null);
  }

  onDragEnd() {
    this.draggingIndex.set(null);
    this.dragOverIndex.set(null);
  }

  async onDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    const dragIndex = this.draggingIndex();
    
    if (dragIndex === null || dragIndex === dropIndex) {
      this.onDragEnd();
      return;
    }

    // Reorder the rooms array
    const currentRooms = [...this.rooms()];
    const [draggedRoom] = currentRooms.splice(dragIndex, 1);
    currentRooms.splice(dropIndex, 0, draggedRoom);

    // Get new ordered IDs
    const orderedIds = currentRooms.map(r => r.id);

    // Save to backend
    await this.service.reorderRooms(orderedIds);
    
    this.onDragEnd();
  }
}
