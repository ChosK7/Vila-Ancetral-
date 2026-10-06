import React from 'react';
import { GameState } from '../types/game';
import { Volume2, VolumeX, Shield, Users, RefreshCw, HelpCircle } from 'lucide-react';
import { audio } from '../utils/audio';

interface ResourceBarProps {
  gameState: GameState;
  onToggleSound: () => void;
  onOpenHelp: () => void;
  onResetGame: () => void;
  rates: {
    foodNet: number;
    foodProduced: number;
    foodConsumed: number;
    wood: number;
    stone: number;
    clay: number;
    knowledge: number;
  };
}

export const ResourceBar: React.FC<ResourceBarProps> = ({
  gameState,
  onToggleSound,
  onOpenHelp,
  onResetGame,
  rates,
}) => {
  const { resources, maxStorage, villagers, buildings, soundEnabled } = gameState;

  // Calculate housing capacity
  const housingCap = Object.values(buildings).reduce(
    (acc, b) => acc + (b.housingCap || 0) * b.count,
    0
  );

  // Village Defense score
  const guardsCount = villagers.filter((v) => v.job === 'guard').length;
  const wallBonus = (buildings.stone_wall?.count || 0) * 50;
  const totalDefense = guardsCount * 15 + wallBonus;

  return (
    <header className="w-full bg-[#F5EAD9] border-b-3 border-[#33261D] shadow-sm px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Title & Brand */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="wheat">🌾</span>
            <div>
              <h1 className="font-display font-extrabold text-lg tracking-wide text-[#2B241E] leading-tight">
                Vila Ancestral
              </h1>
              <p className="text-[11px] font-hand font-bold text-stone-600">
                Evolução Humana por Turnos
              </p>
            </div>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som'}
              className="p-1.5 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] text-stone-700 hover:bg-[#EFE4CE]"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={onOpenHelp}
              aria-label="Como jogar"
              className="p-1.5 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] text-stone-700 hover:bg-[#EFE4CE]"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>

        {/* Resources Metrics Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full lg:w-auto">
          {/* Comida / Trigo */}
          <div className={`flex flex-col p-2 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] min-w-[95px] ${
            resources.food <= 5 ? 'ring-2 ring-red-500 bg-red-50/70' : ''
          }`}>
            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
              <span className="flex items-center gap-1 font-bold">🌾 Trigo</span>
              <span className={`text-[11px] font-bold ${rates.foodNet >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {rates.foodNet >= 0 ? `+${rates.foodNet}` : rates.foodNet}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-display font-black text-base text-stone-900">
                {Math.floor(resources.food)}
              </span>
              <span className="text-[10px] text-stone-400">/{maxStorage.food}</span>
            </div>
            {resources.food <= 5 && (
              <span className="text-[9px] font-bold text-red-600 animate-pulse">Risco de fome!</span>
            )}
          </div>

          {/* Madeira */}
          <div className="flex flex-col p-2 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] min-w-[95px]">
            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
              <span className="flex items-center gap-1 font-bold">🪵 Madeira</span>
              <span className="text-[11px] font-bold text-emerald-700">+{rates.wood}</span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-display font-black text-base text-stone-900">
                {Math.floor(resources.wood)}
              </span>
              <span className="text-[10px] text-stone-400">/{maxStorage.wood}</span>
            </div>
          </div>

          {/* Pedra */}
          <div className="flex flex-col p-2 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] min-w-[95px]">
            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
              <span className="flex items-center gap-1 font-bold">🪨 Pedra</span>
              <span className="text-[11px] font-bold text-emerald-700">+{rates.stone}</span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-display font-black text-base text-stone-900">
                {Math.floor(resources.stone)}
              </span>
              <span className="text-[10px] text-stone-400">/{maxStorage.stone}</span>
            </div>
          </div>

          {/* Argila */}
          <div className="flex flex-col p-2 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] min-w-[95px]">
            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
              <span className="flex items-center gap-1 font-bold">🧱 Argila</span>
              <span className="text-[11px] font-bold text-emerald-700">+{rates.clay}</span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-display font-black text-base text-stone-900">
                {Math.floor(resources.clay)}
              </span>
              <span className="text-[10px] text-stone-400">/{maxStorage.clay}</span>
            </div>
          </div>

          {/* Conhecimento */}
          <div className="flex flex-col p-2 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] min-w-[95px]">
            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
              <span className="flex items-center gap-1 font-bold">📜 Saber</span>
              <span className="text-[11px] font-bold text-purple-700">+{rates.knowledge}</span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-display font-black text-base text-purple-900">
                {Math.floor(resources.knowledge)}
              </span>
              <span className="text-[10px] text-purple-400">pts</span>
            </div>
          </div>

          {/* População e Habitação */}
          <div className="flex flex-col p-2 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] min-w-[95px]">
            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
              <span className="flex items-center gap-1 font-bold">
                <Users size={12} className="text-amber-800" /> Aldeões
              </span>
              <span className="text-[11px] font-bold text-stone-700">{villagers.length}/{housingCap}</span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-display font-black text-base text-stone-900">
                {villagers.length}
              </span>
              <span className="text-[10px] text-stone-500 font-medium">
                {housingCap - villagers.length > 0 ? `${housingCap - villagers.length} vagas` : 'Lotado'}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Utility Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] text-xs font-bold text-stone-700" title="Defesa da Aldeia">
            <Shield size={14} className="text-amber-800" />
            <span>Defesa {totalDefense}</span>
          </div>

          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som'}
            className="p-2 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] text-stone-700 hover:bg-[#EFE4CE] transition-colors"
            title={soundEnabled ? 'Som ativado' : 'Som mudo'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={onOpenHelp}
            aria-label="Instruções do Jogo"
            className="p-2 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] text-stone-700 hover:bg-[#EFE4CE] transition-colors"
            title="Como Jogar"
          >
            <HelpCircle size={16} />
          </button>

          <button
            onClick={onResetGame}
            aria-label="Reiniciar Jogo"
            className="p-2 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] text-stone-700 hover:bg-red-50 hover:text-red-700 transition-colors"
            title="Reiniciar Vila"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
