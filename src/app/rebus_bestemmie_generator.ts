import { ChangeDetectionStrategy, Component, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type SvgConcept = 
  | 'pig' | 'divine' | 'dog' | 'executioner' | 'madonna' 
  | 'wolf' | 'ogre' | 'snake' | 'toad' | 'dragon' 
  | 'goat' | 'cow' | 'donkey' | 'crow' | 'pirate' 
  | 'shark' | 'vampire' | 'devil' | 'thief' | 'cross' 
  | 'host' | 'crown' | 'pope' | 'saint' | 'worm' | 'monkey'
  | 'skunk' | 'skull' | 'fire' | 'bat' | 'sewer' | 'rat';

export interface ConceptItem {
  word: string;
  gender: 'm' | 'f';
  type: SvgConcept;
  operatorBadge?: string;
  weight?: number; // Higher value = higher chance to appear
}

export interface RebusCard {
  type: SvgConcept;
  operatorBadge?: string;
  displayLabel?: string;
}

export interface RebusPuzzle {
  id: number;
  cards: [RebusCard, RebusCard];
  word1: string;
  word2: string;
  answer: string;
  wordLengths: number[];
  firstLetter: string;
  lastLetter: string;
  maskedOutline: string;
  difficulty: 'Facile' | 'Medio' | 'Difficile';
}

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none pb-12">
      
      <!-- Top Header Bar -->
      <header class="w-full bg-zinc-900/90 border-b border-zinc-800/80 sticky top-0 z-50 px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur-md shadow-md">
        <div class="max-w-md mx-auto flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <div class="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 rounded-xl flex items-center justify-center font-black text-white text-lg sm:text-xl shadow-md shadow-red-500/20 shrink-0">
              🧩
            </div>
            <div class="min-w-0">
              <h1 class="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                REBUS BESTEMMIE
              </h1>
              <p class="text-[9px] sm:text-[10px] text-zinc-400 font-medium uppercase tracking-widest truncate">
                Deità, Santi e Concordanza Grammaticale
              </p>
            </div>
          </div>

          <!-- Time, Streak & Score Badges -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div class="bg-zinc-800/90 border border-zinc-700/60 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shadow-sm text-[11px] sm:text-xs font-mono" title="Tempo di gioco">
              <span class="text-sky-400">⏱️</span>
              <span class="font-bold text-zinc-200">{{ formattedTime() }}</span>
            </div>
            <div class="bg-zinc-800/90 border border-zinc-700/60 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shadow-sm text-[11px] sm:text-xs" title="Serie di risposte corrette">
              <span class="text-amber-400 animate-pulse">🔥</span>
              <span class="font-bold text-zinc-200">{{ streak() }}</span>
            </div>
            <div class="bg-zinc-800/90 border border-zinc-700/60 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shadow-sm text-[11px] sm:text-xs" title="Punteggio Totale">
              <span class="text-emerald-400">🏆</span>
              <span class="font-bold text-zinc-200">{{ score() }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Game Container -->
      <main class="flex-1 max-w-md w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col justify-between space-y-4 sm:space-y-5">

        @if (currentPuzzle(); as puzzle) {
          
          <!-- Puzzle Header Info -->
          <div class="flex items-center justify-between flex-wrap gap-2 text-xs px-1">
            <div class="flex items-center gap-2">
              <span class="text-zinc-500 font-bold tracking-wider">REBUS #{{ puzzle.id }}</span>
              <span [class]="getDifficultyStyle(puzzle.difficulty) + ' px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider'">
                {{ puzzle.difficulty }}
              </span>
            </div>

            <div class="text-zinc-400 font-mono text-[11px] bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg shadow-sm">
              Lunghezza: <span class="text-amber-400 font-bold">{{ puzzle.wordLengths.join(' + ') }}</span>
            </div>
          </div>

          <!-- Strict 2-Card Visual Rebus Board -->
          <div class="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-3 sm:p-4 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col items-center justify-center space-y-4">
            
            <!-- Solved Celebration Overlay -->
            @if (isSolved()) {
              <div class="absolute inset-0 pointer-events-none z-20 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
                <div class="text-6xl animate-bounce">🎉</div>
              </div>
            }

            <!-- 2 Vector Image Cards Side-by-Side -->
            <div class="w-full flex items-center justify-center gap-1 sm:gap-4 py-2">
              
              <!-- Card 1 -->
              <div class="relative group w-[42%] max-w-44 aspect-[3/4] bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 rounded-2xl border-2 border-zinc-700/80 p-3 flex flex-col items-center justify-center shadow-xl transition-all duration-300 hover:border-amber-500/50">
                <ng-container *ngTemplateOutlet="svgTemplate; context: { type: puzzle.cards[0].type, badge: puzzle.cards[0].operatorBadge }"></ng-container>

                @if (puzzle.cards[0].operatorBadge) {
                  <div class="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-mono font-black text-[11px] px-2 py-0.5 rounded-md shadow-lg border border-red-400/40">
                    {{ puzzle.cards[0].operatorBadge }}
                  </div>
                }
              </div>

              <!-- Rebus Plus Operator Sign -->
              <div class="text-amber-500 font-black text-2xl sm:text-3xl select-none px-0.5 sm:px-1">
                +
              </div>

              <!-- Card 2 -->
              <div class="relative group w-[42%] max-w-44 aspect-[3/4] bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 rounded-2xl border-2 border-zinc-700/80 p-3 flex flex-col items-center justify-center shadow-xl transition-all duration-300 hover:border-amber-500/50">
                <ng-container *ngTemplateOutlet="svgTemplate; context: { type: puzzle.cards[1].type, badge: puzzle.cards[1].operatorBadge }"></ng-container>

                @if (puzzle.cards[1].operatorBadge) {
                  <div class="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-mono font-black text-[11px] px-2 py-0.5 rounded-md shadow-lg border border-red-400/40">
                    {{ puzzle.cards[1].operatorBadge }}
                  </div>
                }
              </div>

            </div>
          </div>

          <!-- Optional Toggleable Structural Hint Box -->
          @if (showHint()) {
            <div class="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3 text-xs text-amber-200/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-fade-in shadow-inner">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-base shrink-0">💡</span>
                <span class="font-mono text-xs sm:text-sm tracking-wider sm:tracking-widest font-bold text-amber-300 break-words">
                  {{ puzzle.maskedOutline }}
                </span>
              </div>
              <span class="font-mono text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-bold">
                Iniziale: {{ puzzle.firstLetter }} • Finale: {{ puzzle.lastLetter }}
              </span>
            </div>
          }

          <!-- Answer Guess Input Form -->
          <div class="space-y-3">
            @if (!isSolved()) {
              <div class="relative flex items-center">
                <input 
                  type="text" 
                  [ngModel]="userGuess()"
                  (ngModelChange)="userGuess.set($event)"
                  (keyup.enter)="checkGuess()"
                  placeholder="Scrivi la soluzione qui..."
                  class="w-full bg-zinc-900 border-2 border-zinc-700/80 rounded-2xl px-4 py-3.5 pr-20 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium text-base shadow-inner"
                />
                <button 
                  (click)="checkGuess()"
                  class="absolute right-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all text-sm">
                  Invia
                </button>
              </div>

              <!-- Hint & Reveal Action Buttons -->
              <div class="flex items-center justify-between text-xs px-1">
                <button 
                  (click)="toggleHint()"
                  class="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 transition-colors">
                  <span>{{ showHint() ? 'Nascondi Indizio' : '🔍 Mostra Indizio' }}</span>
                </button>

                <button 
                  (click)="revealAnswer()"
                  class="text-zinc-500 hover:text-zinc-300 transition-colors">
                  Rivela Risposta
                </button>
              </div>
            } @else {
              <!-- Solved Celebration Banner -->
              <div class="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-3 sm:p-4 text-center space-y-3 shadow-xl animate-fade-in">
                <div class="text-emerald-400 font-black text-lg flex items-center justify-center gap-2">
                  <span>🎯</span>
                  <span>ESATTO!</span>
                </div>
                <div class="text-zinc-100 font-mono text-sm sm:text-base bg-zinc-950/90 py-2.5 px-3 rounded-xl border border-emerald-500/30 uppercase font-bold tracking-widest break-words">
                  {{ puzzle.answer }}
                </div>
                <button 
                  (click)="nextPuzzle()"
                  class="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all text-sm uppercase tracking-wider">
                  Prossimo Rebus ➔
                </button>
              </div>
            }
          </div>

          <!-- Feedback Toast -->
          @if (feedbackMessage()) {
            <div [class]="'p-3 rounded-xl text-center text-xs font-bold border shadow-lg transition-all animate-bounce ' + (isCorrectFeedback() ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200' : 'bg-red-900/80 border-red-500 text-red-200')">
              {{ feedbackMessage() }}
            </div>
          }

          <!-- Global Action Bar -->
          <div class="pt-1">
            <button 
              (click)="nextPuzzle()"
              class="w-full py-3.5 bg-zinc-900 border border-zinc-700/80 hover:bg-zinc-800 text-zinc-200 font-bold rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 text-sm">
              <span>🔄 Genera Nuovo Rebus Casuale</span>
            </button>
          </div>

        }
      </main>

      <footer class="max-w-md mx-auto w-full text-center text-[10px] text-zinc-600 px-4 pt-2">
        Rebus Folkloristici Italiani • Riservato ad un pubblico adulto
      </footer>
    </div>

    <!-- SVG Templates -->
    <ng-template #svgTemplate let-type="type" let-badge="badge">
      <div class="w-full h-full flex flex-col items-center justify-center p-1">
        @switch (type) {
          @case ('pope') {
            <!-- Il Papa (Papal Tiara & Keys) -->
            <svg class="h-full w-full text-amber-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 30 75 L 70 75 L 65 58 L 35 58 Z" fill="#FBBF24" />
              <path d="M 35 58 L 65 58 L 60 42 L 40 42 Z" fill="#F59E0B" />
              <path d="M 40 42 L 60 42 L 54 26 L 46 26 Z" fill="#D97706" />
              <rect x="47" y="14" width="6" height="12" fill="#FEF08A" />
              <rect x="43" y="17" width="14" height="5" fill="#FEF08A" />
              <path d="M 25 82 L 75 40 M 75 82 L 25 40" stroke="#E2E8F0" stroke-width="4" stroke-linecap="round" />
            </svg>
          }
          @case ('saint') {
            <!-- Saint with Halo -->
            <svg class="h-full w-full text-amber-300 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="38" r="24" fill="none" stroke="#FBBF24" stroke-width="4" stroke-dasharray="6 2" />
              <circle cx="50" cy="42" r="14" fill="#FED7AA" />
              <path d="M 30 85 Q 30 58 50 58 Q 70 58 70 85 Z" fill="#0284C7" />
            </svg>
          }
          @case ('pig') {
            <svg class="h-full w-full text-pink-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="50" cy="55" rx="35" ry="28" fill="#F472B6" />
              <circle cx="50" cy="62" r="14" fill="#F43F5E" />
              <circle cx="44" cy="62" r="3" fill="#9F1239" />
              <circle cx="56" cy="62" r="3" fill="#9F1239" />
              <circle cx="35" cy="45" r="4" fill="#1E293B" />
              <circle cx="65" cy="45" r="4" fill="#1E293B" />
              <path d="M 22 35 Q 15 20 30 28 Z" fill="#E11D48" />
              <path d="M 78 35 Q 85 20 70 28 Z" fill="#E11D48" />
              <path d="M 85 55 Q 95 50 90 60" stroke="#F472B6" stroke-width="4" fill="none" stroke-linecap="round" />
            </svg>
          }
          @case ('divine') {
            <svg class="h-full w-full text-amber-300 drop-shadow-lg" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="16" fill="#FBBF24" />
              <g stroke="#F59E0B" stroke-width="3" stroke-linecap="round">
                <line x1="50" y1="10" x2="50" y2="26" />
                <line x1="50" y1="74" x2="50" y2="90" />
                <line x1="10" y1="50" x2="26" y2="50" />
                <line x1="74" y1="50" x2="90" y2="50" />
                <line x1="22" y1="22" x2="33" y2="33" />
                <line x1="67" y1="67" x2="78" y2="78" />
                <line x1="22" y1="78" x2="33" y2="67" />
                <line x1="67" y1="33" x2="78" y2="22" />
              </g>
              <polygon points="50,40 54,48 62,50 54,52 50,60 46,52 38,50 46,48" fill="#FFFBEB" />
            </svg>
          }
          @case ('dog') {
            <svg class="h-full w-full text-amber-600 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 35 40 Q 30 20 45 25 Q 60 20 55 40 Z" fill="#D97706" />
              <ellipse cx="45" cy="50" rx="18" ry="22" fill="#B45309" />
              <circle cx="36" cy="38" r="3" fill="#1E293B" />
              <ellipse cx="45" cy="44" rx="5" ry="4" fill="#1E293B" />
              <path d="M 28 32 Q 20 45 28 52 Z" fill="#78350F" />
              <path d="M 62 32 Q 70 45 62 52 Z" fill="#78350F" />
              <ellipse cx="45" cy="72" rx="22" ry="18" fill="#D97706" />
              <path d="M 65 72 Q 80 60 75 80" stroke="#B45309" stroke-width="5" fill="none" stroke-linecap="round" />
            </svg>
          }
          @case ('executioner') {
            <svg class="h-full w-full text-zinc-300 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 30 75 Q 30 35 50 35 Q 70 35 70 75 Z" fill="#27272A" />
              <circle cx="43" cy="52" r="3" fill="#EF4444" />
              <circle cx="57" cy="52" r="3" fill="#EF4444" />
              <rect x="18" y="20" width="6" height="60" fill="#71717A" rx="2" />
              <path d="M 24 25 Q 45 15 35 45 Q 24 35 24 25 Z" fill="#9CA3AF" />
            </svg>
          }
          @case ('madonna') {
            <svg class="h-full w-full text-sky-300 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="45" r="32" fill="none" stroke="#FBBF24" stroke-width="4" />
              <path d="M 25 80 Q 25 35 50 35 Q 75 35 75 80 Z" fill="#0284C7" />
              <ellipse cx="50" cy="52" rx="12" ry="15" fill="#FED7AA" />
              <path d="M 38 42 Q 50 32 62 42 Q 50 48 38 42 Z" fill="#0369A1" />
            </svg>
          }
          @case ('wolf') {
            <svg class="h-full w-full text-slate-300 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 30 80 L 40 55 L 30 45 L 45 35 L 55 18 L 60 30 L 70 42 L 60 60 L 65 80 Z" fill="#475569" />
              <polygon points="55,18 48,28 58,28" fill="#334155" />
              <circle cx="50" cy="30" r="2" fill="#F59E0B" />
              <path d="M 20 85 Q 10 60 25 40 Q 15 25 30 15" stroke="#94A3B8" stroke-width="2" fill="none" />
            </svg>
          }
          @case ('ogre') {
            <svg class="h-full w-full text-emerald-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="50" cy="52" rx="28" ry="26" fill="#059669" />
              <circle cx="38" cy="46" r="6" fill="#FEF08A" />
              <circle cx="62" cy="46" r="6" fill="#FEF08A" />
              <circle cx="38" cy="46" r="2.5" fill="#000000" />
              <circle cx="62" cy="46" r="2.5" fill="#000000" />
              <path d="M 35 66 Q 50 58 65 66 Q 50 74 35 66 Z" fill="#064E3B" />
              <polygon points="42,62 45,67 48,62" fill="#FFFFFF" />
              <polygon points="52,62 55,67 58,62" fill="#FFFFFF" />
            </svg>
          }
          @case ('snake') {
            <svg class="h-full w-full text-emerald-500 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 50 20 Q 75 20 70 45 Q 65 60 50 65 Q 35 70 45 85 Q 55 90 70 85" fill="none" stroke="#10B981" stroke-width="12" stroke-linecap="round" />
              <ellipse cx="50" cy="22" rx="14" ry="10" fill="#047857" />
              <circle cx="44" cy="20" r="2" fill="#FEF08A" />
              <circle cx="56" cy="20" r="2" fill="#FEF08A" />
            </svg>
          }
          @case ('toad') {
            <svg class="h-full w-full text-lime-500 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="50" cy="60" rx="32" ry="24" fill="#65A30D" />
              <circle cx="35" cy="38" r="10" fill="#84CC16" />
              <circle cx="65" cy="38" r="10" fill="#84CC16" />
              <circle cx="35" cy="38" r="4" fill="#1E293B" />
              <circle cx="65" cy="38" r="4" fill="#1E293B" />
              <path d="M 35 64 Q 50 72 65 64" stroke="#3F6212" stroke-width="4" fill="none" stroke-linecap="round" />
            </svg>
          }
          @case ('dragon') {
            <svg class="h-full w-full text-red-500 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 25 70 Q 15 40 45 30 L 70 20 L 60 40 L 75 55 L 50 75 Z" fill="#DC2626" />
              <polygon points="45,30 35,15 55,25" fill="#B91C1C" />
              <polygon points="60,40 75,28 68,48" fill="#B91C1C" />
              <circle cx="55" cy="32" r="3" fill="#FEF08A" />
              <path d="M 70 20 L 85 18 L 75 28 Z" fill="#F59E0B" />
            </svg>
          }
          @case ('goat') {
            <svg class="h-full w-full text-stone-300 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,30 30,70 70,70" fill="#E7E5E4" />
              <path d="M 35 32 Q 15 15 25 5 Q 40 10 40 30" fill="none" stroke="#A8A29E" stroke-width="5" />
              <path d="M 65 32 Q 85 15 75 5 Q 60 10 60 30" fill="none" stroke="#A8A29E" stroke-width="5" />
              <circle cx="40" cy="50" r="3" fill="#1C1917" />
              <circle cx="60" cy="50" r="3" fill="#1C1917" />
              <polygon points="50,70 45,85 55,85" fill="#D6D3D1" />
            </svg>
          }
          @case ('cow') {
            <svg class="h-full w-full text-zinc-100 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="50" cy="55" rx="30" ry="25" fill="#F4F4F5" />
              <ellipse cx="50" cy="65" rx="16" ry="12" fill="#F472B6" />
              <circle cx="35" cy="45" r="4" fill="#18181B" />
              <circle cx="65" cy="45" r="4" fill="#18181B" />
              <path d="M 25 40 Q 30 55 20 60 Z" fill="#18181B" />
              <path d="M 70 45 Q 80 50 75 65 Z" fill="#18181B" />
              <path d="M 28 35 Q 20 20 32 25 Z" fill="#F59E0B" />
              <path d="M 72 35 Q 80 20 68 25 Z" fill="#F59E0B" />
            </svg>
          }
          @case ('donkey') {
            <svg class="h-full w-full text-neutral-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="50" cy="55" rx="22" ry="28" fill="#A3A3A3" />
              <path d="M 38 40 L 25 5 L 42 30 Z" fill="#737373" />
              <path d="M 62 40 L 75 5 L 58 30 Z" fill="#737373" />
              <ellipse cx="50" cy="68" rx="14" ry="10" fill="#E5E5E5" />
              <circle cx="40" cy="48" r="3" fill="#171717" />
              <circle cx="60" cy="48" r="3" fill="#171717" />
            </svg>
          }
          @case ('crow') {
            <svg class="h-full w-full text-slate-800 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 30 75 Q 30 40 50 35 Q 75 40 70 75 Z" fill="#0F172A" />
              <polygon points="50,45 80,52 52,60" fill="#334155" />
              <circle cx="42" cy="45" r="3" fill="#F59E0B" />
            </svg>
          }
          @case ('pirate') {
            <svg class="h-full w-full text-red-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="52" r="24" fill="#FED7AA" />
              <path d="M 30 40 L 70 55" stroke="#18181B" stroke-width="3" />
              <circle cx="42" cy="48" r="6" fill="#18181B" />
              <path d="M 25 45 Q 50 20 75 45 L 80 35 Q 50 15 20 35 Z" fill="#DC2626" />
              <circle cx="50" cy="30" r="3" fill="#FFFFFF" />
            </svg>
          }
          @case ('shark') {
            <svg class="h-full w-full text-cyan-500 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 15 60 Q 40 30 85 45 Q 60 70 15 60 Z" fill="#06B6D4" />
              <polygon points="45,40 55,15 65,42" fill="#0891B2" />
              <circle cx="72" cy="46" r="2.5" fill="#155E75" />
              <polygon points="65,55 68,60 71,55" fill="#FFFFFF" />
              <polygon points="71,55 74,60 77,55" fill="#FFFFFF" />
            </svg>
          }
          @case ('vampire') {
            <svg class="h-full w-full text-purple-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 20 80 L 35 45 L 50 35 L 65 45 L 80 80 Z" fill="#581C87" />
              <ellipse cx="50" cy="48" rx="16" ry="18" fill="#F3E8FF" />
              <path d="M 34 40 Q 50 48 66 40 Q 50 30 34 40 Z" fill="#1E1B4B" />
              <circle cx="43" cy="46" r="2" fill="#DC2626" />
              <circle cx="57" cy="46" r="2" fill="#DC2626" />
              <polygon points="45,54 46,59 48,54" fill="#FFFFFF" />
              <polygon points="52,54 54,59 55,54" fill="#FFFFFF" />
            </svg>
          }
          @case ('devil') {
            <svg class="h-full w-full text-red-600 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="50" cy="55" rx="25" ry="25" fill="#EF4444" />
              <path d="M 30 40 Q 20 15 38 28 Z" fill="#991B1B" />
              <path d="M 70 40 Q 80 15 62 28 Z" fill="#991B1B" />
              <circle cx="40" cy="50" r="3" fill="#FEF08A" />
              <circle cx="60" cy="50" r="3" fill="#FEF08A" />
              <polygon points="50,70 45,82 55,82" fill="#991B1B" />
            </svg>
          }
          @case ('thief') {
            <svg class="h-full w-full text-amber-200 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="50" cy="55" rx="22" ry="24" fill="#FDE68A" />
              <rect x="25" y="44" width="50" height="14" fill="#18181B" rx="4" />
              <circle cx="38" cy="51" r="3" fill="#FFFFFF" />
              <circle cx="62" cy="51" r="3" fill="#FFFFFF" />
              <path d="M 26 46 Q 50 20 74 46 Z" fill="#3F3F46" />
            </svg>
          }
          @case ('cross') {
            <svg class="h-full w-full text-amber-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <rect x="42" y="15" width="16" height="70" fill="#D97706" rx="3" />
              <rect x="20" y="32" width="60" height="16" fill="#D97706" rx="3" />
              <rect x="45" y="18" width="10" height="64" fill="#FBBF24" rx="2" />
            </svg>
          }
          @case ('host') {
            <svg class="h-full w-full text-amber-100 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="34" fill="#FEF3C7" stroke="#FCD34D" stroke-width="4" />
              <path d="M 50 28 L 50 72 M 32 44 L 68 44" stroke="#D97706" stroke-width="3" stroke-linecap="round" />
            </svg>
          }
          @case ('worm') {
            <svg class="h-full w-full text-rose-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 20 60 Q 35 30 50 60 Q 65 90 80 60" fill="none" stroke="#FB7185" stroke-width="10" stroke-linecap="round" />
              <circle cx="80" cy="60" r="7" fill="#E11D48" />
              <circle cx="82" cy="58" r="1.5" fill="#FFFFFF" />
            </svg>
          }
          @case ('monkey') {
            <svg class="h-full w-full text-amber-800 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="26" fill="#78350F" />
              <ellipse cx="50" cy="58" rx="16" ry="12" fill="#FDE68A" />
              <circle cx="30" cy="45" r="8" fill="#78350F" />
              <circle cx="70" cy="45" r="8" fill="#78350F" />
              <circle cx="30" cy="45" r="4" fill="#FDE68A" />
              <circle cx="70" cy="45" r="4" fill="#FDE68A" />
              <circle cx="42" cy="45" r="3" fill="#1C1917" />
              <circle cx="58" cy="45" r="3" fill="#1C1917" />
            </svg>
          }
          @case ('skunk') {
            <svg class="h-full w-full text-zinc-300 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="50" cy="55" rx="25" ry="22" fill="#18181B" />
              <path d="M 50 33 Q 35 20 50 75" fill="none" stroke="#F4F4F5" stroke-width="8" stroke-linecap="round" />
              <circle cx="40" cy="48" r="3" fill="#FFFFFF" />
              <circle cx="60" cy="48" r="3" fill="#FFFFFF" />
            </svg>
          }
          @case ('skull') {
            <svg class="h-full w-full text-zinc-200 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 30 45 C 30 25 70 25 70 45 C 70 58 60 60 60 70 L 40 70 C 40 60 30 58 30 45 Z" fill="#E4E4E7" />
              <circle cx="42" cy="45" r="6" fill="#18181B" />
              <circle cx="58" cy="45" r="6" fill="#18181B" />
              <polygon points="50,52 46,60 54,60" fill="#18181B" />
              <line x1="45" y1="65" x2="45" y2="70" stroke="#18181B" stroke-width="2" />
              <line x1="50" y1="65" x2="50" y2="70" stroke="#18181B" stroke-width="2" />
              <line x1="55" y1="65" x2="55" y2="70" stroke="#18181B" stroke-width="2" />
            </svg>
          }
          @case ('fire') {
            <svg class="h-full w-full text-orange-500 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 50 15 Q 70 40 65 60 Q 80 50 75 75 Q 65 90 50 90 Q 25 90 25 70 Q 25 45 50 15 Z" fill="#F97316" />
              <path d="M 50 40 Q 60 55 58 70 Q 65 65 60 80 Q 52 88 48 88 Q 35 88 38 72 Q 40 55 50 40 Z" fill="#FACC15" />
            </svg>
          }
          @case ('bat') {
            <svg class="h-full w-full text-zinc-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 50 45 Q 35 25 15 35 Q 25 55 35 55 Q 42 65 50 55 Q 58 65 65 55 Q 75 55 85 35 Q 65 25 50 45 Z" fill="#27272A" />
              <circle cx="46" cy="45" r="2" fill="#EF4444" />
              <circle cx="54" cy="45" r="2" fill="#EF4444" />
            </svg>
          }
          @case ('sewer') {
            <svg class="h-full w-full text-emerald-700 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="32" fill="#047857" stroke="#065F46" stroke-width="4" />
              <circle cx="50" cy="50" r="24" fill="#022C22" />
              <path d="M 30 50 L 70 50 M 50 30 L 50 70" stroke="#047857" stroke-width="4" />
            </svg>
          }
          @case ('rat') {
            <svg class="h-full w-full text-stone-400 drop-shadow-md" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="45" cy="55" rx="25" ry="18" fill="#78716C" />
              <path d="M 65 55 L 85 58 L 68 62 Z" fill="#57534E" />
              <circle cx="62" cy="52" r="2" fill="#EF4444" />
              <circle cx="35" cy="42" r="6" fill="#F472B6" />
              <path d="M 20 58 Q 5 50 10 70" fill="none" stroke="#F472B6" stroke-width="3" />
            </svg>
          }
        }
      </div>
    </ng-template>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
  `]
})
export class App implements OnInit, OnDestroy {

  // Subject dictionary featuring weighted selection and strict gender markers ('m' or 'f')
  private readonly SACRED_SUBJECTS: ConceptItem[] = [
    // Heavyweight Primary Deities
    { word: 'dio', gender: 'm', type: 'divine', weight: 12 },
    { word: 'madonna', gender: 'f', type: 'madonna', weight: 12 },
    { word: 'cristo', gender: 'm', type: 'cross', weight: 10 },
    { word: 'gesu', gender: 'm', type: 'cross', operatorBadge: '+ G', weight: 8 },
    { word: 'il papa', gender: 'm', type: 'pope', weight: 6 },
    { word: 'ostia', gender: 'f', type: 'host', weight: 6 },

    // Italian Calendar Saints (Masculine)
    { word: 'san gennaro', gender: 'm', type: 'saint', operatorBadge: '+ Gennaro', weight: 2 },
    { word: 'san pio', gender: 'm', type: 'saint', operatorBadge: '+ Pio', weight: 2 },
    { word: 'san francesco', gender: 'm', type: 'saint', operatorBadge: '+ Francesco', weight: 2 },
    { word: 'sant antonio', gender: 'm', type: 'saint', operatorBadge: '+ Antonio', weight: 2 },
    { word: 'san giuseppe', gender: 'm', type: 'saint', operatorBadge: '+ Giuseppe', weight: 2 },
    { word: 'san luigi', gender: 'm', type: 'saint', operatorBadge: '+ Luigi', weight: 1 },
    { word: 'san rocco', gender: 'm', type: 'saint', operatorBadge: '+ Rocco', weight: 1 },
    { word: 'san giorgio', gender: 'm', type: 'saint', operatorBadge: '+ Giorgio', weight: 1 },
    { word: 'san michele', gender: 'm', type: 'saint', operatorBadge: '+ Michele', weight: 1 },
    { word: 'san nicola', gender: 'm', type: 'saint', operatorBadge: '+ Nicola', weight: 1 },
    { word: 'san pietro', gender: 'm', type: 'saint', operatorBadge: '+ Pietro', weight: 1 },
    { word: 'san paolo', gender: 'm', type: 'saint', operatorBadge: '+ Paolo', weight: 1 },
    { word: 'san giovanni', gender: 'm', type: 'saint', operatorBadge: '+ Giovanni', weight: 1 },
    { word: 'san martino', gender: 'm', type: 'saint', operatorBadge: '+ Martino', weight: 1 },
    { word: 'san lorenzo', gender: 'm', type: 'saint', operatorBadge: '+ Lorenzo', weight: 1 },

    // Italian Calendar Saints (Feminine)
    { word: 'santa lucia', gender: 'f', type: 'saint', operatorBadge: '+ Lucia', weight: 2 },
    { word: 'santa rita', gender: 'f', type: 'saint', operatorBadge: '+ Rita', weight: 2 },
    { word: 'santa agata', gender: 'f', type: 'saint', operatorBadge: '+ Agata', weight: 2 },
    { word: 'santa chiara', gender: 'f', type: 'saint', operatorBadge: '+ Chiara', weight: 1 },
    { word: 'santa teresa', gender: 'f', type: 'saint', operatorBadge: '+ Teresa', weight: 1 }
  ];

  // Profane Attributes & Animals dictionary strictly categorized by grammatical gender ('m' or 'f')
  private readonly PROFANE_EPITHETS: ConceptItem[] = [
    // Masculine Animals & Insults
    { word: 'porco', gender: 'm', type: 'pig' },
    { word: 'maiale', gender: 'm', type: 'pig', operatorBadge: '+ M' },
    { word: 'cane', gender: 'm', type: 'dog' },
    { word: 'lupo', gender: 'm', type: 'wolf' },
    { word: 'orco', gender: 'm', type: 'ogre' },
    { word: 'boia', gender: 'm', type: 'executioner' },
    { word: 'serpente', gender: 'm', type: 'snake' },
    { word: 'rospo', gender: 'm', type: 'toad' },
    { word: 'drago', gender: 'm', type: 'dragon' },
    { word: 'asino', gender: 'm', type: 'donkey' },
    { word: 'corvo', gender: 'm', type: 'crow' },
    { word: 'pirata', gender: 'm', type: 'pirate' },
    { word: 'squalo', gender: 'm', type: 'shark' },
    { word: 'vampiro', gender: 'm', type: 'vampire' },
    { word: 'diavolo', gender: 'm', type: 'devil' },
    { word: 'ladro', gender: 'm', type: 'thief' },
    { word: 'verme', gender: 'm', type: 'worm' },
    { word: 'pipistrello', gender: 'm', type: 'bat' },
    { word: 'topaccio', gender: 'm', type: 'rat' },
    { word: 'bastardo', gender: 'm', type: 'skull' },
    { word: 'maledetto', gender: 'm', type: 'fire' },
    { word: 'schifoso', gender: 'm', type: 'sewer' },
    { word: 'infame', gender: 'm', type: 'executioner' },

    // Feminine Animals & Insults
    { word: 'porca', gender: 'f', type: 'pig' },
    { word: 'vacca', gender: 'f', type: 'cow' },
    { word: 'capra', gender: 'f', type: 'goat' },
    { word: 'scimmia', gender: 'f', type: 'monkey' },
    { word: 'puzzola', gender: 'f', type: 'skunk' },
    { word: 'ladra', gender: 'f', type: 'thief' },
    { word: 'bastarda', gender: 'f', type: 'skull' },
    { word: 'maledetta', gender: 'f', type: 'fire' },
    { word: 'schifosa', gender: 'f', type: 'sewer' },
    { word: 'pantegana', gender: 'f', type: 'rat' },
    { word: 'vampira', gender: 'f', type: 'vampire' },
    { word: 'piratessa', gender: 'f', type: 'pirate' }
  ];

  currentPuzzle = signal<RebusPuzzle | null>(null);
  userGuess = signal<string>('');
  showHint = signal<boolean>(false);
  isSolved = signal<boolean>(false);
  
  feedbackMessage = signal<string | null>(null);
  isCorrectFeedback = signal<boolean>(false);

  streak = signal<number>(0);
  score = signal<number>(0);

  // Time tracker signals
  elapsedSeconds = signal<number>(0);
  private timerInterval: any = null;

  private puzzleCounter = 1;

  // Sound effect player for incorrect answers (local asset: public/assets/fahhh.mp3)
  private readonly faahAudio = new Audio('assets/fahhh.mp3');

  private playFaahSound() {
    this.faahAudio.currentTime = 0;
    this.faahAudio.play().catch(() => {
      // Fallback if the browser blocks autoplay before a user gesture
    });
  }

  ngOnInit() {
    this.loadStats();
    this.startTimer();
    this.nextPuzzle();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
    }, 1000);
  }

  formattedTime = computed(() => {
    const totalSecs = this.elapsedSeconds();
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  loadStats() {
    const savedStreak = localStorage.getItem('rb_streak_v3');
    const savedScore = localStorage.getItem('rb_score_v3');
    if (savedStreak) this.streak.set(parseInt(savedStreak, 10));
    if (savedScore) this.score.set(parseInt(savedScore, 10));
  }

  // Weighted Random Selector for High-Frequency Deities (Dio, Madonna, Cristo)
  private getRandomSubject(): ConceptItem {
    const totalWeight = this.SACRED_SUBJECTS.reduce((acc, s) => acc + (s.weight || 1), 0);
    let randomNum = Math.random() * totalWeight;
    
    for (const subject of this.SACRED_SUBJECTS) {
      const weight = subject.weight || 1;
      if (randomNum < weight) {
        return subject;
      }
      randomNum -= weight;
    }
    return this.SACRED_SUBJECTS[0];
  }

  nextPuzzle() {
    this.userGuess.set('');
    this.showHint.set(false);
    this.isSolved.set(false);
    this.feedbackMessage.set(null);

    // 1. Pick sacred deity/saint based on weighting
    const subj = this.getRandomSubject();

    // 2. Filter epithets to strictly match gender (m -> m, f -> f)
    const matchingEpithets = this.PROFANE_EPITHETS.filter(ep => ep.gender === subj.gender);

    // 3. Pick random matching epithet
    const ep = matchingEpithets[Math.floor(Math.random() * matchingEpithets.length)];

    // Randomize Card Placement Order (e.g. "Porco Dio" or "Dio Porco")
    const isSubjectFirst = Math.random() > 0.4;

    const word1 = isSubjectFirst ? subj.word : ep.word;
    const word2 = isSubjectFirst ? ep.word : subj.word;
    const fullAnswer = `${word1} ${word2}`;

    const card1: RebusCard = isSubjectFirst 
      ? { type: subj.type, operatorBadge: subj.operatorBadge } 
      : { type: ep.type, operatorBadge: ep.operatorBadge };

    const card2: RebusCard = isSubjectFirst 
      ? { type: ep.type, operatorBadge: ep.operatorBadge } 
      : { type: subj.type, operatorBadge: subj.operatorBadge };

    // Formats masked outline per word token
    const maskWord = (w: string) => {
      const parts = w.split(' ');
      return parts.map(p => p[0].toUpperCase() + '.'.repeat(p.length - 2) + p[p.length - 1].toUpperCase()).join(' ');
    };

    const maskedOutline = `${maskWord(word1)}  ${maskWord(word2)}`;
    const wordLengths = [...word1.split(' ').map(w => w.length), word2.length];

    const totalLen = word1.length + word2.length;
    let difficulty: 'Facile' | 'Medio' | 'Difficile' = 'Facile';
    if (totalLen > 14) difficulty = 'Difficile';
    else if (totalLen > 9) difficulty = 'Medio';

    const newPuzzle: RebusPuzzle = {
      id: this.puzzleCounter++,
      cards: [card1, card2],
      word1,
      word2,
      answer: fullAnswer,
      wordLengths,
      firstLetter: word1[0].toUpperCase(),
      lastLetter: word2[word2.length - 1].toUpperCase(),
      maskedOutline,
      difficulty
    };

    this.currentPuzzle.set(newPuzzle);
  }

  checkGuess() {
    const puzzle = this.currentPuzzle();
    if (!puzzle || !this.userGuess().trim()) return;

    const normalize = (str: string) => 
      str.toLowerCase()
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, "")
         .replace(/[^a-z0-9]/g, "");

    const normalizedInput = normalize(this.userGuess());
    const normalizedAnswer = normalize(puzzle.answer);

    if (normalizedInput === normalizedAnswer) {
      this.isSolved.set(true);
      this.isCorrectFeedback.set(true);
      this.feedbackMessage.set('🔥 Bravissimo! Risposta corretta!');

      const newStreak = this.streak() + 1;
      const newScore = this.score() + 10;
      this.streak.set(newStreak);
      this.score.set(newScore);

      localStorage.setItem('rb_streak_v3', newStreak.toString());
      localStorage.setItem('rb_score_v3', newScore.toString());
    } else {
      this.isCorrectFeedback.set(false);
      this.feedbackMessage.set('❌ Sbagliato, riprova!');
      this.playFaahSound(); // Trigger the authentic incorrect "faah" buzzer sound effect
      setTimeout(() => this.feedbackMessage.set(null), 2000);
    }
  }

  toggleHint() {
    this.showHint.update(v => !v);
  }

  revealAnswer() {
    const puzzle = this.currentPuzzle();
    if (!puzzle) return;
    this.userGuess.set(puzzle.answer);
    this.isSolved.set(true);
    this.streak.set(0);
    localStorage.setItem('rb_streak_v3', '0');
  }

  getDifficultyStyle(difficulty: 'Facile' | 'Medio' | 'Difficile'): string {
    switch (difficulty) {
      case 'Facile': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'Medio': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Difficile': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    }
  }
}