import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EscapeRoomService } from '../services/escape-room.service';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full bg-black overflow-hidden flex flex-col font-sans select-none">
      
      <!-- Top Progress Bar -->
      <div class="progress-bar-container">
        <div class="progress-bar-fill" [style.width.%]="progress()"></div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 relative overflow-hidden">
        
        <!-- SLIDE 0: Logo / Welcome Screen (FIRST) -->
        @if (currentSlide() === 0) {
          <div class="absolute inset-0 fade-in flex items-center justify-center bg-black overflow-hidden">
            <!-- Matrix Rain Effect Background -->
            <div class="matrix-bg"></div>
            
            <div class="z-10 text-center logo-container">
              <div class="logo-box">
                <h1 class="logo-title">
                  ENIGMA
                </h1>
                <h2 class="logo-subtitle">
                  SALAS DE ESCAPE
                </h2>
              </div>
              <p class="logo-tagline">
                ¿PODRÁS ESCAPAR?
              </p>
            </div>
          </div>
        }

        <!-- Room Slides (start from slide 1) -->
        @for (room of rooms(); track room.id; let idx = $index) {
          @if (currentSlide() === idx + 1) {
            <div class="absolute inset-0 fade-in flex h-full">
              
              <!-- Left Sidebar: Room Info (Hidden on very small screens) -->
              <div class="room-sidebar" [style.border-right-color]="room.accentColor + '4D'">
                 <!-- Image Background - Full visibility -->
                 <div class="absolute inset-0 z-0">
                    <img [src]="room.image" class="w-full h-full object-cover" alt="">
                 </div>

                 <!-- Room Title with LOCAL overlay only at bottom -->
                 <div class="relative z-10 h-full flex flex-col justify-end">
                    <div class="room-title-container" [style.background]="'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)'">
                      <div class="room-label" [style.color]="room.accentColor" [style.border-left-color]="room.accentColor">
                        Sala actual
                      </div>
                      <h2 class="room-title" 
                          [style.text-shadow]="'0 0 20px ' + room.accentColor + '80'"
                          [style.font-size]="getRoomTitleSize(room.name)">
                        {{ room.name }}
                      </h2>
                    </div>
                 </div>
              </div>

              <!-- Right Main: Leaderboard -->
              <div class="leaderboard-main">
                <!-- Grid Background Effect with room color -->
                <div class="grid-bg" [style.background-image]="'linear-gradient(' + room.accentColor + ' 1px, transparent 1px), linear-gradient(90deg, ' + room.accentColor + ' 1px, transparent 1px)'"></div>

                <div class="relative z-10 h-full flex flex-col">
                  
                  <!-- Header -->
                  <div class="leaderboard-header">
                    <h3 class="header-title" [style.color]="room.accentColor">Top 10 Records</h3>
                    <div class="header-subtitle" [style.color]="room.accentColor">{{ room.name }}</div>
                  </div>

                  @let topRecords = getTopForRoom(room.id)();
                  
                  @if (topRecords.length > 0) {
                    
                    <!-- TOP 1 - MASSIVE DISPLAY -->
                    <div class="top1-container">
                       <div class="top1-badge" [style.color]="room.accentColor">
                         <svg xmlns="http://www.w3.org/2000/svg" class="badge-icon" viewBox="0 0 20 20" fill="currentColor">
                           <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827.954L17.18 7.519l2.58 4.73a1.002 1.002 0 01-.937 1.506h-3.228l-2.81 5.15a1 1 0 01-1.75 0l-2.81-5.15H4.938a1.002 1.002 0 01-.938-1.506l2.58-4.73L5.228 3.674a1 1 0 011.827-.954L8.754 5.905 12.708 4.323V3a1 1 0 011-1z" clip-rule="evenodd" />
                         </svg>
                         RÉCORD #1
                       </div>
                       
                       <!-- Team Name - FULL TEXT with adaptive font size -->
                       <div class="top1-team" 
                            [style.color]="room.accentColor" 
                            [style.text-shadow]="'0 0 20px ' + room.accentColor + '80'"
                            [style.font-size]="getTop1FontSize(topRecords[0].teamName)">
                         {{ topRecords[0].teamName }}
                       </div>
                       
                       <!-- Time -->
                       <div class="top1-time-container">
                         <div class="top1-time" [style.text-shadow]="'0 0 30px ' + room.accentColor + '50'">
                           {{ formatTime(topRecords[0].timeInSeconds) }}
                         </div>
                         <div class="top1-date" [style.border-color]="room.accentColor + '60'">
                           {{ formatDate(topRecords[0].date) }}
                         </div>
                       </div>
                    </div>

                    <!-- Positions 2-10 (3x3 grid) -->
                    <div class="records-grid">
                      @for (record of topRecords.slice(1); track record.id; let i = $index) {
                        <div class="record-item" 
                             [style.border-left-color]="getPositionColor(i, room.accentColor)">
                          <div class="record-left">
                             <div class="record-position" [style.color]="getPositionColor(i, room.accentColor)">
                               {{ (i + 2).toString().padStart(2, '0') }}
                             </div>
                             <div class="record-team" [style.font-size]="getRecordFontSize(record.teamName)">
                               {{ record.teamName }}
                             </div>
                          </div>
                          <div class="record-time" [style.color]="room.accentColor">
                            {{ formatTime(record.timeInSeconds) }}
                          </div>
                        </div>
                      }
                    </div>

                  } @else {
                    <div class="no-records">
                      <div class="no-records-icon" [style.color]="room.accentColor">???</div>
                      <div class="no-records-text" [style.color]="room.accentColor">Sin Récords</div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        }

      </div>
      
      <!-- Footer Ticker -->
      <div class="ticker-container">
        <div class="ticker-content">
          BIENVENIDOS A ENIGMA SALAS DE ESCAPE  ///  ¿TIENES LO QUE SE NECESITA PARA ESCAPAR?  ///  REGISTRA TU EQUIPO EN RECEPCIÓN  ///  ¡DESAFÍA TUS LÍMITES!  ///  TOP 10 EN PANTALLA  ///  
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* =====================================================
       RESPONSIVE TYPOGRAPHY USING CLAMP() AND VW UNITS
       Adapts to any screen size automatically
       ===================================================== */
    
    /* Progress Bar */
    .progress-bar-container {
      height: clamp(4px, 0.5vw, 8px);
      width: 100%;
      background: #111;
      border-bottom: 1px solid rgba(2, 247, 0, 0.2);
    }
    .progress-bar-fill {
      height: 100%;
      background: #02f700;
      box-shadow: 0 0 10px #02f700;
      transition: width 0.1s linear;
    }

    /* Room Sidebar - Hidden on mobile */
    .room-sidebar {
      display: none !important;
      width: 25%;
      position: relative;
      flex-direction: column;
      border-right: 1px solid rgba(2, 247, 0, 0.3);
      background: rgba(17, 24, 39, 0.5);
    }
    @media (min-width: 900px) {
      .room-sidebar {
        display: flex !important;
      }
    }
    
    .p-responsive {
      padding: clamp(16px, 2vw, 32px);
    }
    .pb-responsive {
      padding-bottom: clamp(40px, 5vw, 80px);
    }

    .room-title-container {
      padding: clamp(24px, 3vw, 48px);
      padding-top: clamp(48px, 6vw, 96px);
    }

    .room-label {
      color: #02f700;
      font-size: clamp(10px, 1vw, 14px);
      font-weight: bold;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin-bottom: clamp(8px, 1vw, 16px);
      padding-left: clamp(4px, 0.5vw, 8px);
      border-left: 2px solid #02f700;
    }

    .room-title {
      font-weight: 900;
      color: white;
      text-transform: uppercase;
      line-height: 1.1;
      font-family: 'Orbitron', sans-serif;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      /* NO word-break - font adapts to fit */
      white-space: normal;
      overflow-wrap: normal;
      word-break: normal;
    }

    /* Leaderboard Main */
    .leaderboard-main {
      width: 100%;
      background: black;
      padding: clamp(12px, 2vw, 48px);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    @media (min-width: 768px) {
      .leaderboard-main {
        width: 75%;
      }
    }

    .grid-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: linear-gradient(#02f700 1px, transparent 1px), 
                        linear-gradient(90deg, #02f700 1px, transparent 1px);
      background-size: clamp(30px, 4vw, 50px) clamp(30px, 4vw, 50px);
      opacity: 0.05;
    }

    /* Header */
    .leaderboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: clamp(12px, 2vw, 32px);
      border-bottom: 1px solid #333;
      padding-bottom: clamp(8px, 1vw, 16px);
    }

    .header-title {
      font-size: clamp(14px, 2vw, 28px);
      color: #888;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .header-subtitle {
      color: #02f700;
      font-family: monospace;
      font-size: clamp(10px, 1.2vw, 16px);
    }

    /* TOP 1 Section */
    .top1-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-bottom: clamp(12px, 2vw, 32px);
      min-height: 0;
    }

    .top1-badge {
      color: #eab308;
      font-weight: 900;
      font-size: clamp(12px, 1.5vw, 24px);
      margin-bottom: clamp(4px, 0.5vw, 8px);
      display: flex;
      align-items: center;
      gap: clamp(4px, 0.5vw, 8px);
    }

    .badge-icon {
      width: clamp(16px, 2vw, 32px);
      height: clamp(16px, 2vw, 32px);
    }

    .top1-team {
      color: #02f700;
      /* font-size is set dynamically via getTop1FontSize() */
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      font-family: 'Orbitron', sans-serif;
      line-height: 1.1;
      margin-bottom: clamp(8px, 1vw, 16px);
      text-shadow: 0 0 20px rgba(2, 247, 0, 0.5);
      /* Allow text to wrap naturally without breaking words */
      word-break: normal;
      overflow-wrap: break-word;
    }

    .top1-time-container {
      display: flex;
      align-items: baseline;
      gap: clamp(12px, 2vw, 24px);
      flex-wrap: wrap;
    }

    .top1-time {
      color: white;
      font-size: clamp(48px, 10vw, 160px);
      font-weight: 900;
      font-family: 'Orbitron', sans-serif;
      letter-spacing: 0.05em;
      line-height: 1;
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
    }

    .top1-date {
      color: #666;
      font-size: clamp(12px, 1.5vw, 24px);
      font-family: monospace;
      border: 1px solid #444;
      padding: clamp(4px, 0.5vw, 8px) clamp(8px, 1vw, 16px);
      border-radius: 4px;
    }

    /* Records Grid (2-10) - Fixed 3x3 layout */
    .records-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: clamp(4px, 0.6vw, 10px);
      max-height: 45%;
      overflow-y: auto;
    }
    
    @media (max-width: 900px) {
      .records-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 500px) {
      .records-grid {
        grid-template-columns: 1fr;
      }
    }

    .record-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(17, 24, 39, 0.8);
      border-left: clamp(2px, 0.3vw, 4px) solid #444;
      padding: clamp(6px, 0.8vw, 12px);
      transition: background 0.2s;
      /* FIXED HEIGHT for consistent card sizes */
      height: clamp(50px, 6vw, 80px);
      box-sizing: border-box;
    }

    .record-item:hover {
      background: rgba(31, 41, 55, 1);
    }

    .record-podium {
      border-left-color: #666;
    }

    .record-left {
      display: flex;
      align-items: center;
      gap: clamp(6px, 0.8vw, 12px);
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }

    .record-position {
      font-family: monospace;
      font-size: clamp(12px, 1.3vw, 20px);
      font-weight: bold;
      flex-shrink: 0;
      width: clamp(20px, 2.5vw, 36px);
    }

    .record-team {
      color: white;
      font-weight: bold;
      /* font-size is set dynamically via getRecordFontSize() */
      text-transform: uppercase;
      line-height: 1.15;
      /* Limit to 2 lines max */
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
      flex: 1;
      min-width: 0;
    }

    .record-time {
      color: #02f700;
      font-weight: bold;
      font-size: clamp(14px, 1.8vw, 28px);
      font-family: 'Orbitron', sans-serif;
      letter-spacing: 0.02em;
      flex-shrink: 0;
      margin-left: clamp(4px, 0.5vw, 8px);
    }

    /* No Records State */
    .no-records {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #444;
    }

    .no-records-icon {
      font-size: clamp(48px, 8vw, 120px);
      opacity: 0.2;
      margin-bottom: clamp(8px, 1vw, 16px);
    }

    .no-records-text {
      font-size: clamp(16px, 2vw, 32px);
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }

    /* Logo Slide */
    .matrix-bg {
      position: absolute;
      inset: 0;
      opacity: 0.2;
      background: repeating-linear-gradient(0deg, transparent, transparent 19px, #02f700 20px);
      background-size: 100% 20px;
    }

    .logo-container {
      transform: scale(clamp(0.5, 1vw * 0.1 + 0.5, 1.5));
    }

    .logo-box {
      border: clamp(2px, 0.4vw, 4px) solid #02f700;
      padding: clamp(24px, 4vw, 60px);
      background: black;
      box-shadow: 0 0 30px rgba(2, 247, 0, 0.5), inset 0 0 20px rgba(2, 247, 0, 0.2);
    }

    .logo-title {
      font-size: clamp(48px, 12vw, 180px);
      font-family: 'Orbitron', sans-serif;
      font-weight: 900;
      color: #02f700;
      line-height: 1;
      letter-spacing: -0.02em;
      text-shadow: 0 0 20px #02f700, 0 0 40px #02f700;
    }

    .logo-subtitle {
      font-size: clamp(16px, 3vw, 48px);
      font-family: 'Orbitron', sans-serif;
      font-weight: bold;
      color: white;
      line-height: 1;
      letter-spacing: 0.2em;
      margin-top: clamp(8px, 1vw, 16px);
      opacity: 0.8;
    }

    .logo-tagline {
      margin-top: clamp(16px, 3vw, 40px);
      color: #02f700;
      font-size: clamp(14px, 2vw, 32px);
      font-family: monospace;
      animation: pulse 2s ease-in-out infinite;
      letter-spacing: 0.5em;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Ticker */
    .ticker-container {
      background: #02f700;
      color: black;
      font-weight: bold;
      padding: clamp(6px, 0.8vw, 12px) clamp(8px, 1vw, 16px);
      overflow: hidden;
      white-space: nowrap;
      font-size: clamp(12px, 1.5vw, 20px);
    }

    .ticker-content {
      display: inline-block;
      animation: marquee 25s linear infinite;
    }

    @keyframes marquee {
      0% { transform: translateX(100vw); }
      100% { transform: translateX(-100%); }
    }

    /* Fade In Animation */
    .fade-in {
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class DisplayComponent implements OnInit, OnDestroy {
  service = inject(EscapeRoomService);
  
  readonly SLIDE_DURATION = 12000; 
  readonly REFRESH_TICK = 100;

  currentSlide = signal(0);
  progress = signal(0);
  
  private intervalId: any;
  private startTime = Date.now();

  get rooms() {
    return this.service.rooms;
  }

  get totalSlides() {
    return this.rooms().length + 1;
  }

  ngOnInit() {
    this.startCarousel();
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  startCarousel() {
    this.startTime = Date.now();
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.startTime;
      const pct = Math.min((elapsed / this.SLIDE_DURATION) * 100, 100);
      this.progress.set(pct);

      if (elapsed >= this.SLIDE_DURATION) {
        this.nextSlide();
        this.startTime = Date.now();
        this.progress.set(0);
      }
    }, this.REFRESH_TICK);
  }

  nextSlide() {
    this.currentSlide.update(curr => (curr + 1) % this.totalSlides);
  }

  getTopForRoom(roomId: string) {
    return this.service.getTopRecordsForRoom(roomId, 10);
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  
  formatDate(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString();
  }

  // Adaptive font size for TOP 1 team name - shows FULL text
  getTop1FontSize(teamName: string): string {
    if (!teamName) return 'clamp(32px, 6vw, 100px)';
    const len = teamName.length;
    
    // Más caracteres = font más pequeño, pero siempre visible
    if (len <= 10) return 'clamp(40px, 8vw, 120px)';
    if (len <= 15) return 'clamp(36px, 7vw, 100px)';
    if (len <= 20) return 'clamp(32px, 6vw, 80px)';
    if (len <= 30) return 'clamp(28px, 5vw, 60px)';
    if (len <= 40) return 'clamp(24px, 4vw, 50px)';
    if (len <= 50) return 'clamp(20px, 3.5vw, 40px)';
    if (len <= 60) return 'clamp(18px, 3vw, 36px)';
    return 'clamp(16px, 2.5vw, 32px)'; // 60-80 chars
  }

  // Adaptive font size for records 2-10 - fits in 2 lines max (up to 80 chars)
  getRecordFontSize(teamName: string): string {
    if (!teamName) return 'clamp(10px, 1.1vw, 16px)';
    const len = teamName.length;
    
    // Calculate font size to fit in 2 lines within the card
    if (len <= 10) return 'clamp(11px, 1.2vw, 18px)';   // 1 line easily
    if (len <= 18) return 'clamp(10px, 1.1vw, 16px)';   // 1 line
    if (len <= 28) return 'clamp(9px, 1vw, 14px)';      // 1-2 lines
    if (len <= 40) return 'clamp(8px, 0.9vw, 12px)';    // 2 lines
    if (len <= 55) return 'clamp(7px, 0.8vw, 11px)';    // 2 lines tight
    if (len <= 70) return 'clamp(6.5px, 0.7vw, 10px)';  // 2 lines very tight
    return 'clamp(6px, 0.65vw, 9px)';                    // 70-80 chars - smallest
  }

  // Get position color: 02 = silver, 03 = bronze, rest = accent or gray
  getPositionColor(index: number, accentColor: string): string {
    // index 0 = position 02, index 1 = position 03
    if (index === 0) return '#C0C0C0'; // Silver
    if (index === 1) return '#CD7F32'; // Bronze
    return '#666'; // Gray for positions 04-10
  }

  // Adaptive font size for room title - no word breaking
  getRoomTitleSize(roomName: string): string {
    if (!roomName) return 'clamp(24px, 3vw, 60px)';
    
    // Find the longest word
    const longestWord = roomName.split(/\s+/).reduce((a, b) => a.length > b.length ? a : b, '');
    const len = longestWord.length;
    
    // Adapt based on longest word to prevent overflow
    if (len <= 6) return 'clamp(28px, 4vw, 70px)';
    if (len <= 10) return 'clamp(24px, 3vw, 55px)';
    if (len <= 14) return 'clamp(20px, 2.5vw, 45px)';
    if (len <= 18) return 'clamp(18px, 2vw, 38px)';
    return 'clamp(16px, 1.8vw, 32px)'; // very long words
  }
}
