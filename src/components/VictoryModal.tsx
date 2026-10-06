import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { audio } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  year: number;
  villagersCount: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  year,
  villagersCount,
}) => {
  useEffect(() => {
    if (isOpen) {
      audio.playTech();
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E5B84B', '#CA8A04', '#78350F', '#4A7C8E'],
        });
      } catch (e) {
        // ignore if canvas-confetti fails
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in zoom-in-95">
      <div className="relative w-full max-w-lg bg-[#FAF3E7] border-4 border-[#33261D] rounded-3xl shadow-2xl overflow-hidden text-center p-6 space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-[#E5B84B] border-3 border-[#33261D] mx-auto flex items-center justify-center shadow-md">
          <Trophy size={32} className="text-[#33261D]" />
        </div>

        <div>
          <span className="text-xs font-bold font-hand text-amber-800 uppercase tracking-widest">
            Apoteose da Civilização
          </span>
          <h2 className="font-display font-black text-2xl text-[#2B241E] mt-1">
            O Grande Zigurate Foi Erguido!
          </h2>
          <p className="text-xs text-stone-600 font-medium mt-2 leading-relaxed">
            Começando com apenas dois humildes aldeões colhendo trigo sob o sol, sua visão transformou um acampamento neolítico em uma metrópole gloriosa que desafia os milênios!
          </p>
        </div>

        <div className="bg-[#FFFDF9] border-2 border-[#33261D]/20 rounded-2xl p-4 flex justify-around text-center">
          <div>
            <p className="text-[10px] text-stone-500 font-bold uppercase">Tempo Decorrido</p>
            <p className="font-display font-extrabold text-lg text-stone-900">{year} Anos</p>
          </div>
          <div className="border-r border-stone-200"></div>
          <div>
            <p className="text-[10px] text-stone-500 font-bold uppercase">Cidadãos Prósperos</p>
            <p className="font-display font-extrabold text-lg text-stone-900">{villagersCount} Aldeões</p>
          </div>
          <div className="border-r border-stone-200"></div>
          <div>
            <p className="text-[10px] text-stone-500 font-bold uppercase">Patrimônio</p>
            <p className="font-display font-extrabold text-lg text-amber-700">Imortal</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onRestart}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-[#33261D] bg-[#FFFDF9] font-bold text-xs text-stone-800 hover:bg-stone-100 flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>Iniciar Nova Vila</span>
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-[#33261D] bg-[#E5B84B] font-bold text-xs text-[#2C241E] hover:bg-[#D9A036] shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>Continuar Governando</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
