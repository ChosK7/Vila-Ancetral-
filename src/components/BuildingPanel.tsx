import React, { useState } from 'react';
import { Building, GameState } from '../types/game';
import { Hammer, CheckCircle2, Clock, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { audio } from '../utils/audio';

interface BuildingPanelProps {
  gameState: GameState;
  onStartConstruction: (buildingId: string) => void;
}

export const BuildingPanel: React.FC<BuildingPanelProps> = ({
  gameState,
  onStartConstruction,
}) => {
  const { buildings, resources, currentEra, technologies } = gameState;
  const [activeCategory, setActiveCategory] = useState<'all' | 'housing' | 'production' | 'defense' | 'wonder'>('all');

  const buildingsList = Object.values(buildings);

  // Check if player has enough resources to construct
  const canAfford = (b: Building) => {
    if (b.cost.wood && resources.wood < b.cost.wood) return false;
    if (b.cost.stone && resources.stone < b.cost.stone) return false;
    if (b.cost.clay && resources.clay < b.cost.clay) return false;
    if (b.cost.knowledge && resources.knowledge < b.cost.knowledge) return false;
    return true;
  };

  // Check if building is unlocked by tech and era
  const isUnlocked = (b: Building) => {
    if (b.requiredEra > currentEra) return false;
    if (b.requiredTech && !technologies[b.requiredTech]?.unlocked) return false;
    return true;
  };

  const isMaxed = (b: Building) => {
    if (b.maxCount && b.count >= b.maxCount) return true;
    return false;
  };

  const isUnderConstruction = (b: Building) => {
    return b.constructionTurnsLeft > 0;
  };

  const filteredBuildings = activeCategory === 'all'
    ? buildingsList
    : buildingsList.filter((b) => b.category === activeCategory);

  return (
    <div className="bg-[#FFFDF9] border-3 border-[#33261D] rounded-2xl p-4 shadow-md flex flex-col gap-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-[#33261D]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-lg text-[#2B241E]">
              Obras & Infraestrutura da Vila
            </h2>
            <span className="bg-[#EFE4CE] border border-[#33261D] text-[#33261D] text-xs font-bold px-2 py-0.5 rounded-full font-hand">
              {buildingsList.filter(b => b.count > 0).length} Estruturas Erguidas
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            Expanda abrigos, poços de irrigação e erga as muralhas da sua comunidade.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1 bg-[#F5EAD9] p-1 rounded-xl border border-[#33261D]/30 text-xs font-bold">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeCategory === 'all' ? 'bg-[#33261D] text-white' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveCategory('housing')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeCategory === 'housing' ? 'bg-[#33261D] text-white' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            Habitação
          </button>
          <button
            onClick={() => setActiveCategory('production')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeCategory === 'production' ? 'bg-[#33261D] text-white' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            Produção
          </button>
          <button
            onClick={() => setActiveCategory('defense')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeCategory === 'defense' ? 'bg-[#33261D] text-white' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            Defesa
          </button>
          <button
            onClick={() => setActiveCategory('wonder')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeCategory === 'wonder' ? 'bg-[#33261D] text-white' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            Maravilhas
          </button>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredBuildings.map((building) => {
          const unlocked = isUnlocked(building);
          const affordable = canAfford(building);
          const maxed = isMaxed(building);
          const inProgress = isUnderConstruction(building);

          return (
            <div
              key={building.id}
              className={`border-2 rounded-xl p-3 flex flex-col justify-between transition-all ${
                !unlocked
                  ? 'bg-stone-100/70 border-stone-300 opacity-60'
                  : inProgress
                  ? 'bg-amber-50/70 border-amber-500 shadow-sm'
                  : maxed
                  ? 'bg-emerald-50/50 border-emerald-300'
                  : 'bg-[#FFFDF9] border-[#33261D]/40 hover:border-[#33261D] shadow-xs'
              }`}
            >
              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {building.category === 'housing' && '🛖'}
                      {building.category === 'production' && '⚙️'}
                      {building.category === 'defense' && '🛡️'}
                      {building.category === 'wonder' && '🌟'}
                    </span>
                    <div>
                      <h4 className="font-hand font-bold text-base text-stone-900 leading-tight">
                        {building.name}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                        {building.count > 0 ? `${building.count} Construídos` : 'Não construído'}
                      </p>
                    </div>
                  </div>

                  {maxed && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                      <CheckCircle2 size={11} /> Limite
                    </span>
                  )}
                  {inProgress && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 animate-pulse">
                      <Clock size={11} /> {building.constructionTurnsLeft} turno(s)
                    </span>
                  )}
                  {!unlocked && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded">
                      <Lock size={11} /> Bloqueado
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-700 leading-relaxed mb-2 font-normal">
                  {building.description}
                </p>

                {/* Benefits */}
                <div className="bg-[#F8EFE2] rounded-lg p-1.5 border border-[#33261D]/20 mb-2.5">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-600 shrink-0" />
                    {building.benefitsDescription}
                  </span>
                </div>
              </div>

              {/* Cost & Construction Action Button */}
              <div className="border-t border-stone-200 pt-2 flex flex-col gap-2">
                {/* Costs list */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-stone-600">
                  <span className="text-stone-400 font-normal">Custo:</span>
                  {building.cost.wood && (
                    <span className={resources.wood >= building.cost.wood ? 'text-stone-800 font-bold' : 'text-red-600 font-bold'}>
                      🪵 {building.cost.wood}
                    </span>
                  )}
                  {building.cost.stone && (
                    <span className={resources.stone >= building.cost.stone ? 'text-stone-800 font-bold' : 'text-red-600 font-bold'}>
                      𫭢 {building.cost.stone}
                    </span>
                  )}
                  {building.cost.clay && (
                    <span className={resources.clay >= building.cost.clay ? 'text-stone-800 font-bold' : 'text-red-600 font-bold'}>
                      🧱 {building.cost.clay}
                    </span>
                  )}
                  {building.cost.knowledge && (
                    <span className={resources.knowledge >= building.cost.knowledge ? 'text-purple-800 font-bold' : 'text-red-600 font-bold'}>
                      📜 {building.cost.knowledge}
                    </span>
                  )}
                </div>

                {/* Build Button */}
                {unlocked && !maxed && (
                  <button
                    onClick={() => {
                      audio.playBuild();
                      onStartConstruction(building.id);
                    }}
                    disabled={!affordable || inProgress}
                    className={`w-full py-1.5 px-3 rounded-lg border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                      inProgress
                        ? 'bg-amber-100 border-amber-400 text-amber-800 cursor-wait'
                        : affordable
                        ? 'bg-[#E5B84B] border-[#33261D] text-[#2C241E] hover:bg-[#D9A036] hover:scale-[1.01] cursor-pointer'
                        : 'bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <Hammer size={14} />
                    <span>
                      {inProgress
                        ? `Construindo... (${building.constructionTurnsLeft} turno(s))`
                        : 'Iniciar Construção'}
                    </span>
                  </button>
                )}

                {!unlocked && (
                  <div className="text-[11px] text-stone-500 italic flex items-center gap-1">
                    <AlertCircle size={12} className="text-amber-700 shrink-0" />
                    <span>
                      Requer Era {building.requiredEra}
                      {building.requiredTech && ` e pesquisa prévia.`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
