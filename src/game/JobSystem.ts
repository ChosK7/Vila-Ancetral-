import { GameState, JobType, Villager } from '../types/game';
import { ResourceRates } from './ResourceSystem';

/**
 * Conta o número de aldeões alocados em cada ofício/trabalho.
 */
export function countVillagersByJob(villagers: Villager[]): Record<JobType, number> {
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
  return jobCounts;
}

/**
 * Distribui automaticamente aldeões ociosos para as tarefas prioritárias da aldeia:
 * 1. Segurança alimentar (se comida baixa ou produção negativa)
 * 2. Madeira para abrigos e fogueira
 * 3. Pedra para alvenaria
 * 4. Obras em andamento
 * 5. Argila se olaria desbloqueada
 * 6. Ancião para geração de conhecimento
 * 7. Balanceamento geral
 */
export function autoAssignIdleVillagers(
  currentVillagers: Villager[],
  currentState: Pick<GameState, 'resources' | 'buildings' | 'technologies'>,
  currentRates: ResourceRates
): Villager[] {
  const idleCount = currentVillagers.filter((v) => v.job === 'idle').length;
  if (idleCount === 0) return currentVillagers;

  const jobCounts = countVillagersByJob(currentVillagers);

  const hasActiveConstruction = Object.values(currentState.buildings).some(
    (b) => b.constructionTurnsLeft > 0
  );
  const hasPottery = !!currentState.technologies.primitive_pottery?.unlocked;

  const getJobForNextIdle = (): JobType => {
    // 1. Segurança alimentar: se comida <= 18 ou saldo líquido negativo ou sem agricultores
    if (
      currentState.resources.food <= 18 ||
      currentRates.foodNet < 0 ||
      jobCounts.farmer < 1
    ) {
      jobCounts.farmer++;
      return 'farmer';
    }
    // 2. Madeira para abrigos, ferramentas e expansão
    if (currentState.resources.wood < 25 && jobCounts.lumberjack < 2) {
      jobCounts.lumberjack++;
      return 'lumberjack';
    }
    // 3. Pedra para construções de alvenaria
    if (currentState.resources.stone < 15 && jobCounts.quarryman < 2) {
      jobCounts.quarryman++;
      return 'quarryman';
    }
    // 4. Construções ativas em andamento
    if (hasActiveConstruction && jobCounts.builder < 2) {
      jobCounts.builder++;
      return 'builder';
    }
    // 5. Argila se cerâmica estiver desbloqueada e estoque baixo
    if (hasPottery && currentState.resources.clay < 15 && jobCounts.potter < 1) {
      jobCounts.potter++;
      return 'potter';
    }
    // 6. Ancião para pontos de pesquisa
    if (jobCounts.elder < 1) {
      jobCounts.elder++;
      return 'elder';
    }
    // 7. Balanceamento geral entre alimento, madeira e pedra
    if (jobCounts.farmer <= jobCounts.lumberjack && jobCounts.farmer <= jobCounts.quarryman) {
      jobCounts.farmer++;
      return 'farmer';
    }
    if (jobCounts.lumberjack <= jobCounts.quarryman) {
      jobCounts.lumberjack++;
      return 'lumberjack';
    }
    jobCounts.quarryman++;
    return 'quarryman';
  };

  return currentVillagers.map((v) => {
    if (v.job === 'idle') {
      const assignedJob = getJobForNextIdle();
      return { ...v, job: assignedJob };
    }
    return v;
  });
}

/**
 * Atribui 1 aldeão ocioso para a tarefa informada.
 */
export function assignVillagerToJob(villagers: Villager[], job: JobType): Villager[] {
  const idleIdx = villagers.findIndex((v) => v.job === 'idle');
  if (idleIdx === -1) return villagers;

  const updated = [...villagers];
  updated[idleIdx] = { ...updated[idleIdx], job };
  return updated;
}

/**
 * Remove 1 aldeão da tarefa informada, tornando-o ocioso (idle).
 */
export function unassignVillagerFromJob(villagers: Villager[], job: JobType): Villager[] {
  const jobIdx = villagers.findIndex((v) => v.job === job);
  if (jobIdx === -1) return villagers;

  const updated = [...villagers];
  updated[jobIdx] = { ...updated[jobIdx], job: 'idle' };
  return updated;
}
