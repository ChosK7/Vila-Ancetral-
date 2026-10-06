import React from 'react';
import { GameState } from '../types/game';
import { ChevronDown, ChevronUp, Shield, Users, AlertTriangle, Sparkles, Heart } from 'lucide-react';
import { audio } from '../utils/audio';

interface ExpandableResourceBarProps {
  gameState: GameState;
  isExpanded: boolean;
  onToggleExpand: () => void;
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

export const ExpandableResourceBar: React.FC<ExpandableResourceBarProps> = ({
  gameState,
  isExpanded,
  onToggleExpand,
  rates,
}) => {
  const { resources, maxStorage, villagers, buildings } = gameState;

  // Calculate housing capacity
  const housingCap = Object.values(buildings).reduce(
    (acc, b) => acc + (b.housingCap || 0) * b.count,
    0
  );

  // Village Defense score
  const guardsCount = villagers.filter((v) => v.job === 'guard').length;
  const wallBonus = (buildings.stone_wall?.count || 0) * 50;
  const totalDefense = guardsCount * 15 + wallBonus;

  // Average Morale
  const avgMorale = villagers.length > 0
    ? Math.round(villagers.reduce((acc, v) => acc + v.morale, 0) / villagers.length)
    : 80;

  return (
    <div className="relative">
      {/* Compact Trigger Button (Shown in the top header) */}
      <button
        onClick={() => {
          audio.playWood();
          onToggleExpand();
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-[#33261D] text-xs font-bold transition-all shadow-xs cursor-pointer ${
          isExpanded
            ? 'bg-[#33261D] text-[#FFFBF5]'
            : 'bg-[#FFFDF9]/95 text-stone-900 hover:bg-[#F5EAD9]'
        }`}
        title="Clique para ver todos os recursos (Argila, Conhecimento, Defesa, Armazenamento)"
      >
        <span className="flex items-center gap-1">
          <span>🌾</span>
          <strong className="font-mono">{Math.floor(resources.food)}</strong>
        </span>
        <span className="text-stone-300">·</span>
        <span className="flex items-center gap-1">
          <span>🪵</span>
          <strong className="font-mono">{Math.floor(resources.wood)}</strong>
        </span>
        <span className="text-stone-300">·</span>
        <span className="flex items-center gap-1">
          <span>🪨</span>
          <strong className="font-mono">{Math.floor(resources.stone)}</strong>
        </span>
        <span className="text-stone-300">·</span>
        <span className="flex items-center gap-1">
          <Users size={12} className="text-amber-800" />
          <strong className="font-mono">{villagers.length}/{housingCap}</strong>
        </span>

        <span className="ml-1 text-[11px] font-hand font-extrabold text-[#78350F] flex items-center gap-0.5 bg-[#FAF3E7] px-1.5 py-0.5 rounded-md border border-stone-300">
          <span>Recursos</span>
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      {/* Expanded Floating Drawer (Drops right below the top line header) */}
      {isExpanded && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-[92vw] max-w-4xl bg-[#FDFBF7]/95 backdrop-blur-md border-3 border-[#33261D] rounded-2xl p-3 sm:p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b-2 border-stone-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏺</span>
              <div>
                <h4 className="font-display font-black text-sm text-[#2C241E] leading-tight">
                  Painel Completo de Recursos da Vila
                </h4>
                <p className="text-[11px] font-hand font-bold text-stone-600">
                  Valores atuais, capacidade de celeiro e rendimento sazonal
                </p>
              </div>
            </div>

            <button
              onClick={onToggleExpand}
              className="text-xs font-bold text-stone-500 hover:text-stone-900 px-2 py-1 rounded-lg hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
            >
              <span>Recolher</span>
              <ChevronUp size={14} />
            </button>
          </div>

          {/* Detailed Cards for All Resources */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
            {/* 1. Trigo / Alimento */}
            <div className={`p-2.5 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] flex flex-col justify-between ${
              resources.food <= 5 ? 'ring-2 ring-red-500 bg-red-50/70' : ''
            }`}>
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1">🌾 Trigo / Alimento</span>
                <span className={`text-[11px] font-bold ${rates.foodNet >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {rates.foodNet >= 0 ? `+${rates.foodNet}` : rates.foodNet}/turno
                </span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="font-display font-black text-lg text-stone-900">
                  {Math.floor(resources.food)}
                </span>
                <span className="text-xs text-stone-400 font-medium">/{maxStorage.food} máx</span>
              </div>
              <div className="text-[10px] text-stone-500 leading-tight">
                Colheita: <strong className="text-emerald-700">+{rates.foodProduced}</strong> · Consumo: <strong className="text-red-600">-{rates.foodConsumed} 🌾</strong> pelos aldeões
              </div>
              {resources.food <= 5 && (
                <span className="text-[9px] font-bold text-red-600 animate-pulse mt-0.5 flex items-center gap-1">
                  <AlertTriangle size={10} /> Risco de Fome! Aldeões perdem vida.
                </span>
              )}
            </div>

            {/* 2. Madeira */}
            <div className="p-2.5 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1">🪵 Madeira</span>
                <span className="text-[11px] font-bold text-emerald-700">
                  +{rates.wood - (gameState.woodConsumedPerTurn || 1)}/turno
                </span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="font-display font-black text-lg text-stone-900">
                  {Math.floor(resources.wood)}
                </span>
                <span className="text-xs text-stone-400 font-medium">/{maxStorage.wood} máx</span>
              </div>
              <div className="text-[10px] text-stone-500 leading-tight">
                Produz: +{rates.wood} · Fogueira: -{gameState.woodConsumedPerTurn || 1} 🪵/estação
              </div>
            </div>

            {/* 3. Pedra */}
            <div className="p-2.5 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1">🪨 Pedra</span>
                <span className="text-[11px] font-bold text-emerald-700">+{rates.stone}/turno</span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="font-display font-black text-lg text-stone-900">
                  {Math.floor(resources.stone)}
                </span>
                <span className="text-xs text-stone-400 font-medium">/{maxStorage.stone} máx</span>
              </div>
              <div className="text-[10px] text-stone-500">
                Para alvenaria, fornos e muralhas
              </div>
            </div>

            {/* 4. Argila (Recurso que não aparece no resumo compacto!) */}
            <div className="p-2.5 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] flex flex-col justify-between ring-1 ring-amber-400">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1">🧱 Argila</span>
                <span className="text-[11px] font-bold text-emerald-700">+{rates.clay}/turno</span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="font-display font-black text-lg text-stone-900">
                  {Math.floor(resources.clay)}
                </span>
                <span className="text-xs text-stone-400 font-medium">/{maxStorage.clay} máx</span>
              </div>
              <div className="text-[10px] text-stone-500">
                Para cerâmica, fornos e tábuas
              </div>
            </div>

            {/* 5. Conhecimento / Saber (Recurso oculto no resumo!) */}
            <div className="p-2.5 rounded-xl border-2 border-[#33261D] bg-[#FAF5FF] flex flex-col justify-between ring-1 ring-purple-300">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                <span className="flex items-center gap-1">📜 Saber Ancestral</span>
                <span className="text-[11px] font-bold text-purple-700">+{rates.knowledge}/turno</span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="font-display font-black text-lg text-purple-900">
                  {Math.floor(resources.knowledge)}
                </span>
                <span className="text-xs text-purple-400 font-medium">pontos</span>
              </div>
              <div className="text-[10px] text-purple-600">
                Gerado por Anciãos para pesquisas
              </div>
            </div>

            {/* 6. Defesa Militar (Recurso oculto no resumo!) */}
            <div className="p-2.5 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1">
                  <Shield size={12} className="text-amber-800" /> Defesa da Aldeia
                </span>
                <span className="text-[11px] font-bold text-amber-800">{guardsCount} guardas</span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="font-display font-black text-lg text-stone-900">
                  {totalDefense}
                </span>
                <span className="text-xs text-stone-400 font-medium">pts defesa</span>
              </div>
              <div className="text-[10px] text-stone-500">
                Muralhas: +{wallBonus} · Guardas: +{guardsCount * 15}
              </div>
            </div>

            {/* 7. População e Vagas */}
            <div className="p-2.5 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1">
                  <Users size={12} className="text-amber-800" /> População
                </span>
                <span className="text-[11px] font-bold text-stone-600">
                  {housingCap - villagers.length > 0 ? `${housingCap - villagers.length} vagas` : 'Lotado'}
                </span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="font-display font-black text-lg text-stone-900">
                  {villagers.length}
                </span>
                <span className="text-xs text-stone-400 font-medium">/{housingCap} habitação</span>
              </div>
              <div className="text-[10px] text-stone-500">
                Construa cabanas para acolher mais
              </div>
            </div>

            {/* 8. Moral Média da Vila */}
            <div className="p-2.5 rounded-xl border-2 border-[#33261D] bg-[#FFFBF5] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1">
                  <Heart size={12} className="text-rose-600" /> Moral Geral
                </span>
                <span className="text-[11px] font-bold text-emerald-700">
                  {avgMorale >= 75 ? '+15% bônus' : avgMorale <= 40 ? '-20% rendimento' : 'Normal'}
                </span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className="font-display font-black text-lg text-stone-900">
                  {avgMorale}%
                </span>
                <span className="text-xs text-stone-400 font-medium">bem-estar</span>
              </div>
              <div className="text-[10px] text-stone-500">
                Mantida com comida farta e poços
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
