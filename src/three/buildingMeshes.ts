import * as THREE from 'three';

// Materials
const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
const thatchMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.95 });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
const adobeMat = new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.9 });
const mudbrickMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4, roughness: 0.3 });

export function createCampfireMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'campfire';

  // Ring of Stones
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const stoneGeo = new THREE.DodecahedronGeometry(0.12);
    const stone = new THREE.Mesh(stoneGeo, darkStoneMat);
    stone.position.set(Math.cos(angle) * 0.45, 0.08, Math.sin(angle) * 0.45);
    stone.castShadow = true;
    group.add(stone);
  }

  // Cross Logs
  for (let i = 0; i < 4; i++) {
    const logGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
    const log = new THREE.Mesh(logGeo, darkWoodMat);
    log.rotation.x = Math.PI / 2;
    log.rotation.z = (i / 4) * Math.PI;
    log.position.y = 0.06;
    group.add(log);
  }

  // Fire Flame
  const flameGeo = new THREE.ConeGeometry(0.18, 0.4, 6);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = 0.25;
  flame.name = 'flame';
  group.add(flame);

  // Inner Yellow flame
  const innerFlameGeo = new THREE.ConeGeometry(0.1, 0.25, 6);
  const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
  innerFlame.position.y = 0.2;
  innerFlame.name = 'innerFlame';
  group.add(innerFlame);

  // Point light for glowing night/evening
  const light = new THREE.PointLight(0xf59e0b, 1.2, 12);
  light.position.y = 0.45;
  light.name = 'campfirePointLight';
  group.add(light);

  return group;
}

export function createHutMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'hut';

  // Mudbrick circular base
  const baseGeo = new THREE.CylinderGeometry(1.2, 1.3, 1.2, 12);
  const base = new THREE.Mesh(baseGeo, adobeMat);
  base.position.y = 0.6;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Conical Thatch Roof
  const roofGeo = new THREE.ConeGeometry(1.7, 1.3, 12);
  const roof = new THREE.Mesh(roofGeo, thatchMat);
  roof.position.y = 1.85;
  roof.castShadow = true;
  group.add(roof);

  // Doorway
  const doorGeo = new THREE.BoxGeometry(0.5, 0.8, 0.3);
  const doorMat = new THREE.MeshBasicMaterial({ color: 0x1f1b18 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.45, 1.2);
  group.add(door);

  return group;
}

export function createStoneDwellingMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'stone_dwelling';

  // Dry-stone circular base with stone blocks feel
  const wallGeo = new THREE.CylinderGeometry(1.5, 1.6, 1.4, 16);
  const wall = new THREE.Mesh(wallGeo, stoneMat);
  wall.position.y = 0.7;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // Thatched roof with overhanging rim
  const roofGeo = new THREE.ConeGeometry(2.0, 1.4, 16);
  const roof = new THREE.Mesh(roofGeo, thatchMat);
  roof.position.y = 2.1;
  roof.castShadow = true;
  group.add(roof);

  // Wooden lintel door
  const doorGeo = new THREE.BoxGeometry(0.6, 1.0, 0.2);
  const doorMat = new THREE.MeshBasicMaterial({ color: 0x181512 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.55, 1.55);
  group.add(door);

  // Small stone mortar slab outside
  const slabGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.15, 8);
  const slab = new THREE.Mesh(slabGeo, darkStoneMat);
  slab.position.set(1.4, 0.08, 0.8);
  group.add(slab);

  return group;
}

export function createGranaryMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'granary';

  // 4 Wooden Stilts
  const stiltPositions = [
    [-0.8, -0.8],
    [0.8, -0.8],
    [-0.8, 0.8],
    [0.8, 0.8],
  ];
  stiltPositions.forEach(([x, z]) => {
    const stiltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    const stilt = new THREE.Mesh(stiltGeo, darkWoodMat);
    stilt.position.set(x, 0.4, z);
    stilt.castShadow = true;
    group.add(stilt);
  });

  // Elevated Cabin Box
  const boxGeo = new THREE.BoxGeometry(2.0, 1.3, 2.0);
  const box = new THREE.Mesh(boxGeo, mudbrickMat);
  box.position.y = 1.45;
  box.castShadow = true;
  group.add(box);

  // Pitched Roof
  const roofGeo = new THREE.ConeGeometry(1.8, 1.0, 4);
  const roof = new THREE.Mesh(roofGeo, thatchMat);
  roof.position.y = 2.6;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Stacks of grain sacks/crates on side
  const sackGeo = new THREE.SphereGeometry(0.25, 8, 8);
  const sackMat = new THREE.MeshStandardMaterial({ color: 0xd4a373 });
  for (let i = 0; i < 3; i++) {
    const sack = new THREE.Mesh(sackGeo, sackMat);
    sack.position.set(1.2 + i * 0.2, 0.2, 0.5);
    sack.scale.set(1, 0.7, 1);
    group.add(sack);
  }

  return group;
}

export function createWellMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'village_well';

  // Circular Stone Basin
  const basinGeo = new THREE.CylinderGeometry(0.9, 0.95, 0.8, 16);
  const basin = new THREE.Mesh(basinGeo, stoneMat);
  basin.position.y = 0.4;
  basin.castShadow = true;
  group.add(basin);

  // Water Disc
  const waterGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.05, 16);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.1, metalness: 0.6 });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = 0.65;
  group.add(water);

  // Wooden Posts
  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
  const leftPost = new THREE.Mesh(postGeo, darkWoodMat);
  leftPost.position.set(-0.8, 1.0, 0);
  group.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, darkWoodMat);
  rightPost.position.set(0.8, 1.0, 0);
  group.add(rightPost);

  // Crossbeam & Roof
  const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8);
  const beam = new THREE.Mesh(beamGeo, darkWoodMat);
  beam.rotation.z = Math.PI / 2;
  beam.position.set(0, 1.8, 0);
  group.add(beam);

  // Little Thatched Canopy
  const canopyGeo = new THREE.ConeGeometry(1.2, 0.5, 4);
  const canopy = new THREE.Mesh(canopyGeo, thatchMat);
  canopy.position.set(0, 2.05, 0);
  canopy.rotation.y = Math.PI / 4;
  group.add(canopy);

  return group;
}

export function createLonghouseMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'longhouse';

  // Wooden Long Hall
  const hallGeo = new THREE.BoxGeometry(4.5, 1.6, 2.4);
  const hall = new THREE.Mesh(hallGeo, woodMat);
  hall.position.y = 0.8;
  hall.castShadow = true;
  group.add(hall);

  // Crossed Timbers Roof
  const roofGeo = new THREE.CylinderGeometry(0.1, 1.8, 4.8, 3);
  const roof = new THREE.Mesh(roofGeo, thatchMat);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.x = Math.PI;
  roof.position.y = 2.1;
  roof.castShadow = true;
  group.add(roof);

  // Crossed Gables
  const gableGeo = new THREE.BoxGeometry(0.08, 1.2, 0.08);
  const gable1 = new THREE.Mesh(gableGeo, darkWoodMat);
  gable1.position.set(-2.2, 2.7, 0);
  gable1.rotation.z = 0.4;
  group.add(gable1);

  const gable2 = new THREE.Mesh(gableGeo, darkWoodMat);
  gable2.position.set(-2.2, 2.7, 0);
  gable2.rotation.z = -0.4;
  group.add(gable2);

  return group;
}

export function createZigguratMesh(tierCount: number = 4): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ziggurat';

  const tierDimensions = [
    { w: 9.0, h: 1.5, d: 9.0 },
    { w: 6.8, h: 1.3, d: 6.8 },
    { w: 4.8, h: 1.1, d: 4.8 },
    { w: 3.0, h: 0.9, d: 3.0 },
  ];

  let currentY = 0;
  for (let i = 0; i < Math.min(tierCount, 4); i++) {
    const dim = tierDimensions[i];
    const tierGeo = new THREE.BoxGeometry(dim.w, dim.h, dim.d);
    const tierMesh = new THREE.Mesh(tierGeo, adobeMat);
    tierMesh.position.y = currentY + dim.h / 2;
    tierMesh.castShadow = true;
    tierMesh.receiveShadow = true;
    group.add(tierMesh);

    currentY += dim.h;
  }

  // Golden Shrine on Top
  if (tierCount >= 4) {
    const shrineGeo = new THREE.BoxGeometry(1.6, 1.2, 1.6);
    const shrine = new THREE.Mesh(shrineGeo, goldMat);
    shrine.position.y = currentY + 0.6;
    shrine.castShadow = true;
    group.add(shrine);
  }

  // Grand Front Staircase
  const rampGeo = new THREE.BoxGeometry(1.4, currentY, 3.5);
  const ramp = new THREE.Mesh(rampGeo, darkStoneMat);
  ramp.position.set(0, currentY / 2, 4.5);
  ramp.rotation.x = -0.3;
  ramp.castShadow = true;
  group.add(ramp);

  return group;
}

export function createTreeMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tree';

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8);
  const trunk = new THREE.Mesh(trunkGeo, darkWoodMat);
  trunk.position.y = 0.7;
  trunk.castShadow = true;
  group.add(trunk);

  // Foliage (Stylized clustered spheres)
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.9 });
  const mainFoliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9), foliageMat);
  mainFoliage.position.y = 1.8;
  mainFoliage.castShadow = true;
  group.add(mainFoliage);

  const subFoliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65), foliageMat);
  subFoliage1.position.set(0.4, 2.2, 0.2);
  group.add(subFoliage1);

  const subFoliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), foliageMat);
  subFoliage2.position.set(-0.35, 2.0, -0.3);
  group.add(subFoliage2);

  return group;
}

export function createWheatPatchMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'wheat_patch';

  // Base cultivated soil bed
  const soilGeo = new THREE.PlaneGeometry(3.5, 3.5);
  const soilMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 1.0 });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.01;
  soil.receiveShadow = true;
  group.add(soil);

  // Stalks of golden wheat
  const stalkGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.8, 4);
  const wheatMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.7 });
  const earGeo = new THREE.ConeGeometry(0.05, 0.25, 4);

  for (let x = -1.4; x <= 1.4; x += 0.45) {
    for (let z = -1.4; z <= 1.4; z += 0.45) {
      const stalk = new THREE.Mesh(stalkGeo, wheatMat);
      stalk.position.set(x + (Math.random() - 0.5) * 0.1, 0.4, z + (Math.random() - 0.5) * 0.1);
      stalk.rotation.z = (Math.random() - 0.5) * 0.15;
      group.add(stalk);

      const ear = new THREE.Mesh(earGeo, wheatMat);
      ear.position.set(stalk.position.x, 0.85, stalk.position.z);
      group.add(ear);
    }
  }

  return group;
}

export function createRockQuarryMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'rock_quarry';

  for (let i = 0; i < 5; i++) {
    const rockGeo = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.35);
    const rock = new THREE.Mesh(rockGeo, darkStoneMat);
    const angle = (i / 5) * Math.PI * 2;
    const dist = 0.5 + Math.random() * 0.4;
    rock.position.set(Math.cos(angle) * dist, 0.25 + Math.random() * 0.15, Math.sin(angle) * dist);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    group.add(rock);
  }

  return group;
}
