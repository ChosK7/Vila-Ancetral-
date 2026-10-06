import React from 'react';
import { GameEvent, GameState } from '../types/game';
import { Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { audio } from '../utils/audio';

interface EventModalProps {
  event: GameEvent | null;
  gameState: GameState;
  onResolveOption: (optionIndex: number) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  gameState,
  onResolveOption,
}) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF3E7] border-4 border-[#33261D] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner Header */}
        <div className="bg-[#EFE4CE] border-b-3 border-[#33261D] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {event.imageTheme === 'rain' && '🌧️'}
              {event.imageTheme === 'wanderers' && '🚶‍♂️'}
              {event.imageTheme === 'harvest' && '🌾'}
              {event.imageTheme === 'scout' && '🐺'}
            </span>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-800">
                Acontecimento Histórico
              </span>
              <h3 className="font-display font-extrabold text-lg text-[#2B241E] leading-tight">
                {event.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Narrative Description */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-700 leading-relaxed font-normal bg-[#FFFDF9] p-3.5 rounded-2xl border-2 border-[#33261D]/20">
            {event.description}
          </p>

          {/* Options choices */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Escolha a conduta da sua aldeia:
            </h4>

            {event.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => {
                  audio.playWood();
                  onResolveOption(idx);
                }}
                className="w-full text-left p-3.5 rounded-xl border-2 border-[#33261D]/40 bg-[#FFFDF9] hover:bg-[#FDF6E8] hover:border-[#33261D] hover:scale-[1.01] transition-all flex flex-col gap-1 cursor-pointer shadow-xs group"
              >
                <div className="flex items-center justify-between font-bold text-xs text-stone-900 group-hover:text-amber-900">
                  <span className="font-hand text-base">{option.text}</span>
                  <ArrowRight size={14} className="text-stone-400 group-hover:text-amber-800 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 inline-block self-start">
                  Efeito: {option.effectText}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
