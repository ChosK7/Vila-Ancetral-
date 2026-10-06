import React, { useState } from 'react';
import { DailyMission, GameState, JobType } from '../types/game';
import {
  Minus,
  Plus,
  Users,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Lock,
  Sparkles,
  Heart,
  Target,
  Award,
  Flame,
  Wheat,
} from 'lucide-react';
import { audio } from '../utils/audio';

interface TaskAssignmentBarProps {
  gameState: GameState;
  isOpen: boolean;
  onToggle: () => void;
  onAddTaskVillager: (job: JobType) => void;
  onRemoveTaskVillager: (job: JobType) => void;
  onAutoAssignNow: () => void;
  onToggleAutoAssign: () => void;
  onRecruitVillager: () => void;
  onUnlockJob: (job: JobType) => void;
  onClaimMissionReward: (missionId: string) => void;
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

interface TaskItemConfig {
  job: JobType;
  title: string;
  icon: string;
  badge: string;
  description: string;
  productionHint: (rates: any, count: number) => string;
  unlockCondition: string;
  isUnlockedCheck: (state: GameState) => boolean;
  canUnlockNowCheck: (state: GameState) => boolean;
}

export const TaskAssignmentBar: React.FC<TaskAssignmentBarProps> = ({
  gameState,
  isOpen,
  onToggle,
  onAddTaskVillager,
  onRemoveTaskVillager,
  onAutoAssignNow,
  onToggleAutoAssign,
  onRecruitVillager,
  onUnlockJob,
  onClaimMissionReward,
  rates,
}) => {
  const {
    villagers,
    resources,
    buildings,
    autoAssignIdle = true,
    unlockedJobs = ['farmer', 'lumberjack', 'quarryman'],
    villageLevel = 1,
    villageXP = 0,
    xpToNextLevel = 100,
    dailyMissions = [],
    woodConsumedPerTurn = 1,
  } = gameState;

  // Active view inside the 60% window: 'tasks' | 'missions'
  const [activeTab, setActiveTab] = useState<'tasks' | 'missions'>('tasks');

  // Counts per job
  const jobCounts: Record<JobType, number> = {
    idle: 0,
    farmer: 0,
    lumberjack: 0,
    quarryman: 0,
    potter: 0,
    elder: 0,
    guard: 0,
    builder: 0,
  };

  villagers.forEach((v) => {
    jobCounts[v.job] = (jobCounts[v.job] || 0) + 1;
  });

  const idleCount = jobCounts.idle;
  const assignedCount = villagers.length - idleCount;

  // Housing cap
  const housingCap = Object.values(buildings).reduce(
    (acc, b) => acc + (b.housingCap || 0) * b.count,
    0
  );
  const canRecruit = resources.food >= 15 && villagers.length < housingCap;

  // Average Villager Health & Hunger
  const avgHealth =
    villagers.length > 0
      ? Math.round(villagers.reduce((acc, v) => acc + (v.health || 100), 0) / villagers.length)
      : 100;
  const starvingCount = villagers.filter((v) => v.isFed === false).length;

  // Completed missions ready to claim
  const pendingMissionsCount = dailyMissions.filter((m) => m.completed && !m.claimed).length;

  const tasks: TaskItemConfig[] = [
    // 1. Initial Simple Collection: Alimentos
    {
      job: 'farmer',
      title: 'Coletar Alimentos',
      icon: '🌾',
      badge: 'Agricultor',
      description: 'Ceifa trigo no campo para alimentar os aldeões e manter a saúde.',
      productionHint: (r) => `+${r.foodProduced} colheita (Líquido: ${r.foodNet >= 0 ? '+' : ''}${r.foodNet})`,
      unlockCondition: 'Disponível desde o início',
      isUnlockedCheck: () => true,
      canUnlockNowCheck: () => true,
    },
    // 2. Initial Simple Collection: Madeiras
    {
      job: 'lumberjack',
      title: 'Coletar Madeiras',
      icon: '🪵',
      badge: 'Lenhador',
      description: 'Derruba troncos para abrigos, fogueira e ferramentas essenciais.',
      productionHint: (r) => `+${r.wood} madeira/turno`,
      unlockCondition: 'Disponível desde o início',
      isUnlockedCheck: () => true,
      canUnlockNowCheck: () => true,
    },
    // 3. Initial Simple Collection: Pedras
    {
      job: 'quarryman',
      title: 'Coletar Pedras',
      icon: '🪨',
      badge: 'Pedreiro',
      description: 'Extrai blocos de pedra para moradias resistentes e infraestrutura.',
      productionHint: (r) => `+${r.stone} pedra/turno`,
      unlockCondition: 'Disponível desde o início',
      isUnlockedCheck: () => true,
      canUnlockNowCheck: () => true,
    },
    // 4. Advanced: Argila (desbloqueável)
    {
      job: 'potter',
      title: 'Coletar Argila',
      icon: '🧱',
      badge: 'Oleiro',
      description: 'Molda argila das margens fluviais para cerâmicas e tábuas duráveis.',
      productionHint: (r) => `+${r.clay} argila/turno`,
      unlockCondition: 'Requer Nível 2 da Vila OU 15 Conhecimento',
      isUnlockedCheck: (s) => s.unlockedJobs?.includes('potter') || false,
      canUnlockNowCheck: (s) => (s.villageLevel || 1) >= 2 || s.resources.knowledge >= 15,
    },
    // 5. Advanced: Pesquisar Saber (desbloqueável)
    {
      job: 'elder',
      title: 'Pesquisar Saber',
      icon: '📜',
      badge: 'Ancião',
      description: 'Reflete e descobre novas tecnologias para elevar a civilização.',
      productionHint: (r) => `+${r.knowledge} saber/turno`,
      unlockCondition: 'Requer Nível 2 da Vila OU Concluir Missão Inicial',
      isUnlockedCheck: (s) => s.unlockedJobs?.includes('elder') || false,
      canUnlockNowCheck: (s) => (s.villageLevel || 1) >= 2 || s.turn >= 2,
    },
    // 6. Advanced: Construir Obras (desbloqueável)
    {
      job: 'builder',
      title: 'Construir Obras',
      icon: '🔨',
      badge: 'Construtor',
      description: 'Acelera a finalização de habitações, poços e projetos ativos.',
      productionHint: () => 'Acelera obras em andamento',
      unlockCondition: 'Requer Missão "Reserva Madeireira" OU 20 Madeira acumulada',
      isUnlockedCheck: (s) => s.unlockedJobs?.includes('builder') || false,
      canUnlockNowCheck: (s) => s.resources.wood >= 20 || (s.villageLevel || 1) >= 2,
    },
    // 7. Advanced: Guarda & Defesa (desbloqueável)
    {
      job: 'guard',
      title: 'Guarda & Defesa',
      icon: '🛡️',
      badge: 'Defensor',
      description: 'Patrulha os limites da vila contra feras e salteadores.',
      productionHint: (_, count) => `+${count * 15} pontos de defesa`,
      unlockCondition: 'Requer Nível 3 da Vila OU ter 4 Aldeões',
      isUnlockedCheck: (s) => s.unlockedJobs?.includes('guard') || false,
      canUnlockNowCheck: (s) => (s.villageLevel || 1) >= 3 || s.villagers.length >= 4,
    },
  ];

  return (
    <div className="pointer-events-auto">
      {/* Floating Toggle Dock Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => {
            audio.playWood();
            onToggle();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#33261D] font-display font-black text-xs transition-all shadow-lg cursor-pointer ${
            isOpen ? 'bg-[#33261D] text-[#FFFBF5]' : 'bg-[#FFFDF9]/95 text-stone-900 hover:bg-[#F5EAD9]'
          }`}
          title="Abrir painel menor de tarefas e missões (60% da tela)"
        >
          <span className="text-base">📋</span>
          <span>Designar Tarefas</span>
          <span className="bg-[#E5B84B] text-[#2C241E] px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black">
            {assignedCount}/{villagers.length}
          </span>
          {idleCount > 0 && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold animate-pulse">
              💤 {idleCount} Livre{idleCount > 1 ? 's' : ''}
            </span>
          )}
          {pendingMissionsCount > 0 && (
            <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5">
              🎯 {pendingMissionsCount}
            </span>
          )}
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Expanded Task & Mission Window: EXACTLY "uma janela rolavel com 60% da tela total" */}
      {isOpen && (
        <div className="mt-2 bg-[#FDFBF7]/95 backdrop-blur-md border-3 border-[#33261D] rounded-2xl p-3 sm:p-4 shadow-2xl max-w-2xl w-[94vw] sm:w-[580px] mx-auto max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
          {/* Top Window Header: Tabs & Leveling */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b-2 border-stone-200 sticky top-0 bg-[#FDFBF7]/95 backdrop-blur-xs z-10 pt-1">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#EFE4CE] p-1 rounded-xl border border-stone-300">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-[#33261D] text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                📋 Tarefas ({unlockedJobs.length}/{tasks.length})
              </button>
              <button
                onClick={() => setActiveTab('missions')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'missions'
                    ? 'bg-[#33261D] text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <Target size={13} />
                <span>Missões Diárias</span>
                {pendingMissionsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </button>
            </div>

            {/* Village Level & XP Badge */}
            <div className="flex items-center gap-1.5 bg-[#FAF3E7] px-2.5 py-1 rounded-xl border border-amber-300 text-xs">
              <span className="text-amber-800 font-bold">Nível {villageLevel}</span>
              <div className="w-16 h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (villageXP / xpToNextLevel) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-mono text-stone-500 font-bold">
                {villageXP}/{xpToNextLevel} XP
              </span>
            </div>
          </div>

          {/* VITALITY, ALIMENTATION & RESOURCE CONSUMPTION SUMMARY */}
          <div className="my-2.5 p-2 rounded-xl bg-[#FFFBF5] border-2 border-[#33261D]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Health */}
            <div className="flex items-center gap-1.5">
              <Heart size={14} className={avgHealth < 50 ? 'text-red-500 animate-pulse' : 'text-rose-600'} />
              <span className="font-semibold text-stone-700">Vida Média:</span>
              <strong className="font-mono text-stone-900">{avgHealth}/100</strong>
            </div>

            {/* Alimentation / Food Consumption */}
            <div className="flex items-center gap-1.5">
              <Wheat size={14} className="text-amber-700" />
              <span className="font-semibold text-stone-700">Alimentação:</span>
              <strong className={`font-mono ${starvingCount > 0 ? 'text-red-600 font-black' : 'text-emerald-800'}`}>
                {starvingCount > 0 ? `⚠️ ${starvingCount} com fome!` : 'Saciados'}
              </strong>
              <span className="text-[10px] text-stone-500">(-{rates.foodConsumed} 🌾/turno)</span>
            </div>

            {/* Resource Consumption (Campfire wood) */}
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-orange-600" />
              <span className="font-semibold text-stone-700">Fogueira:</span>
              <span className="text-[10px] font-mono text-stone-600">-{woodConsumedPerTurn} 🪵/turno</span>
            </div>
          </div>

          {/* TAB 1: TASKS LIST */}
          {activeTab === 'tasks' && (
            <div>
              {/* Quick Action Bar (Auto-assign & Recruit) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-200">
                <button
                  onClick={onToggleAutoAssign}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-colors ${
                    autoAssignIdle
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                      : 'bg-stone-100 border-stone-300 text-stone-600'
                  }`}
                  title="Aldeões livres são alocados automaticamente na maior necessidade"
                >
                  <Zap size={11} className={autoAssignIdle ? 'text-emerald-700' : 'text-stone-400'} />
                  <span>Auto-alocar Ociosos: <strong>{autoAssignIdle ? 'SIM' : 'NÃO'}</strong></span>
                </button>

                <button
                  onClick={onAutoAssignNow}
                  disabled={idleCount === 0}
                  className="px-2 py-0.5 rounded-lg border border-[#33261D] bg-[#E5B84B] hover:bg-[#D9A036] text-[#2C241E] text-[11px] font-bold disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Sparkles size={11} className="inline mr-1" />
                  Distribuir {idleCount} Ociosos
                </button>

                <button
                  onClick={onRecruitVillager}
                  disabled={!canRecruit}
                  className="px-2 py-0.5 rounded-lg border border-[#33261D] bg-[#4A7C8E] hover:bg-[#3E6777] text-white text-[11px] font-bold disabled:opacity-40 transition-colors cursor-pointer"
                  title="Acolher novo aldeão (+1 trabalhador)"
                >
                  <UserPlus size={11} className="inline mr-1" />
                  + Aldeão (15 🌾)
                </button>
              </div>

              {/* Tasks List */}
              <div className="flex flex-col gap-2">
                {tasks.map((task) => {
                  const count = jobCounts[task.job];
                  const hasIdle = idleCount > 0;
                  const isUnlocked = task.isUnlockedCheck(gameState);
                  const canUnlockNow = task.canUnlockNowCheck(gameState);

                  return (
                    <div
                      key={task.job}
                      className={`p-2 rounded-xl border-2 transition-all flex items-center justify-between gap-2 ${
                        !isUnlocked
                          ? 'border-stone-300 bg-stone-100/80 opacity-75'
                          : count > 0
                          ? 'border-[#33261D] bg-[#FFFDF9] shadow-2xs'
                          : 'border-stone-300 bg-[#FAF7F2]'
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{task.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display font-black text-xs text-stone-900 leading-tight">
                              {task.title}
                            </span>
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-stone-200/80 text-stone-600">
                              {task.badge}
                            </span>
                            {!isUnlocked && (
                              <span className="text-[9px] font-bold text-amber-900 bg-amber-100 px-1 py-0.2 rounded border border-amber-300 flex items-center gap-0.5">
                                <Lock size={9} /> Bloqueado
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-stone-500 truncate max-w-[240px] sm:max-w-xs">
                            {isUnlocked ? task.description : task.unlockCondition}
                          </p>

                          {isUnlocked && (
                            <p className="text-[10px] font-bold text-amber-900">
                              {task.productionHint(rates, count)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Controls or Unlock Button */}
                      <div className="shrink-0">
                        {isUnlocked ? (
                          <div className="flex items-center gap-1.5 bg-[#F5EAD9] p-1 rounded-xl border border-[#33261D]/40">
                            {/* Remove button */}
                            <button
                              onClick={() => {
                                audio.playWood();
                                onRemoveTaskVillager(task.job);
                              }}
                              disabled={count <= 0}
                              className="w-6 h-6 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] hover:bg-red-50 text-stone-800 hover:text-red-700 font-black text-xs flex items-center justify-center disabled:opacity-25 transition-all cursor-pointer"
                              title={`Remover 1 aldeão de ${task.title}`}
                            >
                              <Minus size={12} />
                            </button>

                            {/* Count */}
                            <span className="w-5 text-center font-display font-black text-xs text-stone-900">
                              {count}
                            </span>

                            {/* Add button */}
                            <button
                              onClick={() => {
                                audio.playWood();
                                onAddTaskVillager(task.job);
                              }}
                              disabled={!hasIdle}
                              className="w-6 h-6 rounded-lg border-2 border-[#33261D] bg-[#E5B84B] hover:bg-[#D9A036] active:scale-95 text-[#2C241E] font-black text-xs flex items-center justify-center disabled:opacity-25 transition-all cursor-pointer"
                              title={
                                hasIdle
                                  ? `Designar 1 aldeão para ${task.title}`
                                  : 'Nenhum aldeão livre'
                              }
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              audio.playFanfare();
                              onUnlockJob(task.job);
                            }}
                            disabled={!canUnlockNow}
                            className={`px-2 py-1 rounded-lg border-2 text-[10px] font-display font-black flex items-center gap-1 transition-all ${
                              canUnlockNow
                                ? 'border-[#33261D] bg-[#E5B84B] hover:bg-[#D9A036] text-[#2C241E] cursor-pointer shadow-xs animate-bounce'
                                : 'border-stone-300 bg-stone-200 text-stone-500 opacity-60 cursor-not-allowed'
                            }`}
                            title={
                              canUnlockNow
                                ? 'Requisitos atingidos! Clique para desbloquear esta coleta!'
                                : task.unlockCondition
                            }
                          >
                            <Sparkles size={10} />
                            <span>{canUnlockNow ? 'Desbloquear!' : 'Bloqueado'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DAILY MISSIONS */}
          {activeTab === 'missions' && (
            <div className="flex flex-col gap-2.5">
              <div className="bg-[#FAF3E7] p-2 rounded-xl border border-amber-300 text-xs text-stone-700">
                <p className="font-bold text-amber-900 flex items-center gap-1">
                  <Target size={14} /> Missões da Vila
                </p>
                <p className="text-[11px] text-stone-600">
                  Cumpra objetivos para ganhar XP, subir de nível da vila e desbloquear novas coletas!
                </p>
              </div>

              {dailyMissions.map((mission) => {
                const isReadyToClaim = mission.completed && !mission.claimed;

                return (
                  <div
                    key={mission.id}
                    className={`p-2.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-1.5 ${
                      mission.claimed
                        ? 'border-stone-300 bg-stone-100/80 opacity-60'
                        : isReadyToClaim
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-400'
                        : 'border-[#33261D] bg-[#FFFDF9]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-display font-black text-xs text-stone-900 leading-tight flex items-center gap-1">
                          <span>{mission.title}</span>
                          {mission.claimed && (
                            <span className="text-[9px] font-bold bg-stone-200 text-stone-600 px-1 rounded">
                              ✓ Concluída
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-stone-600 mt-0.5">{mission.description}</p>
                      </div>

                      {/* Claim Button */}
                      {isReadyToClaim ? (
                        <button
                          onClick={() => {
                            audio.playFanfare();
                            onClaimMissionReward(mission.id);
                          }}
                          className="px-2.5 py-1 rounded-lg border-2 border-emerald-700 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black text-xs cursor-pointer shadow-xs animate-pulse"
                        >
                          Coletar!
                        </button>
                      ) : mission.claimed ? (
                        <span className="text-xs text-emerald-700 font-bold">✓ Coletado</span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-stone-400">
                          {Math.min(mission.target, Math.floor(mission.progress))}/{mission.target}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {!mission.claimed && (
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E5B84B] transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (mission.progress / mission.target) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span>Recompensa: <strong className="text-[#78350F]">{mission.rewardText}</strong></span>
                      <span className="font-bold text-emerald-800">+{mission.rewardXP} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
            <span>
              💡 Janela de 60% da tela · Arraste a barra para rolar
            </span>
            <button
              onClick={onToggle}
              className="font-bold text-stone-700 hover:text-stone-900 underline cursor-pointer"
            >
              Recolher ▲
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
