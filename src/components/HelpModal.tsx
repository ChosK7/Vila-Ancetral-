import React from 'react';
import { X, BookOpen, Users, Hammer, Shield, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#FAF3E7] border-4 border-[#33261D] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#EFE4CE] border-b-3 border-[#33261D] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="text-stone-800" size={22} />
            <h3 className="font-display font-extrabold text-lg text-[#2B241E]">
              Guia da Vila Ancestral
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl border-2 border-[#33261D] bg-[#FFFDF9] hover:bg-stone-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed font-normal">
          <div className="bg-[#FFFDF9] border-2 border-[#33261D]/20 rounded-xl p-3.5 space-y-2">
            <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              🌾 1. O Ciclo dos Turnos e a Alimentação
            </h4>
            <p>
              O jogo é dividido em turnos sazonais (Primavera, Verão, Outono, Inverno). A cada turno que você avança:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Cada aldeão ativo consome <strong>1 unidade de Trigo</strong>. Se a comida acabar, a moral despenca e há perigo de fome!</li>
              <li>Designar mais agricultores garante excedentes para sustentar novos trabalhadores.</li>
            </ul>
          </div>

          <div className="bg-[#FFFDF9] border-2 border-[#33261D]/20 rounded-xl p-3.5 space-y-2">
            <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <Users size={16} className="text-amber-800" /> 2. Recrutamento e Moradias
            </h4>
            <p>
              Você começa com <strong>apenas 2 aldeões</strong>. Para recrutar novos braços para a colheita e obras:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Construa <strong>Cabanas de Palha</strong> ou <strong>Casas Circulares de Pedra</strong> para aumentar a capacidade máxima de habitantes.</li>
              <li>Use o botão <em>"Acolher Viajante"</em> (custa 15 de trigo) ou aguarde famílias nômades chegarem em eventos.</li>
            </ul>
          </div>

          <div className="bg-[#FFFDF9] border-2 border-[#33261D]/20 rounded-xl p-3.5 space-y-2">
            <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <Sparkles size={16} className="text-purple-700" /> 3. Árvore Tecnológica & Evolução das Eras
            </h4>
            <p>
              Designe aldeões como <strong>Anciãos</strong> para acumular pontos de Saber. Com eles, você desbloqueia:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><strong>Foices Curvas & Moagem:</strong> Aumentam a colheita e reduzem consumo.</li>
              <li><strong>Alvenaria Circular & Poços:</strong> Permitem construções de pedra perenes.</li>
              <li><strong>Tábuas de Argila & Divisão do Trabalho:</strong> Criam a Casa Longa e especializações formais.</li>
              <li><strong>Polias & O Grande Zigurate:</strong> O ápice da civilização mesopotâmica antiga!</li>
            </ul>
          </div>

          <div className="bg-[#FFFDF9] border-2 border-[#33261D]/20 rounded-xl p-3.5 space-y-2">
            <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <Shield size={16} className="text-blue-700" /> 4. Defesa da Aldeia
            </h4>
            <p>
              Lobos e saqueadores podem tentar pilhar seus celeiros. Mantenha <strong>Guardas</strong> com lanças e construa <strong>Muralhas de Pedra</strong> para garantir a segurança da comunidade.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#EFE4CE] border-t-2 border-[#33261D] px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl border-2 border-[#33261D] bg-[#E5B84B] font-bold text-xs text-[#2C241E] hover:bg-[#D9A036]"
          >
            Entendido, vamos prosperar!
          </button>
        </div>
      </div>
    </div>
  );
};
