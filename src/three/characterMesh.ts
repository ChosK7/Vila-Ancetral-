import * as THREE from 'three';
import { Villager } from '../types/game';

export interface CharacterRig {
  root: THREE.Group;
  head: THREE.Mesh;
  body: THREE.Mesh;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  toolSlot: THREE.Group;
  wheatCarry: THREE.Group;
  mealBowl: THREE.Group;
  villagerId: string;
}

export function createCharacterMesh(villager: Villager): CharacterRig {
  const root = new THREE.Group();
  root.name = `character-${villager.id}`;

  // Materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.05,
  });

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const hairColor = villager.hairStyle === 'elder' ? 0x9ca3af : 0x221f1d;
  const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });

  const tunicColor = new THREE.Color(villager.tunicColor || '#8C5A32');
  const tunicMaterial = new THREE.MeshStandardMaterial({
    color: tunicColor,
    roughness: 0.6,
  });

  const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
  const limbMaterial = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.5 });

  // 1. Head (Smooth white sphere)
  const headGeo = new THREE.SphereGeometry(0.32, 24, 24);
  const head = new THREE.Mesh(headGeo, skinMaterial);
  head.position.y = 1.35;
  head.castShadow = true;
  root.add(head);

  // Eyes (Two black dots on front face)
  const eyeGeo = new THREE.SphereGeometry(0.04, 12, 12);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.09, 0.04, 0.29);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.09, 0.04, 0.29);
  head.add(rightEye);

  // Eyebrows
  const browGeo = new THREE.BoxGeometry(0.07, 0.015, 0.02);
  const leftBrow = new THREE.Mesh(browGeo, eyeMaterial);
  leftBrow.position.set(-0.09, 0.12, 0.29);
  leftBrow.rotation.z = -0.05;
  head.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeo, eyeMaterial);
  rightBrow.position.set(0.09, 0.12, 0.29);
  rightBrow.rotation.z = 0.05;
  head.add(rightBrow);

  // Hair Style
  if (villager.hairStyle === 'spiky') {
    for (let i = -2; i <= 2; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.05, 0.16, 6);
      const spike = new THREE.Mesh(spikeGeo, hairMaterial);
      spike.position.set(i * 0.07, 0.32, 0.05 - Math.abs(i) * 0.03);
      spike.rotation.z = -i * 0.15;
      head.add(spike);
    }
  } else if (villager.hairStyle === 'side' || villager.hairStyle === 'wavy') {
    const hairCapGeo = new THREE.SphereGeometry(0.33, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMaterial);
    hairCap.position.y = 0.04;
    head.add(hairCap);
  } else if (villager.hairStyle === 'elder') {
    // White/grey hair cap + beard
    const hairCapGeo = new THREE.SphereGeometry(0.33, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMaterial);
    hairCap.position.y = 0.04;
    head.add(hairCap);

    // Beard
    const beardGeo = new THREE.ConeGeometry(0.12, 0.25, 8);
    const beard = new THREE.Mesh(beardGeo, hairMaterial);
    beard.position.set(0, -0.22, 0.22);
    beard.rotation.x = 0.2;
    head.add(beard);
  } else if (villager.hairStyle === 'bun') {
    const bunGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const bun = new THREE.Mesh(bunGeo, hairMaterial);
    bun.position.set(0, 0.36, -0.1);
    head.add(bun);
  }

  // 2. Body / Tunic (Tapered cylinder / dress)
  const bodyGeo = new THREE.CylinderGeometry(0.2, 0.32, 0.65, 16);
  const body = new THREE.Mesh(bodyGeo, tunicMaterial);
  body.position.y = 0.85;
  body.castShadow = true;
  root.add(body);

  // Belt
  const beltGeo = new THREE.CylinderGeometry(0.25, 0.26, 0.06, 16);
  const belt = new THREE.Mesh(beltGeo, beltMaterial);
  belt.position.y = 0.02;
  body.add(belt);

  // 3. Legs (Hips at y=0.55, legs extend down to y=0)
  const legGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.5, 12);
  const footGeo = new THREE.BoxGeometry(0.08, 0.05, 0.12);

  // Left Leg Pivot
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.12, 0.55, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, limbMaterial);
  leftLegMesh.position.y = -0.25;
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);

  const leftFoot = new THREE.Mesh(footGeo, limbMaterial);
  leftFoot.position.set(0, -0.48, 0.03);
  leftLeg.add(leftFoot);
  root.add(leftLeg);

  // Right Leg Pivot
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.12, 0.55, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, limbMaterial);
  rightLegMesh.position.y = -0.25;
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);

  const rightFoot = new THREE.Mesh(footGeo, limbMaterial);
  rightFoot.position.set(0, -0.48, 0.03);
  rightLeg.add(rightFoot);
  root.add(rightLeg);

  // 4. Arms (Shoulders at y=1.05)
  const armGeo = new THREE.CylinderGeometry(0.038, 0.035, 0.45, 10);
  const handGeo = new THREE.SphereGeometry(0.045, 10, 10);

  // Left Arm Pivot
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.25, 1.08, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, limbMaterial);
  leftArmMesh.position.y = -0.22;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);

  const leftHand = new THREE.Mesh(handGeo, skinMaterial);
  leftHand.position.y = -0.44;
  leftArm.add(leftHand);
  root.add(leftArm);

  // Right Arm Pivot (Holds primary tools like sickle/axe/spear)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.25, 1.08, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, limbMaterial);
  rightArmMesh.position.y = -0.22;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  const rightHand = new THREE.Mesh(handGeo, skinMaterial);
  rightHand.position.y = -0.44;
  rightArm.add(rightHand);
  root.add(rightArm);

  // Tool attachment point on right hand
  const toolSlot = new THREE.Group();
  toolSlot.position.set(0, -0.44, 0);
  rightArm.add(toolSlot);

  // Meal Bowl / Cup for breakfast, lunch, and dinner
  const mealBowl = new THREE.Group();
  mealBowl.position.set(0, -0.42, 0.12);
  mealBowl.visible = false;

  const bowlGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.09, 12);
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 }); // rustic terracotta bowl
  const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
  mealBowl.add(bowlMesh);

  // Food porridge/stew surface inside bowl
  const soupGeo = new THREE.CircleGeometry(0.10, 12);
  const soupMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const soupMesh = new THREE.Mesh(soupGeo, soupMat);
  soupMesh.rotation.x = -Math.PI / 2;
  soupMesh.position.y = 0.04;
  mealBowl.add(soupMesh);

  // Small spoon/bread
  const spoonGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6);
  const spoonMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
  const spoonMesh = new THREE.Mesh(spoonGeo, spoonMat);
  spoonMesh.rotation.z = Math.PI / 4;
  spoonMesh.position.set(0.06, 0.05, 0);
  mealBowl.add(spoonMesh);

  rightArm.add(mealBowl);

  // Wheat bundle carried under arm / on back
  const wheatCarry = new THREE.Group();
  wheatCarry.position.set(0, 0.9, -0.22);
  wheatCarry.visible = false;

  const wheatSheafGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.7, 12);
  const wheatMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.8 });
  const wheatSheaf = new THREE.Mesh(wheatSheafGeo, wheatMat);
  wheatSheaf.rotation.x = Math.PI / 4;
  wheatCarry.add(wheatSheaf);

  // Twine rope around sheaf
  const twineGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
  const twineMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
  const twine = new THREE.Mesh(twineGeo, twineMat);
  twine.rotation.x = Math.PI / 4;
  wheatCarry.add(twine);

  root.add(wheatCarry);

  // Setup specific tool according to villager job
  setupToolForJob(toolSlot, villager.job);

  // Shadow circle on ground
  const shadowGeo = new THREE.CircleGeometry(0.35, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  return {
    root,
    head,
    body,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    toolSlot,
    wheatCarry,
    mealBowl,
    villagerId: villager.id,
  };
}

export function setupToolForJob(toolSlot: THREE.Group, job: string) {
  // Clear existing tools
  while (toolSlot.children.length > 0) {
    toolSlot.remove(toolSlot.children[0]);
  }

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
  const clayMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });

  if (job === 'farmer') {
    // Curved Sickle
    const sickleGroup = new THREE.Group();
    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
    const handle = new THREE.Mesh(handleGeo, woodMat);
    handle.rotation.x = Math.PI / 2;
    sickleGroup.add(handle);

    // Curved Blade (Torus arc)
    const bladeGeo = new THREE.TorusGeometry(0.14, 0.02, 8, 16, Math.PI * 0.9);
    const blade = new THREE.Mesh(bladeGeo, stoneMat);
    blade.position.set(0, 0, 0.2);
    blade.rotation.y = Math.PI / 2;
    sickleGroup.add(blade);

    toolSlot.add(sickleGroup);
  } else if (job === 'lumberjack') {
    // Stone Axe
    const axeGroup = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8);
    const handle = new THREE.Mesh(handleGeo, woodMat);
    handle.rotation.x = Math.PI / 2;
    axeGroup.add(handle);

    const headGeo = new THREE.BoxGeometry(0.06, 0.16, 0.1);
    const head = new THREE.Mesh(headGeo, stoneMat);
    head.position.set(0, 0, 0.25);
    axeGroup.add(head);

    toolSlot.add(axeGroup);
  } else if (job === 'quarryman' || job === 'builder') {
    // Pickaxe / Hammer
    const pickGroup = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8);
    const handle = new THREE.Mesh(handleGeo, woodMat);
    handle.rotation.x = Math.PI / 2;
    pickGroup.add(handle);

    const headGeo = new THREE.BoxGeometry(0.06, 0.28, 0.06);
    const head = new THREE.Mesh(headGeo, stoneMat);
    head.position.set(0, 0, 0.22);
    pickGroup.add(head);

    toolSlot.add(pickGroup);
  } else if (job === 'guard') {
    // Spear & Round Shield
    const guardGroup = new THREE.Group();
    // Tall spear
    const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8);
    const shaft = new THREE.Mesh(shaftGeo, woodMat);
    shaft.position.y = 0.4;
    guardGroup.add(shaft);

    const tipGeo = new THREE.ConeGeometry(0.05, 0.2, 8);
    const tip = new THREE.Mesh(tipGeo, stoneMat);
    tip.position.y = 1.15;
    guardGroup.add(tip);

    // Round wooden shield on arm
    const shieldGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16);
    const shield = new THREE.Mesh(shieldGeo, woodMat);
    shield.position.set(-0.15, 0.1, 0.1);
    shield.rotation.z = Math.PI / 2;
    guardGroup.add(shield);

    toolSlot.add(guardGroup);
  } else if (job === 'elder') {
    // Cuneiform Clay Tablet
    const tabletGroup = new THREE.Group();
    const tabGeo = new THREE.BoxGeometry(0.24, 0.32, 0.04);
    const tablet = new THREE.Mesh(tabGeo, clayMat);
    tablet.rotation.x = Math.PI / 3;
    tabletGroup.add(tablet);

    toolSlot.add(tabletGroup);
  }
}
