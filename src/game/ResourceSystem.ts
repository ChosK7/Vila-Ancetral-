import { GameState, Resources, Villager } from '../types/game';

export interface ResourceRates {
  foodNet: number;
  foodProduced: number;
  foodConsumed: number;
  wood: number;
  stone: number;
  clay: number;
  knowledge: number;
}

/**
 * Calcula a taxa de produção e consumo de todos os recursos com base nos
 * aldeões, tecnologias desbloqueadas, edifícios construídos e estação do ano.
 */
export function calculateProductionRates(
  state: Pick<GameState, 'villagers' | 'buildings' | 'technologies' | 'seasonIndex'>
): ResourceRates {
  const { villagers, buildings, technologies, seasonIndex } = state;
  const seasons = ['Primavera', 'Verão', 'Outono', 'Inverno'] as const;
  const season = seasons[seasonIndex] || 'Primavera';

  const sicklesBonus = technologies.curved_sickles?.unlocked ? 0.35 : 0;
  const wellBonus = (buildings.village_well?.count || 0) > 0 ? 0.25 : 0;
  const grindingBonus = (buildings.grain_grinding?.count || 0) > 0 ? 0.2 : 0;
  const longhouseBonus = (buildings.longhouse?.count || 0) > 0 ? 1 : 0;
  const schoolBonus = (buildings.scribal_school?.count || 0) > 0 ? 2 : 1;
  const tabletsBonus = technologies.clay_tablets?.unlocked ? 1 : 0;

  let seasonFarmMultiplier = 1;
  if (season === 'Primavera') seasonFarmMultiplier = 1.25;
  if (season === 'Outono') seasonFarmMultiplier = 1.35;
  if (season === 'Inverno') seasonFarmMultiplier = 0.65;

  let foodProduced = 0;
  let woodProduced = 0;
  let stoneProduced = 0;
  let clayProduced = 0;
  let knowledgeProduced = 0;

  villagers.forEach((v) => {
    const traitMult = v.trait?.multiplier || 1;
    const moraleMult = v.morale >= 80 ? 1.15 : v.morale <= 40 ? 0.8 : 1;

    if (v.job === 'farmer') {
      const base = 6 + longhouseBonus;
      foodProduced += base * (1 + sicklesBonus + wellBonus) * seasonFarmMultiplier * traitMult * moraleMult;
    } else if (v.job === 'lumberjack') {
      const base = 5 + longhouseBonus;
      woodProduced += base * traitMult * moraleMult;
    } else if (v.job === 'quarryman') {
      const base = 4 + longhouseBonus;
      stoneProduced += base * traitMult * moraleMult;
    } else if (v.job === 'potter') {
      const base = 4 + longhouseBonus;
      clayProduced += base * traitMult * moraleMult;
    } else if (v.job === 'elder') {
      const base = 3 + longhouseBonus;
      knowledgeProduced += base * (1 + tabletsBonus) * schoolBonus * traitMult * moraleMult;
    }
  });

  const foodConsumed = Math.round(villagers.length * (1 - grindingBonus));
  const foodNet = Math.round(foodProduced) - foodConsumed;

  return {
    foodNet,
    foodProduced: Math.round(foodProduced),
    foodConsumed,
    wood: Math.round(woodProduced),
    stone: Math.round(stoneProduced),
    clay: Math.round(clayProduced),
    knowledge: Math.round(knowledgeProduced),
  };
}

/**
 * Calcula o custo de comida para cada uma das refeições diárias (café, almoço ou jantar).
 */
export function calculateMealFoodCost(villagerCount: number): number {
  return Math.max(1, Math.ceil(villagerCount * 0.34));
}

/**
 * Aplica o processamento de uma refeição coletiva, consumindo comida e ajustando saúde e moral.
 */
export function processMealConsumption(
  currentFood: number,
  villagers: Villager[]
): {
  hasFood: boolean;
  updatedFood: number;
  updatedVillagers: Villager[];
} {
  const foodNeeded = calculateMealFoodCost(villagers.length);
  const hasFood = currentFood >= foodNeeded;
  const updatedFood = Math.max(0, currentFood - (hasFood ? foodNeeded : 0));

  const updatedVillagers = villagers.map((v) => ({
    ...v,
    isFed: hasFood,
    health: hasFood
      ? Math.min(100, (v.health ?? 100) + 4)
      : Math.max(10, (v.health ?? 100) - 10),
    morale: hasFood
      ? Math.min(100, v.morale + 3)
      : Math.max(20, v.morale - 8),
  }));

  return {
    hasFood,
    updatedFood,
    updatedVillagers,
  };
}

/**
 * Calcula a quantidade de lenha necessária para aquecer a fogueira da aldeia na estação.
 */
export function calculateWoodHeatingNeeded(isWinter: boolean): number {
  return isWinter ? 2 : 1;
}

/**
 * Aplica a produção diária de recursos e consumo de lenha, respeitando limites de armazenamento.
 */
export function applyDailyResourceProduction(
  currentResources: Resources,
  rates: ResourceRates,
  maxStorage: GameState['maxStorage'],
  isWinter: boolean
): {
  newResources: Resources;
  eventNote?: string;
} {
  const newFood = Math.min(maxStorage.food, currentResources.food + rates.foodProduced);

  const woodNeeded = calculateWoodHeatingNeeded(isWinter);
  let newWood = currentResources.wood + rates.wood;
  let eventNote = '';

  if (newWood >= woodNeeded) {
    newWood -= woodNeeded;
  } else {
    newWood = 0;
    eventNote = '❄️ Faltou lenha na fogueira central para aquecimento.';
  }
  newWood = Math.min(maxStorage.wood, Math.max(0, newWood));

  const newStone = Math.min(maxStorage.stone, currentResources.stone + rates.stone);
  const newClay = Math.min(maxStorage.clay, currentResources.clay + rates.clay);
  const newKnowledge = currentResources.knowledge + rates.knowledge;

  return {
    newResources: {
      food: newFood,
      wood: newWood,
      stone: newStone,
      clay: newClay,
      knowledge: newKnowledge,
    },
    eventNote: eventNote || undefined,
  };
}
