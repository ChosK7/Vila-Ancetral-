import React, { useState } from 'react';
import { GameState, JobType, Villager } from '../types/game';
import { UserPlus, UserCheck, Heart, Award, ArrowRight } from 'lucide-react';
import { audio } from '../utils/audio';

interface VillagerManagementProps {
  gameState: GameState;
  onAssignJob: (villagerId: string, newJob: JobType) => void;
  onRecruitVillager: () => void;
  onBulkAssign: (job: JobType, delta: number) => void;
}

const JOBS_CONFIG: {
  id: JobType;
  label: string;
  icon: string;
  desc: string;
  color: string;
  unlockedEra: number;
}[] = [
  { id: 'farmer', label: 'Agricultor', icon: '🌾', desc: 'Ceifa trigo nas lavouras (+6 Trigo)', color: 'bg-amber-100 border-amber-400 text-amber-900', unlockedEra: 1 },
  { id: 'lumberjack', label: 'Lenhador', icon: '🪵', desc: 'Derruba troncos nas margens (+5 Madeira)', color: 'bg-emerald-100 border-emerald-400 text-emerald-900', unlockedEra: 1 },
  { id: 'quarryman', label: 'Pedreiro', icon: '🪨', desc: 'Extrai pedras de campo e calcário (+4 Pedra)', color: 'bg-stone-200 border-stone-400 text-stone-900', unlockedEra: 1 },
  { id: 'potter', label: 'Oleiro', icon: '🧱', desc: 'Coleta argila e molda tijolos (+4 Argila)', color: 'bg-orange-100 border-orange-400 text-orange-900', unlockedEra: 2 },
  { id: 'elder', label: 'Ancião', icon: '📜', desc: 'Estuda estrelas e grava tábuas (+3 Saber)', color: 'bg-purple-100 border-purple-400 text-purple-900', unlockedEra: 1 },
  { id: 'guard', label: 'Guarda', icon: '🛡️', desc: 'Vigia os celeiros com lança (+15 Defesa)', color: 'bg-blue-100 border-blue-400 text-blue-900', unlockedEra: 2 },
  { id: 'builder', label: 'Construtor', icon: '🏗️', desc: 'Acelera obras civis e monumentos', color: 'bg-yellow-100 border-yellow-500 text-yellow-900', unlockedEra: 1 },
  { id: 'idle', label: 'Descansando', icon: '💤', desc: 'Sem tarefa designada', color: 'bg-gray-100 border-gray-300 text-gray-700', unlockedEra: 1 },
];

export const VillagerManagement: React.FC<VillagerManagementProps> = ({
  gameState,
  onAssignJob,
  onRecruitVillager,
  onBulkAssign,
}) => {
  const { villagers, resources, buildings, currentEra } = gameState;
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');

  const housingCap = Object.values(buildings).reduce(
    (acc, b) => acc + (b.housingCap || 0) * b.count,
    0
  );

  const canRecruit = villagers.length < housingCap && resources.food >= 15;
  const recruitCost = 15;

  const filteredVillagers = selectedJobFilter === 'all'
    ? villagers
    : villagers.filter((v) => v.job === selectedJobFilter);

  return (
    <div className="bg-[#FFFDF9] border-3 border-[#33261D] rounded-2xl p-4 shadow-md flex flex-col gap-4">
      {/* Header & Recruitment Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-[#33261D]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-lg text-[#2B241E]">
              Aldeões & Divisão de Tarefas
            </h2>
            <span className="bg-[#EFE4CE] border border-[#33261D] text-[#33261D] text-xs font-bold px-2 py-0.5 rounded-full font-hand">
              {villagers.length} de {housingCap} Cidadãos
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            Distribua seus trabalhadores estrategicamente para colher, construir e pesquisar.
          </p>
        </div>

        {/* Recruitment Button */}
        <button
          onClick={onRecruitVillager}
          disabled={!canRecruit}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 font-bold text-xs transition-all shadow-sm ${
            canRecruit
              ? 'bg-[#E5B84B] border-[#33261D] text-[#2C241E] hover:bg-[#D9A036] hover:scale-[1.02] cursor-pointer'
              : 'bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed'
          }`}
        >
          <UserPlus size={16} />
          <span>Acolher Viajante</span>
          <span className="bg-[#33261D]/10 px-1.5 py-0.5 rounded text-[10px]">
            🌾 {recruitCost} Trigo
          </span>
        </button>
      </div>

      {/* Quick Job Distribution Bar (+ / - counters) */}
      <div className="bg-[#F8EFE2] border-2 border-[#33261D]/30 rounded-xl p-2.5">
        <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Distribuição Rápida de Funções</span>
          <span className="font-hand text-stone-500 normal-case font-bold text-xs">
            {villagers.filter((v) => v.job === 'idle').length} ociosos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {JOBS_CONFIG.filter((j) => j.id !== 'idle' && j.unlockedEra <= currentEra).map((job) => {
            const count = villagers.filter((v) => v.job === job.id).length;
            const hasIdle = villagers.some((v) => v.job === 'idle');

            return (
              <div
                key={job.id}
                className="bg-[#FFFDF9] border border-[#33261D]/40 rounded-lg p-2 flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{job.icon}</span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-stone-800 truncate leading-tight">
                      {job.label}
                    </p>
                    <p className="text-[10px] text-stone-500 font-bold">{count} ativos</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-200">
                  <button
                    onClick={() => {
                      audio.playWood();
                      onBulkAssign(job.id, -1);
                    }}
                    disabled={count === 0}
                    className="w-6 h-6 rounded border border-stone-400 bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={`Remover 1 ${job.label}`}
                  >
                    -
                  </button>
                  <span className="font-display font-extrabold text-xs text-stone-900">
                    {count}
                  </span>
                  <button
                    onClick={() => {
                      audio.playWood();
                      onBulkAssign(job.id, 1);
                    }}
                    disabled={!hasIdle}
                    className="w-6 h-6 rounded border border-stone-400 bg-[#E5B84B] text-stone-900 font-bold text-xs flex items-center justify-center hover:bg-[#D9A036] disabled:opacity-40 disabled:cursor-not-allowed"
                    title={`Adicionar 1 ${job.label}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Villagers List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-stone-700">Lista Nominal de Aldeões</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-stone-500">Filtrar:</span>
            <select
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
              className="text-xs font-medium bg-[#FFFBF5] border border-stone-400 rounded px-2 py-0.5 text-stone-800"
            >
              <option value="all">Todos ({villagers.length})</option>
              {JOBS_CONFIG.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.icon} {j.label} ({villagers.filter((v) => v.job === j.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
          {filteredVillagers.map((vil) => {
            const currentJobConfig = JOBS_CONFIG.find((j) => j.id === vil.job) || JOBS_CONFIG[0];

            return (
              <div
                key={vil.id}
                className="bg-[#FFFDF9] border-2 border-[#33261D]/30 rounded-xl p-2.5 hover:border-[#33261D] transition-colors flex items-center justify-between gap-2"
              >
                {/* Avatar & Info */}
                <div className="flex items-center gap-2.5">
                  {/* Miniature Stickman Avatar */}
                  <div
                    className="w-9 h-9 rounded-full border-2 border-[#33261D] flex items-center justify-center relative shrink-0 shadow-xs"
                    style={{ backgroundColor: vil.tunicColor }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white border border-[#33261D] -mt-1.5 flex items-center justify-center">
                      <div className="w-1 h-1 bg-[#1F1B18] rounded-full -ml-0.5"></div>
                      <div className="w-1 h-1 bg-[#1F1B18] rounded-full ml-0.5"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-hand font-bold text-sm text-stone-900 leading-tight">
                        {vil.name}
                      </h4>
                      <span className="text-[10px] text-stone-400">
                        {vil.gender === 'male' ? '♂' : '♀'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                      <span className="flex items-center gap-0.5 text-emerald-700 font-bold">
                        <Heart size={10} className="fill-emerald-500 text-emerald-600" />
                        {vil.morale}%
                      </span>
                      <span>·</span>
                      <span className="truncate max-w-[140px] text-stone-600 font-medium" title={vil.trait.description}>
                        ✨ {vil.trait.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Job Selector Dropdown */}
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={vil.job}
                    onChange={(e) => {
                      audio.playWood();
                      onAssignJob(vil.id, e.target.value as JobType);
                    }}
                    className={`text-xs font-bold border-2 rounded-lg px-2 py-1 cursor-pointer transition-colors ${currentJobConfig.color}`}
                  >
                    {JOBS_CONFIG.filter((j) => j.unlockedEra <= currentEra).map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.icon} {job.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
