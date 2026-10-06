import React from 'react';
import { TurnReport } from '../types/game';
import { Check, AlertTriangle, ArrowRight, Sparkles, Building2, TrendingUp } from 'lucide-react';

interface TurnReportModalProps {
  report: TurnReport | null;
  onClose: () => void;
}

export const TurnReportModal: React.FC<TurnReportModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const isStarving = report.foodConsumed > report.foodProduced && report.foodProduced === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF3E7] border-4 border-[#33261D] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner Header */}
        <div className="bg-[#EFE4CE] border-b-3 border-[#33261D] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📜</span>
            <div>
              <h3 className="font-display font-extrabold text-lg text-[#2B241E] leading-tight">
                Relatório da Estação
              </h3>
              <p className="text-xs text-stone-600 font-bold font-hand">
                {report.season} do Ano {report.year} (Turno {report.turn})
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Starvation or Harvest Alert */}
          {report.foodConsumed > (report.foodProduced + 10) && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="text-amber-700 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Atenção ao estoque de trigo:</span> Sua população consumiu mais grãos do que colheu nesta estação. Certifique-se de manter agricultores suficientes!
              </div>
            </div>
          )}

          {/* Resources balance breakdown */}
          <div className="bg-[#FFFDF9] border-2 border-[#33261D]/30 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} /> Balanço de Recursos Deste Turno
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Food */}
              <div className="bg-[#F8EFE2] rounded-lg p-2 border border-stone-200">
                <div className="flex items-center justify-between font-bold text-stone-800">
                  <span>🌾 Trigo Colhido</span>
                  <span className="text-emerald-700">+{report.foodProduced}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                  <span>Consumido (Alimentação)</span>
                  <span className="text-red-600 font-bold">-{report.foodConsumed}</span>
                </div>
              </div>

              {/* Wood */}
              <div className="bg-[#F8EFE2] rounded-lg p-2 border border-stone-200 flex items-center justify-between font-bold text-stone-800">
                <span>🪵 Madeira Obtida</span>
                <span className="text-emerald-700">+{report.woodProduced}</span>
              </div>

              {/* Stone */}
              <div className="bg-[#F8EFE2] rounded-lg p-2 border border-stone-200 flex items-center justify-between font-bold text-stone-800">
                <span>🪨 Pedra Extraída</span>
                <span className="text-emerald-700">+{report.stoneProduced}</span>
              </div>

              {/* Clay */}
              <div className="bg-[#F8EFE2] rounded-lg p-2 border border-stone-200 flex items-center justify-between font-bold text-stone-800">
                <span>🧱 Argila Moldada</span>
                <span className="text-emerald-700">+{report.clayProduced}</span>
              </div>
            </div>

            {/* Knowledge */}
            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200 flex items-center justify-between text-xs font-bold text-purple-900">
              <span className="flex items-center gap-1">📜 Saber Ancestral Gerado</span>
              <span className="text-purple-700">+{report.knowledgeProduced} pts</span>
            </div>
          </div>

          {/* Completed Buildings */}
          {report.completedBuildings.length > 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3.5 space-y-1.5">
              <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" />
                Novas Obras Concluídas na Vila!
              </h5>
              <ul className="text-xs text-emerald-800 list-disc list-inside font-medium space-y-0.5">
                {report.completedBuildings.map((bName, idx) => (
                  <li key={idx} className="font-bold">{bName}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Event note if any */}
          {report.eventNote && (
            <div className="text-xs text-stone-600 italic bg-[#EFE4CE]/60 p-2.5 rounded-xl border border-stone-300">
              {report.eventNote}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="bg-[#EFE4CE] border-t-2 border-[#33261D] px-6 py-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl border-2 border-[#33261D] bg-[#E5B84B] font-bold text-sm text-[#2C241E] hover:bg-[#D9A036] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Continuar Expandindo</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
