import React from 'react';
import { GameState } from '../types/game';
import { getCelestialTimeInfo } from '../utils/timeCycle';
import { Play, Pause } from 'lucide-react';
import { audio } from '../utils/audio';

interface CelestialTimeCycleProps {
  gameState: GameState;
  onTogglePause?: () => void;
}

export const CelestialTimeCycle: React.FC<CelestialTimeCycleProps> = ({
  gameState,
  onTogglePause,
}) => {
  const { gameHour = 6.0, isTimePaused = false, turn, seasonIndex } = gameState;
  const timeInfo = getCelestialTimeInfo(gameHour);

  const seasonNames = ['Primavera', 'Verão', 'Outono', 'Inverno'];
  const seasonIcons = ['🌱', '☀️', '🍂', '❄️'];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Celestial Sun/Moon Time Display (Auto-advancing continuous clock) */}
      <div
        className={`px-3 py-1.5 rounded-xl border-2 border-[#33261D] flex items-center gap-2.5 transition-all shadow-sm select-none ${
          timeInfo.isDay
            ? 'bg-gradient-to-r from-[#FFFBF0] to-[#FEF3C7] text-[#2C241E]'
            : 'bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-[#93C5FD] border-[#1E293B]'
        }`}
        title={`Ciclo de Tempo: ${timeInfo.celestialName} (${timeInfo.timeFormatted}) · ${timeInfo.routineTitle} - ${timeInfo.routineDescription}`}
      >
        {/* Dynamic Celestial Icon (Sun in daytime hours, Moon in nighttime hours) */}
        <div className="relative flex items-center justify-center">
          <span
            className={`text-xl sm:text-2xl transition-transform duration-500 ${
              timeInfo.isDay ? 'hover:scale-110 drop-shadow-xs' : 'hover:scale-110 drop-shadow-md'
            }`}
          >
            {timeInfo.icon}
          </span>
          {/* Subtle pulse ring for meal times */}
          {(timeInfo.routine === 'breakfast' ||
            timeInfo.routine === 'lunch' ||
            timeInfo.routine === 'dinner') && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </div>

        {/* Time and Celestial Stage */}
        <div className="text-left flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-mono font-black text-xs sm:text-sm tracking-tight ${
                timeInfo.isDay ? 'text-[#2C241E]' : 'text-[#E0F2FE]'
              }`}
            >
              {timeInfo.timeFormatted}
            </span>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider hidden sm:inline ${
                timeInfo.isDay ? 'text-amber-800/80' : 'text-blue-300/80'
              }`}
            >
              · {timeInfo.celestialName}
            </span>
          </div>

          {/* Active Routine Pill: Café da Manhã, Almoço, Jantar, etc. */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px]">{timeInfo.routineIcon}</span>
            <span
              className={`text-[10px] font-bold leading-none ${
                timeInfo.routine === 'breakfast'
                  ? 'text-amber-700 font-extrabold'
                  : timeInfo.routine === 'lunch'
                  ? 'text-orange-700 font-extrabold'
                  : timeInfo.routine === 'dinner'
                  ? 'text-purple-600 font-extrabold'
                  : timeInfo.isDay
                  ? 'text-stone-600'
                  : 'text-slate-300'
              }`}
            >
              {timeInfo.routineTitle}
            </span>
          </div>
        </div>

        {/* Circular / Line Celestial Progress Arc */}
        <div className="hidden lg:flex flex-col items-center justify-center pl-1 border-l border-stone-300/40">
          <div className="w-12 h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                timeInfo.isDay
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-gradient-to-r from-blue-400 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, timeInfo.sunPositionProgress * 100))}%` }}
            ></div>
          </div>
          <span
            className={`text-[8px] font-mono font-semibold pt-0.5 ${
              timeInfo.isDay ? 'text-stone-500' : 'text-slate-400'
            }`}
          >
            Dia {turn}
          </span>
        </div>

        {/* Play/Pause subtle control (optional convenience, no skip button) */}
        {onTogglePause && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              audio.playWood();
              onTogglePause();
            }}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              timeInfo.isDay
                ? 'hover:bg-amber-200/50 text-stone-700'
                : 'hover:bg-slate-700/60 text-slate-200'
            }`}
            title={isTimePaused ? 'Continuar tempo' : 'Pausar tempo'}
          >
            {isTimePaused ? <Play size={11} className="fill-current" /> : <Pause size={11} />}
          </button>
        )}
      </div>

      {/* Season & Year Badge */}
      <div className="hidden xl:flex items-center gap-1.5 bg-[#FAF3E7] border-2 border-stone-300 px-2.5 py-1 rounded-xl text-xs font-semibold text-stone-700">
        <span>{seasonIcons[seasonIndex]}</span>
        <span className="font-display font-extrabold text-[#78350F]">
          {seasonNames[seasonIndex]}
        </span>
        <span className="text-stone-400">·</span>
        <span className="text-[11px] font-mono font-bold">Ano {gameState.year}</span>
      </div>
    </div>
  );
};
