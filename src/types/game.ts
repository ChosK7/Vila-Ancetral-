export type ResourceType = 'food' | 'wood' | 'stone' | 'clay' | 'knowledge';

export interface Resources {
  food: number;
  wood: number;
  stone: number;
  clay: number;
  knowledge: number;
}

export type JobType =
  | 'idle'
  | 'farmer'
  | 'lumberjack'
  | 'quarryman'
  | 'potter'
  | 'elder'
  | 'guard'
  | 'builder';

export interface Villager {
  id: string;
  name: string;
  gender: 'male' | 'female';
  tunicColor: string; // hex or tailwind class
  hairStyle: 'spiky' | 'side' | 'wavy' | 'elder' | 'bun' | 'bald';
  job: JobType;
  morale: number; // 0 - 100
  health: number; // 0 - 100
  maxHealth: number; // 100
  isFed: boolean;
  trait: {
    name: string;
    description: string;
    bonusJob?: JobType;
    multiplier?: number;
  };
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  category: 'food' | 'wood' | 'stone' | 'knowledge' | 'build' | 'villagers';
  target: number;
  progress: number;
  rewardText: string;
  rewardXP: number;
  rewardKnowledge?: number;
  rewardResources?: Partial<Resources>;
  unlockJob?: JobType;
  completed: boolean;
  claimed: boolean;
}

export interface Building {
  id: string;
  name: string;
  description: string;
  category: 'housing' | 'production' | 'defense' | 'wonder';
  cost: Partial<Resources>;
  requiredEra: number;
  requiredTech?: string;
  count: number;
  maxCount?: number;
  housingCap?: number;
  benefitsDescription: string;
  icon: string;
  constructionTurnsTotal: number;
  constructionTurnsLeft: number;
}

export interface Technology {
  id: string;
  name: string;
  description: string;
  era: number;
  cost: number; // knowledge cost
  prerequisites: string[];
  unlocked: boolean;
  effectDescription: string;
  icon: string;
}

export interface EraInfo {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  bgPalette: {
    sky: string;
    hills: string;
    fields: string;
    accent: string;
  };
  requiredTechsCount: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  imageTheme: 'harvest' | 'wanderers' | 'scout' | 'rain' | 'locust' | 'trader';
  options: {
    text: string;
    effectText: string;
    action: (state: GameState) => Partial<GameState>;
  }[];
}

export type Season = 'Primavera' | 'Verão' | 'Outono' | 'Inverno';

export interface TurnReport {
  turn: number;
  year: number;
  season: Season;
  foodProduced: number;
  foodConsumed: number;
  woodProduced: number;
  stoneProduced: number;
  clayProduced: number;
  knowledgeProduced: number;
  completedBuildings: string[];
  populationChange: number;
  eventNote?: string;
}

export interface GameState {
  playerName?: string;
  autoAssignIdle?: boolean;
  gameHour: number; // 0.0 to 24.0 (continuous time of day)
  isTimePaused?: boolean;
  villageLevel: number;
  villageXP: number;
  xpToNextLevel: number;
  unlockedJobs: JobType[];
  dailyMissions: DailyMission[];
  woodConsumedPerTurn: number;
  turn: number;
  year: number;
  seasonIndex: number;
  currentEra: number;
  resources: Resources;
  maxStorage: {
    food: number;
    wood: number;
    stone: number;
    clay: number;
  };
  villagers: Villager[];
  buildings: Record<string, Building>;
  technologies: Record<string, Technology>;
  activeEvent: GameEvent | null;
  lastTurnReport: TurnReport | null;
  isGameOver: boolean;
  soundEnabled: boolean;
  gameWon: boolean;
  zigguratStagesCompleted: number;
}
