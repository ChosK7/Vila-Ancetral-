import { DailyMission, GameEvent, GameState, Resources, TurnReport } from '../types/game';
import { ERAS_INFO, RANDOM_EVENTS } from '../data/initialData';
import { applyDailyResourceProduction, ResourceRates } from './ResourceSystem';
import { autoAssignIdleVillagers } from './JobSystem';
import { advanceBuildingsConstruction, calculateStorageCaps } from './BuildingSystem';

export interface AdvanceDayResult {
  nextState: GameState;
  shouldPlayAlert: boolean;
  completedBuildings: string[];
}

/**
 * Atualiza o progresso das missões diárias com base no novo saldo de recursos e população.
 */
export function updateDailyMissionsProgress(
  missions: DailyMission[],
  resources: Resources,
  villagersCount: number
): DailyMission[] {
  return (missions || []).map((m) => {
    if (m.claimed) return m;
    let curProgress = m.progress;
    if (m.category === 'food') curProgress = Math.max(curProgress, resources.food);
    if (m.category === 'wood') curProgress = Math.max(curProgress, resources.wood);
    if (m.category === 'stone') curProgress = Math.max(curProgress, resources.stone);
    if (m.category === 'knowledge') curProgress = Math.max(curProgress, resources.knowledge);
    if (m.category === 'villagers') curProgress = Math.max(curProgress, villagersCount);

    return {
      ...m,
      progress: curProgress,
      completed: curProgress >= m.target,
    };
  });
}

/**
 * Função principal de simulação de avanço de um dia/turno completo.
 * Coordena ResourceSystem, BuildingSystem e JobSystem.
 */
export function advanceSimulationDay(
  prevState: GameState,
  remainingHour: number,
  rates: ResourceRates
): AdvanceDayResult {
  const nextTurn = prevState.turn + 1;
  const nextSeasonIdx = (prevState.seasonIndex + 1) % 4;
  const nextYear = nextSeasonIdx === 0 ? prevState.year + 1 : prevState.year;
  const seasons = ['Primavera', 'Verão', 'Outono', 'Inverno'] as const;
  const currentSeasonName = seasons[prevState.seasonIndex];

  // 1. BuildingSystem: Avança obras e recalcula limites de armazenamento
  const buildersCount = prevState.villagers.filter((v) => v.job === 'builder').length;
  const { updatedBuildings, completedBuildings } = advanceBuildingsConstruction(
    prevState.buildings,
    buildersCount
  );
  const maxStorage = calculateStorageCaps(updatedBuildings);

  // 2. ResourceSystem: Aplica produção diária de recursos e aquecimento
  const isWinter = nextSeasonIdx === 3;
  const { newResources, eventNote: woodNote } = applyDailyResourceProduction(
    prevState.resources,
    rates,
    maxStorage,
    isWinter
  );

  // 3. Atualiza progresso das missões diárias
  const updatedMissions = updateDailyMissionsProgress(
    prevState.dailyMissions,
    newResources,
    prevState.villagers.length
  );

  // 4. JobSystem: Distribui aldeões ociosos se auto-assign estiver ativado
  let updatedVillagers = [...prevState.villagers];
  if (prevState.autoAssignIdle !== false) {
    updatedVillagers = autoAssignIdleVillagers(updatedVillagers, prevState, rates);
  }

  // 5. Verifica avanço de Era civilizatória
  let nextEra = prevState.currentEra;
  const unlockedCount = Object.values(prevState.technologies).filter(
    (t) => t.era === prevState.currentEra && t.unlocked
  ).length;

  let eraNote = '';
  if (unlockedCount >= 3 && nextEra < 4) {
    nextEra += 1;
    eraNote = `🌟 Sua civilização evoluiu para a ${ERAS_INFO[nextEra].name}!`;
  }

  // 6. Condição de vitória por monumento (Zigurate)
  let gameWon = prevState.gameWon;
  if (updatedBuildings.ziggurat && updatedBuildings.ziggurat.count > 0 && !gameWon) {
    gameWon = true;
  }

  // 7. Sorteio de evento aleatório a cada 3 turnos
  let activeEvent: GameEvent | null = prevState.activeEvent;
  let shouldPlayAlert = false;
  if (!activeEvent && nextTurn % 3 === 0 && Math.random() > 0.3) {
    const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    activeEvent = ev;
    shouldPlayAlert = true;
  }

  const combinedNote = [woodNote, eraNote].filter(Boolean).join(' ');

  // 8. Relatório da estação/turno
  const report: TurnReport = {
    turn: prevState.turn,
    year: prevState.year,
    season: currentSeasonName,
    foodProduced: rates.foodProduced,
    foodConsumed: rates.foodConsumed,
    woodProduced: rates.wood,
    stoneProduced: rates.stone,
    clayProduced: rates.clay,
    knowledgeProduced: rates.knowledge,
    completedBuildings,
    populationChange: 0,
    eventNote: combinedNote || undefined,
  };

  const nextState: GameState = {
    ...prevState,
    gameHour: remainingHour,
    turn: nextTurn,
    year: nextYear,
    seasonIndex: nextSeasonIdx,
    currentEra: nextEra,
    resources: newResources,
    maxStorage,
    buildings: updatedBuildings,
    villagers: updatedVillagers,
    dailyMissions: updatedMissions,
    activeEvent,
    lastTurnReport: report,
    gameWon,
  };

  return {
    nextState,
    shouldPlayAlert,
    completedBuildings,
  };
}
