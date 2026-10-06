import React from 'react';
import { GameState, Technology } from '../types/game';
import { BookOpen, Check, Lock, Sparkles, X, ChevronRight, Award } from 'lucide-react';
import { ERAS_INFO } from '../data/initialData';
import { audio } from '../utils/audio';

interface TechTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onResearchTech: (techId: string) => void;
}

export const TechTreeModal: React.FC<TechTreeModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onResearchTech,
}) => {
  if (!isOpen) return null;

  const { technologies, resources, currentEra } = gameState;
  const techList = Object.values(technologies);

  const canResearch = (tech: Technology) => {
    if (tech.unlocked) return false;
    if (resources.knowledge < tech.cost) return false;
    // Check prerequisites
    const prereqsMet = tech.prerequisites.every((prereqId) => technologies[prereqId]?.unlocked);
    if (!prereqsMet) return false;
    return true;
  };

  const isPrereqsMet = (tech: Technology) => {
    return tech.prerequisites.every((prereqId) => technologies[prereqId]?.unlocked);
  };

  const eraGroups = [1, 2, 3, 4].map((eraNum) => ({
    eraInfo: ERAS_INFO[eraNum],
    techs: techList.filter((t) => t.era === eraNum),
    isCurrentOrPast: eraNum <= currentEra,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-[#FAF3E7] border-4 border-[#33261D] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#EFE4CE] border-b-3 border-[#33261D] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E5B84B] border-2 border-[#33261D] flex items-center justify-center shadow-xs">
              <BookOpen className="text-[#33261D]" size={22} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-[#2B241E] leading-tight">
                Árvore de Pesquisa Tecnológica
              </h2>
              <p className="text-xs text-stone-600 font-medium">
                Gere Conhecimento designando Anciãos na aldeia para desbloquear avanços ancestrais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Knowledge points in stock */}
            <div className="bg-[#FFFDF9] border-2 border-[#33261D] px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-2">
              <span className="text-sm">📜</span>
              <span className="text-xs font-bold text-stone-600">Conhecimento:</span>
              <span className="font-display font-extrabold text-base text-purple-900">
                {Math.floor(resources.knowledge)} pts
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border-2 border-[#33261D] bg-[#FFFDF9] hover:bg-stone-200 text-stone-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tech Tree Flow / Columns by Era */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {eraGroups.map(({ eraInfo, techs, isCurrentOrPast }) => {
            const unlockedInThisEra = techs.filter((t) => t.unlocked).length;
            const allUnlockedInEra = unlockedInThisEra === techs.length;

            return (
              <div
                key={eraInfo.id}
                className={`border-3 rounded-2xl p-4 transition-all ${
                  isCurrentOrPast
                    ? 'bg-[#FFFDF9] border-[#33261D] shadow-sm'
                    : 'bg-stone-200/50 border-stone-300 opacity-60'
                }`}
              >
                {/* Era Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-stone-200 pb-2.5 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-lg text-[#78350F]">
                      {eraInfo.name}
                    </span>
                    <span className="text-xs font-bold font-hand text-stone-600">
                      ({eraInfo.subtitle})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-stone-600">
                      Progresso da Era: {unlockedInThisEra}/{techs.length}
                    </span>
                    {allUnlockedInEra && (
                      <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full text-[11px]">
                        <Award size={12} /> Dominada
                      </span>
                    )}
                  </div>
                </div>

                {/* Tech Cards in Era */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {techs.map((tech) => {
                    const affordable = canResearch(tech);
                    const prereqsMet = isPrereqsMet(tech);

                    return (
                      <div
                        key={tech.id}
                        className={`border-2 rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                          tech.unlocked
                            ? 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                            : affordable
                            ? 'bg-[#FFFBF5] border-amber-500 shadow-sm ring-2 ring-amber-300/60'
                            : prereqsMet
                            ? 'bg-[#FFFDF9] border-[#33261D]/40'
                            : 'bg-stone-100 border-stone-300 opacity-70'
                        }`}
                      >
                        <div>
                          {/* Card Title & Icon */}
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{tech.icon}</span>
                              <h4 className="font-hand font-bold text-base text-stone-900 leading-tight">
                                {tech.name}
                              </h4>
                            </div>

                            {tech.unlocked && (
                              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check size={14} />
                              </span>
                            )}
                            {!tech.unlocked && !prereqsMet && (
                              <span className="w-6 h-6 rounded-full bg-stone-300 text-stone-600 flex items-center justify-center shrink-0">
                                <Lock size={12} />
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-stone-600 leading-relaxed mb-2 font-normal">
                            {tech.description}
                          </p>

                          {/* Effect Banner */}
                          <div className="bg-[#F8EFE2] rounded-lg p-1.5 border border-[#33261D]/15 mb-3">
                            <p className="text-[11px] font-bold text-amber-900 flex items-start gap-1">
                              <Sparkles size={12} className="text-amber-600 shrink-0 mt-0.5" />
                              <span>{tech.effectDescription}</span>
                            </p>
                          </div>
                        </div>

                        {/* Action / Cost */}
                        <div className="border-t border-stone-200 pt-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                            📜 {tech.cost} Conhecimento
                          </span>

                          {!tech.unlocked && (
                            <button
                              onClick={() => {
                                audio.playTech();
                                onResearchTech(tech.id);
                              }}
                              disabled={!affordable}
                              className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold flex items-center gap-1 transition-all ${
                                affordable
                                  ? 'bg-[#E5B84B] border-[#33261D] text-[#2C241E] hover:bg-[#D9A036] hover:scale-105 cursor-pointer shadow-xs'
                                  : 'bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed'
                              }`}
                            >
                              <span>Descobrir</span>
                              <ChevronRight size={14} />
                            </button>
                          )}

                          {tech.unlocked && (
                            <span className="text-xs font-bold text-emerald-700 italic">
                              Descoberta
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="bg-[#EFE4CE] border-t-2 border-[#33261D] px-6 py-3 flex items-center justify-between text-xs text-stone-700 font-medium">
          <span>
            💡 Dica: Ao pesquisar todas as tecnologias de uma Era, a civilização avança e novas construções surgem!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border-2 border-[#33261D] bg-[#FFFDF9] font-bold text-stone-900 hover:bg-stone-100"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
