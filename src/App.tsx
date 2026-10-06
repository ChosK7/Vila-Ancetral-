import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameState, JobType, TurnReport, Villager } from './types/game';
import { INITIAL_STATE, RANDOM_EVENTS, ERAS_INFO } from './data/initialData';
import { ThreeVillageScene } from './three/ThreeVillageScene';
import { ExpandableResourceBar } from './components/ExpandableResourceBar';
import { TaskAssignmentBar } from './components/TaskAssignmentBar';
import { BuildingPanel } from './components/BuildingPanel';
import { TechTreeModal } from './components/TechTreeModal';
import { CelestialTimeCycle } from './components/CelestialTimeCycle';
import { TurnReportModal } from './components/TurnReportModal';
import { EventModal } from './components/EventModal';
import { HelpModal } from './components/HelpModal';
import { VictoryModal } from './components/VictoryModal';
import { audio } from './utils/audio';
import {
  BookOpen,
  Edit2,
  Hammer,
  HelpCircle,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

const STORAGE_KEY = 'vila_ancestral_save_3d_v2';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }
    return INITIAL_STATE;
  });

  // UI Drawer / Modal states
  const [isResourceExpanded, setIsResourceExpanded] = useState(false);
  const [isTaskBarExpanded, setIsTaskBarExpanded] = useState(false);
  const [isBuildingDrawerOpen, setIsBuildingDrawerOpen] = useState(false);
  const [isTechTreeOpen, setIsTechTreeOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedVillagerId, setSelectedVillagerId] = useState<string | null>(null);

  // Player name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempPlayerName, setTempPlayerName] = useState('');

  // Save state on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
      // Ignore
    }
  }, [gameState]);

  // Synchronize audio manager
  useEffect(() => {
    audio.setEnabled(gameState.soundEnabled);
  }, [gameState.soundEnabled]);

  // Production rates calculation
  const rates = useMemo(() => {
    const { villagers, buildings, technologies, seasonIndex } = gameState;
    const season = ['Primavera', 'Verão', 'Outono', 'Inverno'][seasonIndex];

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
  }, [gameState]);

  // Auto-assign idle villagers logic: "Aldeões desocupado vai automaticamente para uma função livre ou com maior necessidade"
  const autoAssignIdleVillagers = useCallback(
    (currentVillagers: Villager[], currentState: GameState, currentRates: any): Villager[] => {
      const idleCount = currentVillagers.filter((v) => v.job === 'idle').length;
      if (idleCount === 0) return currentVillagers;

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
      currentVillagers.forEach((v) => {
        jobCounts[v.job] = (jobCounts[v.job] || 0) + 1;
      });

      const hasActiveConstruction = Object.values(currentState.buildings).some(
        (b) => b.constructionTurnsLeft > 0
      );
      const hasPottery = !!currentState.technologies.primitive_pottery?.unlocked;

      const getJobForNextIdle = (): JobType => {
        // 1. Food security: if food <= 18 or net food is negative or no farmers at all
        if (
          currentState.resources.food <= 18 ||
          currentRates.foodNet < 0 ||
          jobCounts.farmer < 1
        ) {
          jobCounts.farmer++;
          return 'farmer';
        }
        // 2. Wood for shelters, tools and expansion
        if (currentState.resources.wood < 25 && jobCounts.lumberjack < 2) {
          jobCounts.lumberjack++;
          return 'lumberjack';
        }
        // 3. Stone for masonry and masonry buildings
        if (currentState.resources.stone < 15 && jobCounts.quarryman < 2) {
          jobCounts.quarryman++;
          return 'quarryman';
        }
        // 4. Active construction works in progress
        if (hasActiveConstruction && jobCounts.builder < 2) {
          jobCounts.builder++;
          return 'builder';
        }
        // 5. Clay if pottery is unlocked and clay is scarce
        if (hasPottery && currentState.resources.clay < 15 && jobCounts.potter < 1) {
          jobCounts.potter++;
          return 'potter';
        }
        // 6. Elder for research points
        if (jobCounts.elder < 1) {
          jobCounts.elder++;
          return 'elder';
        }
        // 7. General balancing between food, wood, stone
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
    },
    []
  );

  // Automatic Day / Turn completion when 24-hour cycle completes
  const executeAutoDayAdvance = useCallback(
    (prev: GameState, remainingHour: number): GameState => {
      audio.playTurn();

      const nextTurn = prev.turn + 1;
      const nextSeasonIdx = (prev.seasonIndex + 1) % 4;
      const nextYear = nextSeasonIdx === 0 ? prev.year + 1 : prev.year;
      const seasons = ['Primavera', 'Verão', 'Outono', 'Inverno'] as const;
      const currentSeasonName = seasons[prev.seasonIndex];

      const buildersCount = prev.villagers.filter((v) => v.job === 'builder').length;
      const craneMultiplier = (prev.buildings.crane_scaffolding?.count || 0) > 0 ? 2 : 1;
      const constructionSpeed = Math.max(1, buildersCount * craneMultiplier);

      const updatedBuildings = { ...prev.buildings };
      const completedBuildings: string[] = [];

      Object.keys(updatedBuildings).forEach((key) => {
        const b = { ...updatedBuildings[key] };
        if (b.constructionTurnsLeft > 0) {
          b.constructionTurnsLeft = Math.max(0, b.constructionTurnsLeft - constructionSpeed);
          if (b.constructionTurnsLeft === 0) {
            b.count += 1;
            completedBuildings.push(b.name);
          }
          updatedBuildings[key] = b;
        }
      });

      const granariesCount = updatedBuildings.granary?.count || 0;
      const maxFoodStorage = 120 + granariesCount * 100;
      const maxWoodStorage = 120 + granariesCount * 40;
      const maxStoneStorage = 100 + granariesCount * 40;
      const maxClayStorage = 100 + granariesCount * 40;

      // 1. Daily production additions
      let newFood = Math.min(maxFoodStorage, prev.resources.food + rates.foodProduced);

      // 2. Wood Consumption for Campfire & Heating
      const isWinter = nextSeasonIdx === 3;
      const woodNeeded = isWinter ? 2 : 1;
      let newWood = prev.resources.wood + rates.wood;
      let eventNote = '';

      if (newWood >= woodNeeded) {
        newWood -= woodNeeded;
      } else {
        newWood = 0;
        eventNote = '❄️ Faltou lenha na fogueira central para aquecimento.';
      }
      newWood = Math.min(maxWoodStorage, Math.max(0, newWood));

      let newStone = Math.min(maxStoneStorage, prev.resources.stone + rates.stone);
      let newClay = Math.min(maxClayStorage, prev.resources.clay + rates.clay);
      let newKnowledge = prev.resources.knowledge + rates.knowledge;

      // 3. Update Daily Missions Progress
      const updatedMissions = (prev.dailyMissions || []).map((m) => {
        if (m.claimed) return m;
        let curProgress = m.progress;
        if (m.category === 'food') curProgress = Math.max(curProgress, newFood);
        if (m.category === 'wood') curProgress = Math.max(curProgress, newWood);
        if (m.category === 'stone') curProgress = Math.max(curProgress, newStone);
        if (m.category === 'knowledge') curProgress = Math.max(curProgress, newKnowledge);
        if (m.category === 'villagers') curProgress = Math.max(curProgress, prev.villagers.length);

        return {
          ...m,
          progress: curProgress,
          completed: curProgress >= m.target,
        };
      });

      let updatedVillagers = [...prev.villagers];
      // Auto-assign any remaining idle villagers on day advance if enabled
      if (prev.autoAssignIdle !== false) {
        updatedVillagers = autoAssignIdleVillagers(updatedVillagers, prev, rates);
      }

      let nextEra = prev.currentEra;
      const unlockedCount = Object.values(prev.technologies).filter(
        (t) => t.era === prev.currentEra && t.unlocked
      ).length;

      if (unlockedCount >= 3 && nextEra < 4) {
        nextEra += 1;
        eventNote = `🌟 Sua civilização evoluiu para a ${ERAS_INFO[nextEra].name}!`;
      }

      let gameWon = prev.gameWon;
      if (updatedBuildings.ziggurat && updatedBuildings.ziggurat.count > 0 && !gameWon) {
        gameWon = true;
      }

      let activeEvent = prev.activeEvent;
      if (!activeEvent && nextTurn % 3 === 0 && Math.random() > 0.3) {
        const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        activeEvent = ev;
        audio.playAlert();
      }

      const report: TurnReport = {
        turn: prev.turn,
        year: prev.year,
        season: currentSeasonName,
        foodProduced: rates.foodProduced,
        foodConsumed: rates.foodConsumed,
        woodProduced: rates.wood,
        stoneProduced: rates.stone,
        clayProduced: rates.clay,
        knowledgeProduced: rates.knowledge,
        completedBuildings,
        populationChange: 0,
        eventNote: eventNote || undefined,
      };

      return {
        ...prev,
        gameHour: remainingHour,
        turn: nextTurn,
        year: nextYear,
        seasonIndex: nextSeasonIdx,
        currentEra: nextEra,
        resources: {
          food: newFood,
          wood: newWood,
          stone: newStone,
          clay: newClay,
          knowledge: newKnowledge,
        },
        maxStorage: {
          food: maxFoodStorage,
          wood: maxWoodStorage,
          stone: maxStoneStorage,
          clay: maxClayStorage,
        },
        buildings: updatedBuildings,
        villagers: updatedVillagers,
        dailyMissions: updatedMissions,
        activeEvent,
        lastTurnReport: report,
        gameWon,
      };
    },
    [rates, autoAssignIdleVillagers]
  );

  // AUTOMATIC TIME CYCLE TIMER
  // Automatically advances gameHour continuously (~0.4 hours per real second => 1 full 24h day = 60s)
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.isGameOver || prev.isTimePaused) return prev;

        const step = 0.08;
        const currentHour = prev.gameHour ?? 6.0;
        const nextHour = currentHour + step;

        // Check if full 24h day elapsed -> advance turn/day automatically!
        if (nextHour >= 24.0) {
          return executeAutoDayAdvance(prev, nextHour - 24.0);
        }

        // Meal events:
        // Café da manhã ao amanhecer (~06:00)
        // Almoço ao meio-dia (~12:00)
        // Jantar à noite (~19:30)
        let updatedFood = prev.resources.food;
        let updatedVillagers = prev.villagers;
        const crossedBreakfast = currentHour < 6.0 && nextHour >= 6.0;
        const crossedLunch = currentHour < 12.0 && nextHour >= 12.0;
        const crossedDinner = currentHour < 19.5 && nextHour >= 19.5;

        if (crossedBreakfast || crossedLunch || crossedDinner) {
          const foodNeeded = Math.max(1, Math.ceil(prev.villagers.length * 0.34));
          const hasFood = updatedFood >= foodNeeded;
          updatedFood = Math.max(0, updatedFood - (hasFood ? foodNeeded : 0));

          updatedVillagers = prev.villagers.map((v) => ({
            ...v,
            isFed: hasFood,
            health: hasFood
              ? Math.min(100, (v.health ?? 100) + 4)
              : Math.max(10, (v.health ?? 100) - 10),
            morale: hasFood
              ? Math.min(100, v.morale + 3)
              : Math.max(20, v.morale - 8),
          }));

          if (hasFood) {
            audio.playHarvest();
          } else {
            audio.playAlert();
          }
        }

        return {
          ...prev,
          gameHour: nextHour,
          resources: {
            ...prev.resources,
            food: updatedFood,
          },
          villagers: updatedVillagers,
        };
      });
    }, 200);

    return () => clearInterval(timer);
  }, [executeAutoDayAdvance]);

  // Pause / Resume automatic time
  const handleTogglePause = () => {
    setGameState((prev) => ({
      ...prev,
      isTimePaused: !prev.isTimePaused,
    }));
  };

  // Add 1 villager to a task: "coletar madeiras adicionar... coletar pedra adicionar... coletar alimentos adicionar"
  const handleAddTaskVillager = (job: JobType) => {
    setGameState((prev) => {
      const idleIdx = prev.villagers.findIndex((v) => v.job === 'idle');
      if (idleIdx !== -1) {
        const updated = [...prev.villagers];
        updated[idleIdx] = { ...updated[idleIdx], job };
        return { ...prev, villagers: updated };
      }
      return prev;
    });
  };

  // Remove 1 villager from a task: "remover aldeão..."
  const handleRemoveTaskVillager = (job: JobType) => {
    setGameState((prev) => {
      const jobIdx = prev.villagers.findIndex((v) => v.job === job);
      if (jobIdx === -1) return prev;

      const updated = [...prev.villagers];
      updated[jobIdx] = { ...updated[jobIdx], job: 'idle' };

      return { ...prev, villagers: updated };
    });
  };

  // Distribute idle villagers immediately to greatest need
  const handleAutoAssignNow = () => {
    setGameState((prev) => {
      const assigned = autoAssignIdleVillagers(prev.villagers, prev, rates);
      audio.playWood();
      return { ...prev, villagers: assigned };
    });
  };

  // Toggle autoAssignIdle
  const handleToggleAutoAssign = () => {
    setGameState((prev) => ({
      ...prev,
      autoAssignIdle: !prev.autoAssignIdle,
    }));
  };

  // Recruit new villager (automatically assigned if auto-assign is on)
  const handleRecruitVillager = () => {
    const housingCap = Object.values(gameState.buildings).reduce(
      (acc, b) => acc + (b.housingCap || 0) * b.count,
      0
    );

    if (gameState.villagers.length >= housingCap || gameState.resources.food < 15) {
      return;
    }

    audio.playRecruit();

    const names = [
      'Gudea', 'Naram', 'Shulgi', 'Ur-Nammu', 'Rimush', 'Kubi', 'Puabi', 'Tiamat',
      'Gilgamesh', 'Aya', 'Eresh', 'Sin', 'Nanna', 'Lugal', 'Babu', 'Enheduanna'
    ];
    const availableNames = names.filter((n) => !gameState.villagers.some((v) => v.name === n));
    const randomName =
      availableNames.length > 0 ? availableNames[0] : `Aldeão ${gameState.villagers.length + 1}`;
    const colors = ['#8C5A32', '#4A7C8E', '#A66B38', '#5E748B', '#7A9A60', '#B8860B'];
    const hairs: ('spiky' | 'side' | 'wavy' | 'bun')[] = ['spiky', 'side', 'wavy', 'bun'];

    const traits = [
      {
        name: 'Ceifador Veloz',
        description: '+1 Trigo ao trabalhar como agricultor',
        bonusJob: 'farmer' as JobType,
        multiplier: 1.2,
      },
      {
        name: 'Força de Titã',
        description: '+1 Madeira ao derrubar troncos',
        bonusJob: 'lumberjack' as JobType,
        multiplier: 1.2,
      },
      {
        name: 'Olho Mineral',
        description: '+1 Pedra na pedreira',
        bonusJob: 'quarryman' as JobType,
        multiplier: 1.2,
      },
      {
        name: 'Mente Curiosa',
        description: '+1 Conhecimento como Ancião',
        bonusJob: 'elder' as JobType,
        multiplier: 1.2,
      },
      {
        name: 'Espírito Valente',
        description: '+10 de Defesa para a vila',
        bonusJob: 'guard' as JobType,
        multiplier: 1.15,
      },
    ];

    const newVil: Villager = {
      id: `vil-${Date.now()}`,
      name: randomName,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      tunicColor: colors[Math.floor(Math.random() * colors.length)],
      hairStyle: hairs[Math.floor(Math.random() * hairs.length)],
      job: 'idle',
      morale: 85,
      health: 100,
      maxHealth: 100,
      isFed: true,
      trait: traits[Math.floor(Math.random() * traits.length)],
    };

    setGameState((prev) => {
      const allVillagers = [...prev.villagers, newVil];
      const finalizedVillagers =
        prev.autoAssignIdle !== false
          ? autoAssignIdleVillagers(allVillagers, prev, rates)
          : allVillagers;

      return {
        ...prev,
        resources: {
          ...prev.resources,
          food: prev.resources.food - 15,
        },
        villagers: finalizedVillagers,
      };
    });
  };

  // Unlock a collection job
  const handleUnlockJob = (job: JobType) => {
    setGameState((prev) => {
      if (prev.unlockedJobs?.includes(job)) return prev;
      audio.playFanfare();
      return {
        ...prev,
        unlockedJobs: [...(prev.unlockedJobs || ['farmer', 'lumberjack', 'quarryman']), job],
      };
    });
  };

  // Claim Daily Mission Reward
  const handleClaimMissionReward = (missionId: string) => {
    setGameState((prev) => {
      const mission = prev.dailyMissions?.find((m) => m.id === missionId);
      if (!mission || mission.claimed) return prev;

      audio.playFanfare();

      let newXP = (prev.villageXP || 0) + mission.rewardXP;
      let newLevel = prev.villageLevel || 1;
      let nextXP = prev.xpToNextLevel || 100;
      let newUnlockedJobs = [...(prev.unlockedJobs || ['farmer', 'lumberjack', 'quarryman'])];

      // Check level up
      if (newXP >= nextXP) {
        newLevel += 1;
        newXP = newXP - nextXP;
        nextXP = Math.round(nextXP * 1.6);
        // Level up unlocks jobs!
        if (newLevel >= 2 && !newUnlockedJobs.includes('potter')) {
          newUnlockedJobs.push('potter');
        }
        if (newLevel >= 2 && !newUnlockedJobs.includes('elder')) {
          newUnlockedJobs.push('elder');
        }
        if (newLevel >= 3 && !newUnlockedJobs.includes('guard')) {
          newUnlockedJobs.push('guard');
        }
      }

      if (mission.unlockJob && !newUnlockedJobs.includes(mission.unlockJob)) {
        newUnlockedJobs.push(mission.unlockJob);
      }

      const newKnowledge = prev.resources.knowledge + (mission.rewardKnowledge || 0);

      // Mark claimed and keep mission state updated
      const updatedMissions = prev.dailyMissions.map((m) => {
        if (m.id === missionId) {
          return { ...m, claimed: true };
        }
        return m;
      });

      return {
        ...prev,
        villageXP: newXP,
        villageLevel: newLevel,
        xpToNextLevel: nextXP,
        unlockedJobs: newUnlockedJobs,
        resources: {
          ...prev.resources,
          knowledge: newKnowledge,
        },
        dailyMissions: updatedMissions,
      };
    });
  };

  // Start construction
  const handleStartConstruction = (buildingId: string) => {
    setGameState((prev) => {
      const b = prev.buildings[buildingId];
      if (!b) return prev;

      const newResources = { ...prev.resources };
      if (b.cost.wood) newResources.wood -= b.cost.wood;
      if (b.cost.stone) newResources.stone -= b.cost.stone;
      if (b.cost.clay) newResources.clay -= b.cost.clay;
      if (b.cost.knowledge) newResources.knowledge -= b.cost.knowledge;

      const updated = {
        ...b,
        constructionTurnsLeft: b.constructionTurnsTotal,
      };

      return {
        ...prev,
        resources: newResources,
        buildings: {
          ...prev.buildings,
          [buildingId]: updated,
        },
      };
    });
  };

  // Research Tech
  const handleResearchTech = (techId: string) => {
    setGameState((prev) => {
      const tech = prev.technologies[techId];
      if (!tech || tech.unlocked || prev.resources.knowledge < tech.cost) return prev;

      return {
        ...prev,
        resources: {
          ...prev.resources,
          knowledge: prev.resources.knowledge - tech.cost,
        },
        technologies: {
          ...prev.technologies,
          [techId]: { ...tech, unlocked: true },
        },
      };
    });
  };

  // Resolve Event
  const handleResolveEventOption = (optionIndex: number) => {
    if (!gameState.activeEvent) return;
    const option = gameState.activeEvent.options[optionIndex];
    if (option) {
      const updates = option.action(gameState);
      setGameState((prev) => ({
        ...prev,
        ...updates,
        activeEvent: null,
      }));
    } else {
      setGameState((prev) => ({ ...prev, activeEvent: null }));
    }
  };

  // Toggle Sound
  const handleToggleSound = () => {
    setGameState((prev) => {
      const nextVal = !prev.soundEnabled;
      audio.setEnabled(nextVal);
      return { ...prev, soundEnabled: nextVal };
    });
  };

  // Reset Game
  const handleResetGame = () => {
    if (window.confirm('Deseja realmente recomeçar a vila com os 2 aldeões iniciais?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(INITIAL_STATE);
    }
  };

  // Real-time small deposit from 3D villager carrying goods to storehouse
  const handleVillagerGathers = (resource: 'food' | 'wood' | 'stone' | 'clay', amount: number) => {
    setGameState((prev) => {
      const maxCap = prev.maxStorage[resource];
      const curVal = prev.resources[resource];
      if (curVal >= maxCap) return prev;
      return {
        ...prev,
        resources: {
          ...prev.resources,
          [resource]: Math.min(maxCap, curVal + amount),
        },
      };
    });
  };

  // Save edited player name
  const savePlayerName = () => {
    const trimmed = tempPlayerName.trim();
    if (trimmed) {
      setGameState((prev) => ({ ...prev, playerName: trimmed }));
    }
    setIsEditingName(false);
  };

  const idleCount = gameState.villagers.filter((v) => v.job === 'idle').length;
  const assignedCount = gameState.villagers.length - idleCount;

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#DCE7EB] font-sans selection:bg-[#DEB887] select-none">
      {/* 1. FULLSCREEN 3D GAME VIEWPORT (Takes the whole screen edge-to-edge) */}
      <ThreeVillageScene
        gameState={gameState}
        selectedVillagerId={selectedVillagerId}
        onSelectVillager={(v) => setSelectedVillagerId(v ? v.id : null)}
        onVillagerGathers={handleVillagerGathers}
      />

      {/* 2. TOP SINGLE LINE HEADER: "apenas uma linha superior com: Nome do jogador. Barra de recursos expansível ao clicar para recursos que não aparecem." */}
      <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-[#F5EAD9]/95 backdrop-blur-md border-b-3 border-[#33261D] px-3 sm:px-5 flex items-center justify-between gap-2 shadow-md">
        {/* Left: Player Name & Season */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Player Name (Clickable / Editable) */}
          {isEditingName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                savePlayerName();
              }}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={tempPlayerName}
                onChange={(e) => setTempPlayerName(e.target.value)}
                onBlur={savePlayerName}
                autoFocus
                maxLength={24}
                className="bg-white border-2 border-[#33261D] rounded-lg px-2 py-0.5 text-xs font-display font-black text-[#2C241E] w-32 sm:w-44 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="text-xs bg-[#33261D] text-white px-2 py-0.5 rounded font-bold cursor-pointer"
              >
                ✓
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempPlayerName(gameState.playerName || 'Líder Tribal');
                setIsEditingName(true);
              }}
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFFBF5] border-2 border-[#33261D] hover:bg-[#EFE4CE] transition-all cursor-pointer shadow-2xs"
              title="Clique para editar o Nome do Jogador"
            >
              <span className="text-sm">👑</span>
              <div className="text-left">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block leading-none">
                  Jogador
                </span>
                <span className="font-display font-black text-xs sm:text-sm text-[#2C241E] leading-tight flex items-center gap-1">
                  {gameState.playerName || 'Líder Tribal'}
                  <Edit2 size={10} className="text-stone-400 group-hover:text-stone-700" />
                </span>
              </div>
            </button>
          )}

          {/* Compact Season & Year Badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#FAF3E7] border-2 border-stone-300 px-2.5 py-1 rounded-xl text-xs font-semibold text-stone-700">
            <span>{['🌱', '☀️', '🍂', '❄️'][gameState.seasonIndex]}</span>
            <span className="font-display font-extrabold text-[#78350F]">
              {['Primavera', 'Verão', 'Outono', 'Inverno'][gameState.seasonIndex]}
            </span>
            <span className="text-stone-400">·</span>
            <span className="text-[11px] font-mono font-bold">Ano {gameState.year}</span>
          </div>
        </div>

        {/* Center: Expandable Resource Bar (Expands on click to show hidden resources like Clay, Knowledge, Defense) */}
        <div className="flex items-center justify-center">
          <ExpandableResourceBar
            gameState={gameState}
            isExpanded={isResourceExpanded}
            onToggleExpand={() => setIsResourceExpanded(!isResourceExpanded)}
            rates={rates}
          />
        </div>

        {/* Right: Action Buttons & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tasks Drawer Toggle Button */}
          <button
            onClick={() => {
              audio.playWood();
              setIsTaskBarExpanded(!isTaskBarExpanded);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border-2 font-display font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isTaskBarExpanded
                ? 'bg-[#33261D] text-white border-[#33261D]'
                : 'bg-[#FFFDF9] text-stone-900 border-[#33261D] hover:bg-[#EBDDC8]'
            }`}
            title="Designar tarefas dos aldeões (+/-)"
          >
            <span className="text-sm">📋</span>
            <span className="hidden sm:inline">Tarefas</span>
            <span className="bg-[#E5B84B] text-[#2C241E] px-1 rounded text-[10px] font-mono font-bold">
              {assignedCount}/{gameState.villagers.length}
            </span>
            {idleCount > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1 rounded text-[9px] font-bold animate-pulse">
                💤 {idleCount}
              </span>
            )}
          </button>

          {/* Buildings Menu Toggle */}
          <button
            onClick={() => {
              audio.playWood();
              setIsBuildingDrawerOpen(!isBuildingDrawerOpen);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border-2 font-display font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isBuildingDrawerOpen
                ? 'bg-[#33261D] text-white border-[#33261D]'
                : 'bg-[#FFFDF9] text-stone-900 border-[#33261D] hover:bg-[#EBDDC8]'
            }`}
            title="Construções da vila"
          >
            <Hammer size={14} />
            <span className="hidden sm:inline">Construir</span>
          </button>

          {/* Tech Tree Modal Button */}
          <button
            onClick={() => {
              audio.playWood();
              setIsTechTreeOpen(true);
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border-2 border-[#33261D] bg-[#FFFDF9] font-display font-bold text-xs text-stone-900 hover:bg-[#EBDDC8] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Pesquisas tecnológicas"
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">Pesquisas</span>
          </button>

          {/* Automatic Celestial Time Cycle (Sun icon in day, Moon icon in night, automatically advancing) */}
          <CelestialTimeCycle
            gameState={gameState}
            onTogglePause={handleTogglePause}
          />

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] text-stone-700 hover:bg-[#EFE4CE] transition-colors"
            title={gameState.soundEnabled ? 'Silenciar som' : 'Ativar som'}
          >
            {gameState.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Help */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] text-stone-700 hover:bg-[#EFE4CE] transition-colors"
            title="Ajuda e Manual"
          >
            <HelpCircle size={14} />
          </button>

          {/* Reset */}
          <button
            onClick={handleResetGame}
            className="p-1.5 rounded-lg border-2 border-[#33261D] bg-[#FFFBF5] text-stone-700 hover:bg-red-50 hover:text-red-700 transition-colors"
            title="Reiniciar Jogo"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* 3. BOTTOM FLOATING DOCK: Expandable Task Assignment Bar */}
      <div className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-20 pointer-events-none">
        <TaskAssignmentBar
          gameState={gameState}
          isOpen={isTaskBarExpanded}
          onToggle={() => setIsTaskBarExpanded(!isTaskBarExpanded)}
          onAddTaskVillager={handleAddTaskVillager}
          onRemoveTaskVillager={handleRemoveTaskVillager}
          onAutoAssignNow={handleAutoAssignNow}
          onToggleAutoAssign={handleToggleAutoAssign}
          onRecruitVillager={handleRecruitVillager}
          onUnlockJob={handleUnlockJob}
          onClaimMissionReward={handleClaimMissionReward}
          rates={rates}
        />
      </div>

      {/* 4. FLOATING BUILDINGS MODAL / DRAWER */}
      {isBuildingDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-[#FFFDF9] border-3 border-[#33261D] rounded-2xl p-4 sm:p-5 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔨</span>
                <div>
                  <h3 className="font-display font-black text-base text-stone-900">
                    Obras & Infraestrutura da Vila
                  </h3>
                  <p className="text-xs font-hand font-bold text-stone-600">
                    Construa habitações para acolher mais pessoas, celeiros e fortificações
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBuildingDrawerOpen(false)}
                className="text-stone-500 hover:text-stone-900 px-2.5 py-1 rounded-lg hover:bg-stone-100 font-bold text-xs border border-stone-300 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>
            <BuildingPanel
              gameState={gameState}
              onStartConstruction={(bId) => {
                handleStartConstruction(bId);
                setIsBuildingDrawerOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* 5. MODALS */}
      <TechTreeModal
        isOpen={isTechTreeOpen}
        onClose={() => setIsTechTreeOpen(false)}
        gameState={gameState}
        onResearchTech={handleResearchTech}
      />

      <TurnReportModal
        report={gameState.lastTurnReport}
        onClose={() => setGameState((prev) => ({ ...prev, lastTurnReport: null }))}
      />

      <EventModal
        event={gameState.activeEvent}
        gameState={gameState}
        onResolveOption={handleResolveEventOption}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <VictoryModal
        isOpen={gameState.gameWon}
        onClose={() => setGameState((prev) => ({ ...prev, gameWon: false }))}
        onRestart={handleResetGame}
        year={gameState.year}
        villagersCount={gameState.villagers.length}
      />
    </div>
  );
}
