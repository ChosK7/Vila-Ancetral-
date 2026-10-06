import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameState, JobType, Villager } from '../types/game';
import { CharacterRig, createCharacterMesh, setupToolForJob } from './characterMesh';
import { getCelestialTimeInfo, DailyRoutine } from '../utils/timeCycle';
import {
  createBuilderSiteMesh,
  createCampfireMesh,
  createClayPitMesh,
  createElderDeskMesh,
  createGranaryMesh,
  createGuardPostMesh,
  createHutMesh,
  createLonghouseMesh,
  createRockQuarryMesh,
  createStoneDwellingMesh,
  createTreeMesh,
  createWellMesh,
  createWheatPatchMesh,
  createZigguratMesh,
} from './buildingMeshes';
import { audio } from '../utils/audio';
import { Compass, Eye, Maximize2, RotateCcw, User, ZoomIn, ZoomOut } from 'lucide-react';

interface ThreeVillageSceneProps {
  gameState: GameState;
  selectedVillagerId: string | null;
  onSelectVillager: (villager: Villager | null) => void;
  onVillagerGathers?: (resource: 'food' | 'wood' | 'stone' | 'clay', amount: number) => void;
}

export type TimeOfDay = 'day' | 'sunset' | 'night' | 'dawn';

export const TIME_OF_DAY_INFO: Record<
  TimeOfDay,
  { name: string; icon: string; description: string }
> = {
  day: { name: 'Dia Pleno', icon: '☀️', description: 'Sol radiante e céu azul no vale fértil' },
  sunset: { name: 'Pôr do Sol', icon: '🌇', description: 'Crepúsculo âmbar e sombras longas' },
  night: { name: 'Noite Sombria', icon: '🌙', description: 'Tons azulados, céu estrelado e fogueira viva' },
  dawn: { name: 'Alvorada', icon: '🌅', description: 'Primeiros raios de sol e orvalho matinal' },
};

interface LightingPreset {
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunPos: THREE.Vector3;
  groundColor: THREE.Color;
  campfireLightIntensity: number;
  starsOpacity: number;
  moonOpacity: number;
}

const LIGHTING_PRESETS: Record<TimeOfDay, LightingPreset> = {
  day: {
    skyColor: new THREE.Color(0xdce7eb),
    fogColor: new THREE.Color(0xdce7eb),
    fogDensity: 0.022,
    ambientColor: new THREE.Color(0xfef3c7),
    ambientIntensity: 0.95,
    sunColor: new THREE.Color(0xffedd5),
    sunIntensity: 1.65,
    sunPos: new THREE.Vector3(15, 25, 15),
    groundColor: new THREE.Color(0xdec69a),
    campfireLightIntensity: 1.2,
    starsOpacity: 0.0,
    moonOpacity: 0.0,
  },
  sunset: {
    skyColor: new THREE.Color(0xeb8e55),
    fogColor: new THREE.Color(0xf5a575),
    fogDensity: 0.024,
    ambientColor: new THREE.Color(0xfde047),
    ambientIntensity: 0.65,
    sunColor: new THREE.Color(0xf97316),
    sunIntensity: 1.35,
    sunPos: new THREE.Vector3(26, 11, -12),
    groundColor: new THREE.Color(0xd9a26c),
    campfireLightIntensity: 2.2,
    starsOpacity: 0.25,
    moonOpacity: 0.35,
  },
  night: {
    // tons azulados e sombrios de noite
    skyColor: new THREE.Color(0x0f172a),
    fogColor: new THREE.Color(0x1e293b),
    fogDensity: 0.028,
    ambientColor: new THREE.Color(0x172554),
    ambientIntensity: 0.32,
    sunColor: new THREE.Color(0x60a5fa), // luar azulado límpido
    sunIntensity: 0.38,
    sunPos: new THREE.Vector3(-18, 26, -18),
    groundColor: new THREE.Color(0x55493d),
    campfireLightIntensity: 3.8, // fogueira brilhando intensamente no escuro!
    starsOpacity: 0.92,
    moonOpacity: 1.0,
  },
  dawn: {
    skyColor: new THREE.Color(0xc084fc),
    fogColor: new THREE.Color(0xedd5f5),
    fogDensity: 0.024,
    ambientColor: new THREE.Color(0xfef3c7),
    ambientIntensity: 0.72,
    sunColor: new THREE.Color(0xfde047),
    sunIntensity: 1.25,
    sunPos: new THREE.Vector3(-22, 12, 16),
    groundColor: new THREE.Color(0xcbb88b),
    campfireLightIntensity: 1.6,
    starsOpacity: 0.15,
    moonOpacity: 0.15,
  },
};

export type IdleActionType =
  | 'sway'
  | 'look_around'
  | 'sit'
  | 'warm_hands'
  | 'scratch_head';

interface VillagerAgent {
  villager: Villager;
  rig: CharacterRig;
  pos: THREE.Vector3;
  target: THREE.Vector3;
  state:
    | 'walking_to_resource'
    | 'working'
    | 'carrying_to_storage'
    | 'idle'
    | 'eating_meal'
    | 'sleeping';
  workTimer: number;
  speed: number;
  idleAction: IdleActionType;
  idleTimer: number;
  idleDuration: number;
  idleSitTransition: number;
  idleLookAngle: number;
  idleSeed: number;
}

export const ThreeVillageScene: React.FC<ThreeVillageSceneProps> = ({
  gameState,
  selectedVillagerId,
  onSelectVillager,
  onVillagerGathers,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Camera state refs
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const camAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 14 });
  const camTargetRef = useRef(new THREE.Vector3(0, 0.8, 0));
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isRightClickRef = useRef(false);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const agentsRef = useRef<Map<string, VillagerAgent>>(new Map());
  const buildingsGroupRef = useRef<THREE.Group | null>(null);
  const campfireGroupRef = useRef<THREE.Group | null>(null);

  // Atmospheric Lighting & Day/Night Transition Refs
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const groundMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const starsPointsRef = useRef<THREE.Points | null>(null);
  const moonMeshRef = useRef<THREE.Mesh | null>(null);
  const currentSkyColorRef = useRef<THREE.Color>(new THREE.Color(0xdce7eb));
  const currentFogColorRef = useRef<THREE.Color>(new THREE.Color(0xdce7eb));

  // Time of Day State driven directly by continuous gameState.gameHour
  const [timeOfDayOverride, setTimeOfDayOverride] = useState<'auto' | TimeOfDay>('auto');

  const effectiveTimeOfDay: TimeOfDay = useMemo(() => {
    if (timeOfDayOverride !== 'auto') return timeOfDayOverride;
    const hour = gameState.gameHour ?? 6.0;
    // 05:30 - 08:00 -> Alvorada / Amanhecer
    if (hour >= 5.5 && hour < 8.0) return 'dawn';
    // 08:00 - 17.5 -> Dia Pleno
    if (hour >= 8.0 && hour < 17.5) return 'day';
    // 17.5 - 19.5 -> Pôr do Sol / Entardecer
    if (hour >= 17.5 && hour < 19.5) return 'sunset';
    // 19.5 - 05.30 -> Noite Sombria
    return 'night';
  }, [gameState.gameHour, timeOfDayOverride]);

  const currentRoutine = useMemo(() => {
    return getCelestialTimeInfo(gameState.gameHour ?? 6.0).routine;
  }, [gameState.gameHour]);

  const prevRoutineRef = useRef<DailyRoutine>(currentRoutine);

  const effectiveTimeOfDayRef = useRef<TimeOfDay>(effectiveTimeOfDay);
  useEffect(() => {
    effectiveTimeOfDayRef.current = effectiveTimeOfDay;
  }, [effectiveTimeOfDay]);

  const onVillagerGathersRef = useRef(onVillagerGathers);
  useEffect(() => {
    onVillagerGathersRef.current = onVillagerGathers;
  }, [onVillagerGathers]);

  // Touch state
  const touchStartDistRef = useRef<number | null>(null);

  // Follow camera mode
  const [followVillager, setFollowVillager] = useState(false);

  // Resource nodes positions (Áreas específicas da tela baseadas nos cargos)
  const RESOURCE_NODES = {
    wheat: new THREE.Vector3(-6.5, 0, 4.0),
    wood: new THREE.Vector3(-6.0, 0, -5.5),
    stone: new THREE.Vector3(6.5, 0, -4.5),
    clay: new THREE.Vector3(7.0, 0, 3.5),
    storage: new THREE.Vector3(0, 0, 1.2),
    campfire: new THREE.Vector3(0, 0, -0.8),
    buildersite: new THREE.Vector3(3.0, 0, 0),
    elderDesk: new THREE.Vector3(-2.2, 0, -2.8),
    guardPost: new THREE.Vector3(5.5, 0, 5.0),
  };

  // 1. Initial Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xdce7eb);
    scene.fog = new THREE.FogExp2(0xdce7eb, 0.022);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xfef3c7, 0.9);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Ground Plane (Warm sandy agricultural plain)
    const groundGeo = new THREE.PlaneGeometry(70, 70, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xdec69a,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);
    groundMatRef.current = groundMat;

    // Night Celestial Features: Stars dome and Glowing Moon
    const starCount = 380;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 36 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.8 + 0.15); // upper sky hemisphere
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.9,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.name = 'night_stars';
    scene.add(stars);
    starsPointsRef.current = stars;

    // Stylized glowing Moon in night sky
    const moonGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0,
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-22, 28, -20);
    moon.name = 'night_moon';
    scene.add(moon);
    moonMeshRef.current = moon;

    // Pathways radiating from center
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xc8ab7a, roughness: 1.0 });
    const path1 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 20), pathMat);
    path1.rotation.x = -Math.PI / 2;
    path1.rotation.z = Math.PI / 4;
    path1.position.set(0, 0.005, 0);
    path1.receiveShadow = true;
    scene.add(path1);

    const path2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 20), pathMat);
    path2.rotation.x = -Math.PI / 2;
    path2.rotation.z = -Math.PI / 4;
    path2.position.set(0, 0.005, 0);
    path2.receiveShadow = true;
    scene.add(path2);

    // Permanent Nature Nodes
    // 1. Wheat Patches (Agricultural Farm area)
    const wheatGroup = new THREE.Group();
    wheatGroup.position.copy(RESOURCE_NODES.wheat);
    wheatGroup.add(createWheatPatchMesh());
    const wheatPatch2 = createWheatPatchMesh();
    wheatPatch2.position.set(2.5, 0, -1.0);
    wheatGroup.add(wheatPatch2);
    wheatGroup.name = 'wheat_node';
    scene.add(wheatGroup);

    // 2. Tree Grove (Lumberjack area)
    const forestGroup = new THREE.Group();
    forestGroup.position.copy(RESOURCE_NODES.wood);
    forestGroup.add(createTreeMesh());
    const tree2 = createTreeMesh();
    tree2.position.set(1.6, 0, 1.2);
    forestGroup.add(tree2);
    const tree3 = createTreeMesh();
    tree3.position.set(-1.8, 0, 1.5);
    forestGroup.add(tree3);
    const tree4 = createTreeMesh();
    tree4.position.set(0.5, 0, -2.0);
    forestGroup.add(tree4);
    forestGroup.name = 'forest_node';
    scene.add(forestGroup);

    // 3. Stone Quarry (Rocks area)
    const quarryGroup = new THREE.Group();
    quarryGroup.position.copy(RESOURCE_NODES.stone);
    quarryGroup.add(createRockQuarryMesh());
    quarryGroup.name = 'quarry_node';
    scene.add(quarryGroup);

    // 4. Central Campfire
    const campfire = createCampfireMesh();
    campfire.position.copy(RESOURCE_NODES.campfire);
    campfireGroupRef.current = campfire;
    scene.add(campfire);

    // 5. Clay Pit (Oleiro / potter area)
    const clayGroup = createClayPitMesh();
    clayGroup.position.copy(RESOURCE_NODES.clay);
    clayGroup.name = 'clay_node';
    scene.add(clayGroup);

    // 6. Active Builder Site (Construtor / builder area)
    const builderGroup = createBuilderSiteMesh();
    builderGroup.position.copy(RESOURCE_NODES.buildersite);
    builderGroup.name = 'builder_node';
    scene.add(builderGroup);

    // 7. Elder Study Altar & Table (Ancião / elder research area)
    const elderGroup = createElderDeskMesh();
    elderGroup.position.copy(RESOURCE_NODES.elderDesk);
    elderGroup.name = 'elder_node';
    scene.add(elderGroup);

    // 8. Guard Watchposts (Guarda / guard perimeter posts)
    const guardPost1 = createGuardPostMesh();
    guardPost1.position.copy(RESOURCE_NODES.guardPost);
    guardPost1.name = 'guard_node_1';
    scene.add(guardPost1);

    const guardPost2 = createGuardPostMesh();
    guardPost2.position.set(-5.5, 0, 5.0);
    guardPost2.name = 'guard_node_2';
    scene.add(guardPost2);

    // Buildings container group
    const buildingsGroup = new THREE.Group();
    buildingsGroupRef.current = buildingsGroup;
    scene.add(buildingsGroup);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Campfire flicker animation
      if (campfireGroupRef.current) {
        const flame = campfireGroupRef.current.getObjectByName('flame');
        const innerFlame = campfireGroupRef.current.getObjectByName('innerFlame');
        if (flame) {
          flame.scale.y = 1 + Math.sin(time * 12) * 0.18;
          flame.rotation.y = time * 2;
        }
        if (innerFlame) {
          innerFlame.scale.y = 1 + Math.cos(time * 15) * 0.22;
        }
      }

      // Smooth Atmospheric Lighting & Day/Night Transition
      const targetTimeOfDay = effectiveTimeOfDayRef.current;
      const targetPreset = LIGHTING_PRESETS[targetTimeOfDay];

      if (targetPreset) {
        // Lerp Sky background color smoothly
        currentSkyColorRef.current.lerp(targetPreset.skyColor, 0.04);
        scene.background = currentSkyColorRef.current;

        // Lerp Fog color and density smoothly
        if (scene.fog && scene.fog instanceof THREE.FogExp2) {
          currentFogColorRef.current.lerp(targetPreset.fogColor, 0.04);
          scene.fog.color.copy(currentFogColorRef.current);
          scene.fog.density = THREE.MathUtils.lerp(
            scene.fog.density,
            targetPreset.fogDensity,
            0.04
          );
        }

        // Lerp Ambient Light color and intensity
        if (ambientLightRef.current) {
          ambientLightRef.current.color.lerp(targetPreset.ambientColor, 0.04);
          ambientLightRef.current.intensity = THREE.MathUtils.lerp(
            ambientLightRef.current.intensity,
            targetPreset.ambientIntensity,
            0.04
          );
        }

        // Lerp Directional Light (Sun/Moon) color, intensity, and orbit position
        if (dirLightRef.current) {
          dirLightRef.current.color.lerp(targetPreset.sunColor, 0.04);
          dirLightRef.current.intensity = THREE.MathUtils.lerp(
            dirLightRef.current.intensity,
            targetPreset.sunIntensity,
            0.04
          );

          // Calculate continuous sun/moon position in the sky based on gameHour
          const h = ((gameState.gameHour ?? 6.0) % 24 + 24) % 24;
          let celestialPos = targetPreset.sunPos;
          if (h >= 5.5 && h < 19.5) {
            // Daytime sun arc: rises in east, reaches peak at noon (12:00), sets in west
            const sunProgress = (h - 5.5) / 14.0;
            const sunAngle = sunProgress * Math.PI;
            const sunX = -Math.cos(sunAngle) * 26;
            const sunY = Math.max(3, Math.sin(sunAngle) * 28);
            const sunZ = 12 - sunProgress * 6;
            celestialPos = new THREE.Vector3(sunX, sunY, sunZ);
          } else {
            // Nighttime moon arc
            const nightH = h >= 19.5 ? h - 19.5 : h + 4.5;
            const moonProgress = nightH / 10.0;
            const moonAngle = moonProgress * Math.PI;
            const moonX = -Math.cos(moonAngle) * 24;
            const moonY = Math.max(4, Math.sin(moonAngle) * 26);
            const moonZ = -14;
            celestialPos = new THREE.Vector3(moonX, moonY, moonZ);
          }
          dirLightRef.current.position.lerp(celestialPos, 0.03);
        }

        // Lerp Ground plane tint
        if (groundMatRef.current) {
          groundMatRef.current.color.lerp(targetPreset.groundColor, 0.04);
        }

        // Stars celestial rotation and smooth fade in/out
        if (starsPointsRef.current) {
          starsPointsRef.current.rotation.y = time * 0.003;
          const starsMat = starsPointsRef.current.material as THREE.PointsMaterial;
          starsMat.opacity = THREE.MathUtils.lerp(
            starsMat.opacity,
            targetPreset.starsOpacity,
            0.04
          );
          starsPointsRef.current.visible = starsMat.opacity > 0.01;
        }

        // Moon smooth fade in/out and celestial arc
        if (moonMeshRef.current) {
          const moonMat = moonMeshRef.current.material as THREE.MeshBasicMaterial;
          moonMat.opacity = THREE.MathUtils.lerp(
            moonMat.opacity,
            targetPreset.moonOpacity,
            0.04
          );
          moonMeshRef.current.visible = moonMat.opacity > 0.01;
          const h = ((gameState.gameHour ?? 6.0) % 24 + 24) % 24;
          const nightH = h >= 19.5 ? h - 19.5 : h + 4.5;
          const moonProgress = nightH / 10.0;
          const moonAngle = moonProgress * Math.PI;
          moonMeshRef.current.position.x = -Math.cos(moonAngle) * 26;
          moonMeshRef.current.position.y = Math.sin(moonAngle) * 28 + 4;
          moonMeshRef.current.position.z = -20;
        }

        // Campfire PointLight: extra warm amber illumination and flicker at night!
        if (campfireGroupRef.current) {
          const campfireLight = campfireGroupRef.current.getObjectByName(
            'campfirePointLight'
          ) as THREE.PointLight;
          if (campfireLight) {
            const flicker = Math.sin(time * 15) * 0.35 + Math.cos(time * 23) * 0.15;
            const targetCampfireIntensity = targetPreset.campfireLightIntensity + flicker;
            campfireLight.intensity = THREE.MathUtils.lerp(
              campfireLight.intensity,
              targetCampfireIntensity,
              0.08
            );
          }
        }
      }

      // Update 3D Villagers movement and animations
      updateVillagersAnimation(delta, time);

      // Camera Follow logic if enabled
      if (followVillager && selectedVillagerId && cameraRef.current) {
        const agent = agentsRef.current.get(selectedVillagerId);
        if (agent) {
          camTargetRef.current.lerp(agent.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.08);
          updateCameraPosition();
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Helper to recompute camera position based on angles
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = camAngleRef.current;
    const target = camTargetRef.current;

    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  // 2. Synchronize Buildings in 3D Scene
  useEffect(() => {
    if (!buildingsGroupRef.current) return;
    const bg = buildingsGroupRef.current;

    // Clear old building meshes
    while (bg.children.length > 0) {
      bg.remove(bg.children[0]);
    }

    const { buildings, zigguratStagesCompleted } = gameState;

    // Starter or built huts
    const hutsCount = buildings.hut?.count || 1;
    const stoneDwellingsCount = buildings.stone_dwelling?.count || 0;

    // Main starter shelter
    if (stoneDwellingsCount > 0) {
      const stoneHouse = createStoneDwellingMesh();
      stoneHouse.position.set(-2.8, 0, -1.8);
      bg.add(stoneHouse);
    } else {
      const hut1 = createHutMesh();
      hut1.position.set(-2.8, 0, -1.8);
      bg.add(hut1);
    }

    // Additional houses
    if (hutsCount > 1 || stoneDwellingsCount > 1) {
      const hut2 = stoneDwellingsCount > 1 ? createStoneDwellingMesh() : createHutMesh();
      hut2.position.set(-2.8, 0, 1.8);
      bg.add(hut2);
    }
    if (stoneDwellingsCount > 2) {
      const hut3 = createStoneDwellingMesh();
      hut3.position.set(2.8, 0, -2.0);
      bg.add(hut3);
    }

    // Granary
    if ((buildings.granary?.count || 0) > 0) {
      const granary = createGranaryMesh();
      granary.position.set(0, 0, 4.0);
      bg.add(granary);
    }

    // Well
    if ((buildings.village_well?.count || 0) > 0) {
      const well = createWellMesh();
      well.position.set(0, 0, -3.8);
      bg.add(well);
    }

    // Longhouse
    if ((buildings.longhouse?.count || 0) > 0) {
      const longhouse = createLonghouseMesh();
      longhouse.position.set(0, 0, -1.0);
      bg.add(longhouse);
    }

    // Ziggurat Monument
    if ((buildings.ziggurat?.count || 0) > 0 || zigguratStagesCompleted > 0) {
      const ziggurat = createZigguratMesh(Math.max(1, zigguratStagesCompleted));
      ziggurat.position.set(0, 0, -14.0);
      bg.add(ziggurat);
    }
  }, [gameState.buildings, gameState.zigguratStagesCompleted]);

  // 3. Synchronize 3D Villagers
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const currentAgents = agentsRef.current;

    // Existing IDs
    const currentIds = new Set(gameState.villagers.map((v) => v.id));

    // Remove deleted agents
    currentAgents.forEach((agent, id) => {
      if (!currentIds.has(id)) {
        scene.remove(agent.rig.root);
        currentAgents.delete(id);
      }
    });

    // Add or update agents
    gameState.villagers.forEach((villager, index) => {
      let agent = currentAgents.get(villager.id);

      if (!agent) {
        const rig = createCharacterMesh(villager);
        // Starting positions near campfire for the first two villagers
        const startX = index === 0 ? -1.0 : 1.0;
        const startZ = index === 0 ? -0.5 : 0.5;
        const initialPos = new THREE.Vector3(startX, 0, startZ);

        rig.root.position.copy(initialPos);
        scene.add(rig.root);

        agent = {
          villager,
          rig,
          pos: initialPos,
          target: initialPos.clone(),
          state: 'idle',
          workTimer: 0,
          speed: 1.8,
          idleAction: (index % 2 === 0 ? 'sway' : 'look_around') as IdleActionType,
          idleTimer: Math.random() * 2,
          idleDuration: 4.5 + Math.random() * 3.5,
          idleSitTransition: 0,
          idleLookAngle: (Math.random() - 0.5) * 1.2,
          idleSeed: index * 2.17 + Math.random() * 5,
        };
        agent.speed = 2.1;
        currentAgents.set(villager.id, agent);
        // Direct movement to assigned workplace
        assignAgentJobBehavior(agent, villager.job, true);
      } else {
        const jobChanged = agent.villager.job !== villager.job;
        if (jobChanged) {
          setupToolForJob(agent.rig.toolSlot, villager.job);
        }
        agent.villager = villager;

        // If job changed via task bar, immediately send the villager to their new area!
        if (jobChanged) {
          assignAgentJobBehavior(agent, villager.job, true);
        }
      }
    });
  }, [gameState.villagers]);

  // Synchronize 3D villagers when routine changes (e.g. dawn breakfast, noon lunch, evening dinner)
  useEffect(() => {
    if (prevRoutineRef.current !== currentRoutine) {
      prevRoutineRef.current = currentRoutine;
      agentsRef.current.forEach((agent) => {
        assignAgentJobBehavior(agent, agent.villager.job);
      });
    }
  }, [currentRoutine]);

  const assignAgentJobBehavior = (
    agent: VillagerAgent,
    job: JobType,
    forceWork: boolean = false
  ) => {
    const routine = getCelestialTimeInfo(gameState.gameHour ?? 6.0).routine;

    // 1. REFEIÇÕES / DESCANSO: Somente se não for atribuição manual direta ou início de turno
    if (!forceWork) {
      if (routine === 'breakfast' || routine === 'lunch' || routine === 'dinner') {
        const agentKeys = Array.from(agentsRef.current.keys());
        const idx = agentKeys.indexOf(agent.villager.id);
        const angle = (idx / Math.max(1, agentKeys.length)) * Math.PI * 2;
        const radius = 1.45 + Math.sin(angle * 4) * 0.25;
        agent.target = RESOURCE_NODES.campfire.clone().add(
          new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
        );
        agent.state = 'eating_meal';
        agent.rig.wheatCarry.visible = false;
        agent.rig.toolSlot.visible = false;
        agent.rig.mealBowl.visible = true;
        return;
      }

      if (routine === 'sleep') {
        const agentKeys = Array.from(agentsRef.current.keys());
        const idx = agentKeys.indexOf(agent.villager.id);
        const angle = (idx / Math.max(1, agentKeys.length)) * Math.PI * 2 + Math.PI;
        const radius = 1.8 + Math.cos(angle * 3) * 0.3;
        agent.target = RESOURCE_NODES.campfire.clone().add(
          new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
        );
        agent.state = 'sleeping';
        agent.rig.wheatCarry.visible = false;
        agent.rig.toolSlot.visible = false;
        agent.rig.mealBowl.visible = false;
        return;
      }
    }

    // 2. HORÁRIO DE TRABALHO / ATRIBUIÇÃO DE CARGO:
    // Move o aldeão diretamente para a área específica da tela baseada no cargo atribuído
    agent.rig.mealBowl.visible = false;
    agent.rig.toolSlot.visible = true;
    setupToolForJob(agent.rig.toolSlot, job);

    if (job === 'farmer') {
      // 🌾 Move para os CAMPOS DE TRIGO
      agent.target = RESOURCE_NODES.wheat.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 2.2, 0, (Math.random() - 0.5) * 2.2)
      );
      agent.state = 'walking_to_resource';
      agent.rig.wheatCarry.visible = false;
    } else if (job === 'lumberjack') {
      // 🪵 Move para a FLORESTA / BOSQUE DE CONÍFERAS
      agent.target = RESOURCE_NODES.wood.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 2.2, 0, (Math.random() - 0.5) * 2.2)
      );
      agent.state = 'walking_to_resource';
      agent.rig.wheatCarry.visible = false;
    } else if (job === 'quarryman') {
      // 🪨 Move para a PEDREIRA DE ROCHAS
      agent.target = RESOURCE_NODES.stone.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 1.8, 0, (Math.random() - 0.5) * 1.8)
      );
      agent.state = 'walking_to_resource';
      agent.rig.wheatCarry.visible = false;
    } else if (job === 'potter') {
      // 🧱 Move para a MARGEM FLUVIAL DE ARGILA
      agent.target = RESOURCE_NODES.clay.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 1.8, 0, (Math.random() - 0.5) * 1.8)
      );
      agent.state = 'walking_to_resource';
      agent.rig.wheatCarry.visible = false;
    } else if (job === 'builder') {
      // 🔨 Move para o CANTEIRO DE OBRAS E ANDAIMES
      agent.target = RESOURCE_NODES.buildersite.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 1.6, 0, (Math.random() - 0.5) * 1.6)
      );
      agent.state = 'walking_to_resource';
      agent.rig.wheatCarry.visible = false;
    } else if (job === 'guard') {
      // 🛡️ Move para os POSTOS DE PATRULHA E DEFESA
      const side = Math.random() > 0.5 ? 1 : -1;
      agent.target = new THREE.Vector3(5.2 * side, 0, 5.0 + (Math.random() - 0.5) * 1.5);
      agent.state = 'walking_to_resource';
      agent.rig.wheatCarry.visible = false;
    } else if (job === 'elder') {
      // 📜 Move para a MESA DE ESTUDOS E SABEDORIA
      agent.target = RESOURCE_NODES.elderDesk.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8)
      );
      agent.state = 'walking_to_resource';
      agent.rig.wheatCarry.visible = false;
    } else {
      // 💤 Aldeão livre / desocupado: permanece no Centro / Fogueira
      agent.target = RESOURCE_NODES.campfire.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 2.8, 0, (Math.random() - 0.5) * 2.8)
      );
      agent.state = 'idle';
      agent.rig.wheatCarry.visible = false;
      agent.idleTimer = 0;
      agent.idleDuration = 4.0 + Math.random() * 4.0;
    }
  };

  // 4. Update Villagers Animation Frame Loop
  const updateVillagersAnimation = (delta: number, time: number) => {
    agentsRef.current.forEach((agent) => {
      const { rig, pos, target } = agent;
      const isSelected = selectedVillagerId === agent.villager.id;

      // Distance to target
      const dist = pos.distanceTo(target);
      const isMoving = dist > 0.25;

      if (isMoving) {
        // Move towards target
        const dir = target.clone().sub(pos).normalize();
        pos.add(dir.multiplyScalar(agent.speed * delta));
        rig.root.position.copy(pos);

        // Rotate smoothly towards movement direction
        const targetRotation = Math.atan2(dir.x, dir.z);
        rig.root.rotation.y = THREE.MathUtils.lerp(rig.root.rotation.y, targetRotation, 0.15);

        // Walking Leg & Arm Swing (Morphe stickman cartoon stride)
        // Recover from sitting if was sitting
        agent.idleSitTransition = THREE.MathUtils.lerp(agent.idleSitTransition, 0, 0.2);
        rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, 0, 0.2);
        rig.head.rotation.set(0, 0, 0);
        rig.body.rotation.set(0, 0, 0);

        const walkFreq = 9;
        const swing = Math.sin(time * walkFreq) * 0.55;
        rig.leftLeg.rotation.x = swing;
        rig.rightLeg.rotation.x = -swing;
        rig.leftArm.rotation.x = -swing * 0.7;
        rig.rightArm.rotation.x = swing * 0.7;
        rig.leftArm.rotation.z = 0;
        rig.rightArm.rotation.z = 0;
        rig.head.position.y = 1.35 + Math.abs(Math.sin(time * walkFreq)) * 0.04;
      } else {
        // Idle / Working pose
        rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, 0.2);
        rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, 0.2);

        // Working behaviors
        if (agent.state === 'working') {
          // Recover to standing height when working
          agent.idleSitTransition = THREE.MathUtils.lerp(agent.idleSitTransition, 0, 0.2);
          rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, 0, 0.2);
          rig.head.rotation.set(0, 0, 0);

          agent.workTimer += delta;

          // Action specific animations
          if (agent.villager.job === 'farmer') {
            // Sickle Reaping Motion (bent down swinging sickle)
            rig.body.rotation.x = 0.25;
            rig.rightArm.rotation.x = Math.sin(time * 6) * 0.8 + 0.4;
            rig.leftArm.rotation.x = 0.3;
          } else if (agent.villager.job === 'lumberjack') {
            // Axe chopping motion
            rig.rightArm.rotation.x = Math.sin(time * 5) * 1.1;
            rig.leftArm.rotation.x = Math.sin(time * 5) * 0.9;
          } else if (agent.villager.job === 'quarryman' || agent.villager.job === 'builder') {
            // Hammering / chisel motion
            rig.rightArm.rotation.x = Math.sin(time * 8) * 0.7;
          } else if (agent.villager.job === 'guard') {
            // Standing at attention, glancing around
            rig.head.rotation.y = Math.sin(time * 1.5) * 0.35;
          } else if (agent.villager.job === 'elder') {
            // Studying tablet
            rig.body.rotation.x = 0.15;
            rig.rightArm.rotation.x = 0.5 + Math.sin(time * 4) * 0.1;
          }

          // Finish work cycle: carry resources back to storehouse!
          if (agent.workTimer >= 4.0) {
            agent.workTimer = 0;
            if (agent.villager.job === 'farmer') {
              agent.rig.wheatCarry.visible = true;
              agent.target = RESOURCE_NODES.storage.clone();
              agent.state = 'carrying_to_storage';
              audio.playHarvest();
            } else if (agent.villager.job === 'lumberjack') {
              agent.target = RESOURCE_NODES.storage.clone();
              agent.state = 'carrying_to_storage';
              audio.playWood();
            } else if (agent.villager.job === 'quarryman') {
              agent.target = RESOURCE_NODES.storage.clone();
              agent.state = 'carrying_to_storage';
              audio.playStone();
            } else {
              // Stay working or roam slightly
              agent.workTimer = 0;
            }
          }
        } else if (agent.state === 'carrying_to_storage') {
          // Reached storehouse / campfire
          agent.rig.wheatCarry.visible = false;
          rig.body.rotation.x = 0;

          // Deposit to storage
          if (agent.villager.job === 'farmer') {
            onVillagerGathersRef.current?.('food', 1);
          } else if (agent.villager.job === 'lumberjack') {
            onVillagerGathersRef.current?.('wood', 1);
          } else if (agent.villager.job === 'quarryman') {
            onVillagerGathersRef.current?.('stone', 1);
          } else if (agent.villager.job === 'potter') {
            onVillagerGathersRef.current?.('clay', 1);
          }

          // Return to assigned resource area (or join meal if currently breakfast/lunch/dinner)
          assignAgentJobBehavior(agent, agent.villager.job, false);
        } else if (agent.state === 'walking_to_resource') {
          // Reached resource node -> begin working!
          agent.state = 'working';
          agent.workTimer = 0;
        } else if (agent.state === 'eating_meal') {
          // =========================================================================
          // REFEIÇÃO COLETIVA: Café ao amanhecer, Almoço ao meio-dia, Jantar à noite
          // =========================================================================
          rig.mealBowl.visible = true;
          rig.toolSlot.visible = false;
          rig.wheatCarry.visible = false;

          // Sentar confortavelmente ao redor da fogueira
          agent.idleSitTransition = THREE.MathUtils.lerp(agent.idleSitTransition, 1.0, 0.08);
          rig.root.position.y = -0.42 * agent.idleSitTransition;
          rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, Math.PI / 2.2, 0.08);
          rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, Math.PI / 2.2, 0.08);
          rig.leftLeg.rotation.z = -0.12 * agent.idleSitTransition;
          rig.rightLeg.rotation.z = 0.12 * agent.idleSitTransition;

          // Segurar tigela com a mão esquerda
          rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0.72, 0.1);
          rig.leftArm.rotation.z = -0.15;

          // Mão direita leva o alimento à boca ciclicamente
          const eatCycle = Math.sin(time * 3.2 + agent.idleSeed);
          rig.rightArm.rotation.x = THREE.MathUtils.lerp(
            rig.rightArm.rotation.x,
            0.75 + eatCycle * 0.45,
            0.15
          );
          rig.rightArm.rotation.z = 0.18;

          // Cabeça saboreia com movimentos suaves
          rig.head.rotation.x = THREE.MathUtils.lerp(
            rig.head.rotation.x,
            0.12 - (eatCycle > 0 ? 0.08 : -0.05),
            0.1
          );
          rig.head.rotation.y = THREE.MathUtils.lerp(
            rig.head.rotation.y,
            Math.sin(time * 0.8 + agent.idleSeed) * 0.15,
            0.05
          );
          rig.head.position.y = 1.35 + Math.sin(time * 2.2) * 0.02;
        } else if (agent.state === 'sleeping') {
          // =========================================================================
          // DESCANSO NOTURNO
          // =========================================================================
          rig.mealBowl.visible = false;
          rig.toolSlot.visible = false;
          rig.wheatCarry.visible = false;

          agent.idleSitTransition = THREE.MathUtils.lerp(agent.idleSitTransition, 1.0, 0.08);
          rig.root.position.y = -0.42 * agent.idleSitTransition;
          rig.leftLeg.rotation.x = Math.PI / 2.2;
          rig.rightLeg.rotation.x = Math.PI / 2.2;
          rig.leftArm.rotation.x = 0.58;
          rig.rightArm.rotation.x = 0.58;
          rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, 0.25, 0.08);
          rig.head.position.y = 1.32 + Math.sin(time * 1.4 + agent.idleSeed) * 0.02;
        } else {
          // =========================================================================
          // IDLE CYCLES SYSTEM: Sway, Look Around, Sit, Warm Hands, Scratch Head
          // =========================================================================
          agent.idleTimer += delta;

          // Transition to next idle activity
          if (agent.idleTimer >= agent.idleDuration) {
            agent.idleTimer = 0;
            agent.idleDuration = 4.5 + Math.random() * 4.0;

            const distToFire = pos.distanceTo(RESOURCE_NODES.campfire);
            const rand = Math.random();

            if (distToFire < 3.2) {
              // High chance to sit or warm hands near the campfire
              if (rand < 0.35) {
                agent.idleAction = 'sit';
              } else if (rand < 0.60) {
                agent.idleAction = 'warm_hands';
              } else if (rand < 0.80) {
                agent.idleAction = 'look_around';
                agent.idleLookAngle = (Math.random() - 0.5) * 1.3;
              } else {
                agent.idleAction = 'sway';
              }
            } else {
              // Away from campfire
              if (rand < 0.35) {
                agent.idleAction = 'look_around';
                agent.idleLookAngle = (Math.random() - 0.5) * 1.4;
              } else if (rand < 0.65) {
                agent.idleAction = 'sway';
              } else if (rand < 0.82) {
                agent.idleAction = 'scratch_head';
              } else {
                agent.idleAction = 'sit';
              }
            }

            // Small chance to walk to a new spot around the campfire (18% chance)
            if (Math.random() < 0.18) {
              agent.target = RESOURCE_NODES.campfire.clone().add(
                new THREE.Vector3((Math.random() - 0.5) * 3.0, 0, (Math.random() - 0.5) * 3.0)
              );
            }
          }

          // Execute current idle animation behavior
          if (agent.idleAction === 'sit') {
            // Smoothly sit down on the ground
            agent.idleSitTransition = THREE.MathUtils.lerp(agent.idleSitTransition, 1.0, 0.08);
            rig.root.position.y = -0.42 * agent.idleSitTransition;

            // Fold legs forward in seated pose
            rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, Math.PI / 2.2, 0.08);
            rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, Math.PI / 2.2, 0.08);
            rig.leftLeg.rotation.z = -0.15 * agent.idleSitTransition;
            rig.rightLeg.rotation.z = 0.15 * agent.idleSitTransition;

            // Relaxed torso posture
            rig.body.rotation.x = THREE.MathUtils.lerp(rig.body.rotation.x, -0.06, 0.08);
            rig.body.rotation.y = THREE.MathUtils.lerp(rig.body.rotation.y, 0, 0.1);
            rig.body.rotation.z = THREE.MathUtils.lerp(rig.body.rotation.z, 0, 0.1);

            // Arms resting peacefully on lap/knees
            rig.leftArm.rotation.x = THREE.MathUtils.lerp(
              rig.leftArm.rotation.x,
              0.62 + Math.sin(time * 1.5 + agent.idleSeed) * 0.02,
              0.08
            );
            rig.rightArm.rotation.x = THREE.MathUtils.lerp(
              rig.rightArm.rotation.x,
              0.62 + Math.sin(time * 1.5 + agent.idleSeed) * 0.02,
              0.08
            );
            rig.leftArm.rotation.z = -0.12 * agent.idleSitTransition;
            rig.rightArm.rotation.z = 0.12 * agent.idleSitTransition;

            // Head breathing bob and subtle gaze
            rig.head.position.y = 1.35 + Math.sin(time * 2.0 + agent.idleSeed) * 0.025;
            rig.head.rotation.y = THREE.MathUtils.lerp(
              rig.head.rotation.y,
              Math.sin(time * 0.8 + agent.idleSeed) * 0.15,
              0.05
            );
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, 0.08, 0.08);
            rig.head.rotation.z = THREE.MathUtils.lerp(rig.head.rotation.z, 0, 0.08);
          } else if (agent.idleAction === 'sway') {
            // Standing gentle body sway and rhythmic breathing
            agent.idleSitTransition = THREE.MathUtils.lerp(agent.idleSitTransition, 0.0, 0.1);
            rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, 0, 0.1);
            rig.leftLeg.rotation.set(0, 0, 0);
            rig.rightLeg.rotation.set(0, 0, 0);

            // Weight shifting from left to right foot
            const swayZ = Math.sin(time * 1.3 + agent.idleSeed) * 0.045;
            rig.body.rotation.z = swayZ;
            rig.body.rotation.y = THREE.MathUtils.lerp(rig.body.rotation.y, 0, 0.1);
            rig.body.rotation.x = THREE.MathUtils.lerp(
              rig.body.rotation.x,
              Math.sin(time * 1.8 + agent.idleSeed) * 0.03,
              0.1
            );

            // Head balances with slight counter-tilt and gentle breathing
            rig.head.position.y = 1.35 + Math.sin(time * 2.2 + agent.idleSeed) * 0.03;
            rig.head.rotation.z = -swayZ * 0.6;
            rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, 0, 0.08);
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, 0, 0.08);

            // Arms dangle and sway naturally with body weight
            rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0.06, 0.1);
            rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0.06, 0.1);
            rig.leftArm.rotation.z = swayZ * 1.2 - 0.05;
            rig.rightArm.rotation.z = swayZ * 1.2 + 0.05;
          } else if (agent.idleAction === 'look_around') {
            // Standing looking around curiously
            agent.idleSitTransition = THREE.MathUtils.lerp(agent.idleSitTransition, 0.0, 0.1);
            rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, 0, 0.1);
            rig.leftLeg.rotation.set(0, 0, 0);
            rig.rightLeg.rotation.set(0, 0, 0);

            const p = agent.idleTimer / agent.idleDuration;
            let lookAngle = agent.idleLookAngle;
            let pitch = 0.04;
            if (p < 0.4) {
              lookAngle = agent.idleLookAngle;
            } else if (p < 0.65) {
              lookAngle = 0;
              pitch = -0.16; // glances up towards the clouds
            } else {
              lookAngle = -agent.idleLookAngle * 0.85;
            }

            rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, lookAngle, 0.07);
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, pitch, 0.07);
            rig.head.rotation.z = THREE.MathUtils.lerp(rig.head.rotation.z, Math.sin(time * 2.0) * 0.03, 0.07);
            rig.head.position.y = 1.35 + Math.sin(time * 2.0 + agent.idleSeed) * 0.02;

            // Torso turns slightly with head
            rig.body.rotation.y = rig.head.rotation.y * 0.28;
            rig.body.rotation.x = THREE.MathUtils.lerp(rig.body.rotation.x, 0, 0.1);
            rig.body.rotation.z = THREE.MathUtils.lerp(rig.body.rotation.z, 0, 0.1);

            // One hand on hip in thoughtful observer pose
            rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0.32, 0.08);
            rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, -0.22, 0.08);
            rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0.04, 0.08);
            rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0.06, 0.08);
          } else if (agent.idleAction === 'warm_hands') {
            // Warming hands near the campfire heat
            agent.idleSitTransition = THREE.MathUtils.lerp(agent.idleSitTransition, 0.0, 0.1);
            rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, 0, 0.1);
            rig.leftLeg.rotation.set(0, 0, 0);
            rig.rightLeg.rotation.set(0, 0, 0);

            // Arms extended toward fire with subtle rubbing
            rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0.82 + Math.sin(time * 2.5) * 0.02, 0.1);
            rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0.82 + Math.sin(time * 2.5) * 0.02, 0.1);
            rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, -0.16 + Math.sin(time * 6) * 0.025, 0.1);
            rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0.16 - Math.sin(time * 6) * 0.025, 0.1);

            // Gentle forward torso lean into warmth
            rig.body.rotation.x = THREE.MathUtils.lerp(rig.body.rotation.x, 0.12, 0.08);
            rig.body.rotation.y = THREE.MathUtils.lerp(rig.body.rotation.y, 0, 0.08);
            rig.body.rotation.z = THREE.MathUtils.lerp(rig.body.rotation.z, 0, 0.08);

            // Head looking warmly forward/down
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, 0.14, 0.08);
            rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, 0, 0.08);
            rig.head.position.y = 1.35 + Math.sin(time * 2.2) * 0.02;
          } else if (agent.idleAction === 'scratch_head') {
            // Pondering: right hand scratches head, body relaxed
            agent.idleSitTransition = THREE.MathUtils.lerp(agent.idleSitTransition, 0.0, 0.1);
            rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, 0, 0.1);
            rig.leftLeg.rotation.set(0, 0, 0);
            rig.rightLeg.rotation.set(0, 0, 0);

            rig.rightArm.rotation.x = THREE.MathUtils.lerp(
              rig.rightArm.rotation.x,
              -2.05 + Math.sin(time * 7 + agent.idleSeed) * 0.07,
              0.12
            );
            rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0.42, 0.12);
            rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0.05, 0.1);
            rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, -0.06, 0.1);

            // Head tilts into the hand
            rig.head.rotation.z = THREE.MathUtils.lerp(rig.head.rotation.z, -0.14, 0.1);
            rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, 0.12, 0.1);
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, 0.06, 0.1);
            rig.head.position.y = 1.35 + Math.sin(time * 2.2 + agent.idleSeed) * 0.02;
            rig.body.rotation.set(0, 0, 0);
          }
        }
      }

      // Highlight selected villager with subtle head scale pulse
      if (isSelected) {
        rig.head.scale.setScalar(1.08 + Math.sin(time * 5) * 0.04);
      } else {
        rig.head.scale.setScalar(1.0);
      }
    });
  };

  // 5. Mouse / Touch Orbit Controls & Raycasting Selection
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    isRightClickRef.current = e.button === 2;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    if (isRightClickRef.current) {
      // Pan camera target
      const panSpeed = 0.015;
      const angle = camAngleRef.current.theta;
      camTargetRef.current.x -= (Math.cos(angle) * dx - Math.sin(angle) * dy) * panSpeed;
      camTargetRef.current.z -= (Math.sin(angle) * dx + Math.cos(angle) * dy) * panSpeed;
    } else {
      // Rotate camera
      camAngleRef.current.theta -= dx * 0.007;
      camAngleRef.current.phi = Math.max(
        0.2,
        Math.min(Math.PI / 2.1, camAngleRef.current.phi - dy * 0.007)
      );
    }
    updateCameraPosition();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    camAngleRef.current.radius = Math.max(
      5,
      Math.min(32, camAngleRef.current.radius + e.deltaY * 0.02)
    );
    updateCameraPosition();
  };

  // Touch Support (Single touch rotate, pinch zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      camAngleRef.current.theta -= dx * 0.007;
      camAngleRef.current.phi = Math.max(
        0.2,
        Math.min(Math.PI / 2.1, camAngleRef.current.phi - dy * 0.007)
      );
      updateCameraPosition();
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const pinchDelta = touchStartDistRef.current - currentDist;
      touchStartDistRef.current = currentDist;

      camAngleRef.current.radius = Math.max(
        5,
        Math.min(32, camAngleRef.current.radius + pinchDelta * 0.05)
      );
      updateCameraPosition();
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchStartDistRef.current = null;
  };

  // Click on 3D objects (Raycasting)
  const handleClick = (e: React.MouseEvent) => {
    if (!mountRef.current || !sceneRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // Raycast character roots
    const characterObjects: THREE.Object3D[] = [];
    agentsRef.current.forEach((agent) => {
      characterObjects.push(agent.rig.root);
    });

    const intersects = raycaster.intersectObjects(characterObjects, true);
    if (intersects.length > 0) {
      // Find which villager was clicked
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.name.startsWith('character-')) {
        obj = obj.parent;
      }
      if (obj) {
        const id = obj.name.replace('character-', '');
        const clickedVillager = gameState.villagers.find((v) => v.id === id);
        if (clickedVillager) {
          audio.playWood();
          onSelectVillager(clickedVillager);
          return;
        }
      }
    }

    // Raycast ground / nodes if a villager is already selected to command them!
    if (selectedVillagerId) {
      const groundIntersects = raycaster.intersectObjects(sceneRef.current.children, true);
      const groundHit = groundIntersects.find(
        (hit) => hit.object.name === 'ground' || hit.point.y < 0.2
      );

      if (groundHit) {
        const agent = agentsRef.current.get(selectedVillagerId);
        if (agent) {
          agent.target.copy(groundHit.point);
          agent.target.y = 0;
          agent.state = 'walking_to_resource';
          audio.playWood();
        }
      }
    }
  };

  // Camera presets focused on task areas
  const resetCamera = (
    preset: 'overview' | 'fields' | 'camp' | 'quarry' | 'forest' | 'clay' | 'builder'
  ) => {
    if (preset === 'overview') {
      camAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 16 };
      camTargetRef.current.set(0, 0.8, 0);
    } else if (preset === 'fields') {
      camAngleRef.current = { theta: Math.PI / 1.8, phi: Math.PI / 3.4, radius: 10 };
      camTargetRef.current.set(-6.5, 0.8, 4.0);
    } else if (preset === 'forest') {
      camAngleRef.current = { theta: Math.PI * 0.75, phi: Math.PI / 3.3, radius: 11 };
      camTargetRef.current.set(-6.0, 0.8, -5.5);
    } else if (preset === 'quarry') {
      camAngleRef.current = { theta: -Math.PI / 3, phi: Math.PI / 3.4, radius: 10 };
      camTargetRef.current.set(6.5, 0.8, -4.5);
    } else if (preset === 'clay') {
      camAngleRef.current = { theta: -Math.PI * 0.65, phi: Math.PI / 3.3, radius: 10 };
      camTargetRef.current.set(7.0, 0.8, 3.5);
    } else if (preset === 'builder') {
      camAngleRef.current = { theta: -Math.PI / 5, phi: Math.PI / 3.2, radius: 9 };
      camTargetRef.current.set(3.0, 0.8, 0);
    } else if (preset === 'camp') {
      camAngleRef.current = { theta: 0, phi: Math.PI / 3.0, radius: 8 };
      camTargetRef.current.set(0, 0.8, 0);
    }
    updateCameraPosition();
  };

  const selectedVillager = gameState.villagers.find((v) => v.id === selectedVillagerId);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#DCE7EB] cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D View Controls HUD Bar (Positioned below top game header) */}
      <div className="absolute top-16 right-3 sm:right-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        {/* Camera Preset Quick Buttons focused on Work Areas */}
        <div className="pointer-events-auto bg-[#FDFBF7]/95 backdrop-blur-xs border-2 border-[#33261D] p-1 rounded-xl shadow-md flex items-center gap-1 overflow-x-auto max-w-[85vw] sm:max-w-none">
          <button
            onClick={() => resetCamera('overview')}
            className="px-2 py-1 text-[11px] font-bold rounded-lg hover:bg-[#EFE4CE] text-stone-800 transition-colors whitespace-nowrap"
            title="Visão Geral da Aldeia"
          >
            Geral
          </button>
          <button
            onClick={() => resetCamera('fields')}
            className="px-2 py-1 text-[11px] font-bold rounded-lg hover:bg-[#EFE4CE] text-stone-800 transition-colors whitespace-nowrap"
            title="Campos de Trigo (Agricultores)"
          >
            🌾 Trigo
          </button>
          <button
            onClick={() => resetCamera('forest')}
            className="px-2 py-1 text-[11px] font-bold rounded-lg hover:bg-[#EFE4CE] text-stone-800 transition-colors whitespace-nowrap"
            title="Floresta de Coníferas (Lenhadores)"
          >
            🪵 Floresta
          </button>
          <button
            onClick={() => resetCamera('quarry')}
            className="px-2 py-1 text-[11px] font-bold rounded-lg hover:bg-[#EFE4CE] text-stone-800 transition-colors whitespace-nowrap"
            title="Pedreira de Rochas (Pedreiros)"
          >
            🪨 Pedreira
          </button>
          <button
            onClick={() => resetCamera('clay')}
            className="px-2 py-1 text-[11px] font-bold rounded-lg hover:bg-[#EFE4CE] text-stone-800 transition-colors whitespace-nowrap"
            title="Margem Fluvial de Argila (Oleiros)"
          >
            🧱 Argila
          </button>
          <button
            onClick={() => resetCamera('builder')}
            className="px-2 py-1 text-[11px] font-bold rounded-lg hover:bg-[#EFE4CE] text-stone-800 transition-colors whitespace-nowrap"
            title="Canteiro de Obras (Construtores)"
          >
            🔨 Obras
          </button>
          <button
            onClick={() => resetCamera('camp')}
            className="px-2 py-1 text-[11px] font-bold rounded-lg hover:bg-[#EFE4CE] text-stone-800 transition-colors whitespace-nowrap"
            title="Centro / Fogueira da Vila"
          >
            🛖 Centro
          </button>

          <div className="h-4 w-px bg-stone-300 mx-1"></div>

          <button
            onClick={() => setFollowVillager(!followVillager)}
            disabled={!selectedVillagerId}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors ${
              followVillager
                ? 'bg-[#E5B84B] text-[#2C241E] shadow-xs'
                : 'text-stone-700 hover:bg-[#EFE4CE] disabled:opacity-40'
            }`}
            title="Seguir com a câmera"
          >
            <Eye size={13} />
            <span>Seguir</span>
          </button>
        </div>

        {/* Time of Day / Atmospheric Lighting Badge & Cycle Button */}
        <div className="pointer-events-auto bg-[#FDFBF7]/95 backdrop-blur-xs border-2 border-[#33261D] p-1 rounded-xl shadow-md flex items-center gap-1.5">
          <button
            onClick={() => {
              audio.playWood();
              // Cycle through: auto -> day -> sunset -> night -> dawn -> auto
              const next: Record<string, 'auto' | TimeOfDay> = {
                auto: 'day',
                day: 'sunset',
                sunset: 'night',
                night: 'dawn',
                dawn: 'auto',
              };
              setTimeOfDayOverride(next[timeOfDayOverride]);
            }}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              effectiveTimeOfDay === 'night'
                ? 'bg-[#0f172a] text-[#93c5fd] shadow-xs'
                : effectiveTimeOfDay === 'sunset'
                ? 'bg-[#7c2d12] text-[#fed7aa] shadow-xs'
                : effectiveTimeOfDay === 'dawn'
                ? 'bg-[#581c87] text-[#f5d0fe] shadow-xs'
                : 'bg-[#FAF3E7] text-amber-950 hover:bg-[#EFE4CE]'
            }`}
            title={`Iluminação: ${TIME_OF_DAY_INFO[effectiveTimeOfDay].name}. Alterna suavemente entre dia e noite.`}
          >
            <span className="text-sm">{TIME_OF_DAY_INFO[effectiveTimeOfDay].icon}</span>
            <span>{TIME_OF_DAY_INFO[effectiveTimeOfDay].name}</span>
            {timeOfDayOverride === 'auto' ? (
              <span className="text-[10px] opacity-75 font-mono">(Automático)</span>
            ) : (
              <span className="text-[10px] bg-white/20 px-1 rounded font-mono">Fixo</span>
            )}
          </button>
        </div>
      </div>

      {/* Selected Character 3D Inspector Card */}
      {selectedVillager && (
        <div className="absolute top-16 left-3 sm:left-4 z-10 bg-[#FDFBF7] border-3 border-[#33261D] rounded-2xl p-3 shadow-xl max-w-xs animate-in fade-in slide-in-from-top-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-3 border-b-2 border-stone-200 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-[#33261D] flex items-center justify-center relative shadow-xs"
                style={{ backgroundColor: selectedVillager.tunicColor }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white border border-[#33261D]"></div>
              </div>
              <div>
                <h4 className="font-hand font-extrabold text-base text-stone-900 leading-tight">
                  {selectedVillager.name}
                </h4>
                <p className="text-[11px] text-amber-900 font-bold">
                  Ofício: {selectedVillager.job.toUpperCase()}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectVillager(null)}
              className="text-stone-400 hover:text-stone-700 font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Health & Alimentation Status */}
          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700 flex items-center gap-1">
                ❤️ Vida:
              </span>
              <span className="font-mono font-bold text-stone-900">
                {selectedVillager.health ?? 100}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (selectedVillager.health ?? 100) > 50
                    ? 'bg-emerald-500'
                    : (selectedVillager.health ?? 100) > 25
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${selectedVillager.health ?? 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-stone-600">Alimentação:</span>
              <span
                className={`font-bold ${
                  selectedVillager.isFed !== false ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {selectedVillager.isFed !== false ? '🍞 Saciado' : '⚠️ Com Fome (-20 HP/turno)'}
              </span>
            </div>

            {/* Current Daily Routine / Meal Status */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/80">
              <span className="text-stone-600">Rotina Atual:</span>
              <span className="font-extrabold text-amber-900 flex items-center gap-1">
                <span>{getCelestialTimeInfo(gameState.gameHour ?? 6.0).routineIcon}</span>
                <span>{getCelestialTimeInfo(gameState.gameHour ?? 6.0).routineTitle}</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-600 mb-2">
            Perk: <strong className="text-stone-800">{selectedVillager.trait.name}</strong> ({selectedVillager.trait.description})
          </p>

          <p className="text-[11px] text-stone-500 italic">
            💡 Dica: Clique no chão 3D para ordenar este aldeão a se mover para aquele ponto!
          </p>
        </div>
      )}

      {/* Controls helper hint in corner */}
      <div className="absolute bottom-3 right-3 z-10 bg-[#FDFBF7]/85 backdrop-blur-xs border-2 border-[#33261D] px-3 py-1.5 rounded-xl text-[11px] font-medium text-stone-700 shadow-sm pointer-events-none flex items-center gap-2">
        <span>🖱️ Arraste para girar a câmera</span>
        <span>·</span>
        <span>📜 Roda do mouse para dar zoom</span>
        <span>·</span>
        <span>🎯 Clique nos aldeões para selecioná-los</span>
      </div>
    </div>
  );
};
