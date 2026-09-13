export interface RuntimeUnit {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  collisionRadius: number;
  separationStrength: number;
  animationState: "idle" | "move" | "attack" | "death";
  facingX: number;
  facingY: number;
  facingAngle: number;
  attackStateUntil: number;
  attackAnimationDuration: number;
  deathAnimationDuration: number;
  hp: number;
  maxHp: number;

  team: string;
  teamColor: string;

  unitType: "melee" | "ranged";

  unitClass: "custom" | "knight" | "archer" | "mage" | "tank";
  projectileType: "none" | "arrow" | "orb" | "shell";
  splashRadius: number;

  attackDamage: number;
  attackRange: number;
  attackCooldown: number;

  lastAttackTime: number;
  attackTargetId?: string;

  command: "idle" | "move" | "attack" | "attackMove";

  commandTargetX?: number;
  commandTargetY?: number;

  aggroRange: number;
  aggroLeashRange: number;

  kills: number;
  experience: number;

  aggroTargetId?: string;

  projectileSpeed: number; // Units per second
}

export interface RuntimeUnitSpawnOptions {
  x?: number;
  y?: number;
  speed?: number;
  collisionRadius?: number;
  separationStrength?: number;
  attackAnimationDuration?: number;
  deathAnimationDuration?: number;
  hp?: number;
  team?: string;
  teamColor?: string;
  unitType?: "melee" | "ranged";
  unitClass?: "custom" | "knight" | "archer" | "mage" | "tank";
  attackDamage?: number;
  attackRange?: number;
  attackCooldown?: number;
  aggroRange?: number;
  aggroLeashRange?: number;
  projectileSpeed?: number;
  projectileType?: "none" | "arrow" | "orb" | "shell";
  splashRadius?: number;
}

const units = new Map<string, RuntimeUnit>();

const selectedUnitIds = new Set<string>();

const TEAM_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
  neutral: "#94a3b8",
};

const UNIT_CLASS_PRESETS = {
  knight: {
    unitType: "melee" as const,
    hp: 180,
    speed: 110,
    collisionRadius: 30,
    attackDamage: 24,
    attackRange: 80,
    attackCooldown: 700,
    projectileSpeed: 0,
    projectileType: "none" as const,
    splashRadius: 0,
    aggroRange: 260,
  },

  archer: {
    unitType: "ranged" as const,
    hp: 90,
    speed: 120,
    collisionRadius: 24,
    attackDamage: 14,
    attackRange: 320,
    attackCooldown: 950,
    projectileSpeed: 850,
    projectileType: "arrow" as const,
    splashRadius: 0,
    aggroRange: 400,
  },

  mage: {
    unitType: "ranged" as const,
    hp: 75,
    speed: 105,
    collisionRadius: 24,
    attackDamage: 22,
    attackRange: 280,
    attackCooldown: 1200,
    projectileSpeed: 600,
    projectileType: "orb" as const,
    splashRadius: 90,
    aggroRange: 360,
  },

  tank: {
    unitType: "ranged" as const,
    hp: 260,
    speed: 70,
    collisionRadius: 36,
    attackDamage: 38,
    attackRange: 360,
    attackCooldown: 1600,
    projectileSpeed: 500,
    projectileType: "shell" as const,
    splashRadius: 120,
    aggroRange: 420,
  },
};

const getTeamColor = (team: string, customColor?: string) => {
  if (customColor) {
    return customColor;
  }

  return TEAM_COLORS[team] ?? TEAM_COLORS.neutral;
};

let frameId = 0;
let lastTime = 0;

const activeProjectiles = new Set<HTMLElement>();
let runtimeGeneration = 0;

type RuntimeUnitAnimationState = RuntimeUnit["animationState"];

type RuntimeUnitEventDetail = {
  unitId: string;
  unit: RuntimeUnit;
};

const dispatchRuntimeEvent = <T extends object>(name: string, detail: T) => {
  window.dispatchEvent(
    new CustomEvent(name, {
      detail,
    }),
  );
};

const setUnitAnimationState = (
  unit: RuntimeUnit,
  state: RuntimeUnitAnimationState,
) => {
  if (unit.animationState === state) {
    return;
  }

  unit.animationState = state;

  dispatchRuntimeEvent<RuntimeUnitEventDetail>("runtime-unit-animation-state", {
    unitId: unit.id,
    unit,
  });
};

const setUnitFacing = (unit: RuntimeUnit, x: number, y: number) => {
  const length = Math.hypot(x, y);

  if (length <= 0) {
    return;
  }

  unit.facingX = x / length;
  unit.facingY = y / length;
  unit.facingAngle = Math.atan2(unit.facingY, unit.facingX) * (180 / Math.PI);
};

const updateElement = (unit: RuntimeUnit) => {
  const element = document.querySelector<HTMLElement>(
    `[data-runtime-unit-id="${CSS.escape(unit.id)}"]`,
  );

  if (!element) {
    return;
  }

  element.style.transform = `translate3d(${unit.x}px, ${unit.y}px, 0)`;
  element.setAttribute("data-runtime-animation-state", unit.animationState);
  element.setAttribute(
    "data-runtime-facing",
    Math.abs(unit.facingX) >= Math.abs(unit.facingY)
      ? unit.facingX >= 0
        ? "right"
        : "left"
      : unit.facingY >= 0
        ? "down"
        : "up",
  );
  element.style.setProperty("--runtime-facing-x", String(unit.facingX));
  element.style.setProperty("--runtime-facing-y", String(unit.facingY));
  element.style.setProperty("--runtime-facing-angle", `${unit.facingAngle}deg`);
  element.setAttribute("data-runtime-command", unit.command);

  if (unit.attackTargetId) {
    element.setAttribute("data-runtime-attack-target", unit.attackTargetId);
  } else {
    element.removeAttribute("data-runtime-attack-target");
  }
};

const getUnitElement = (id: string) => {
  return document.querySelector<HTMLElement>(
    `[data-runtime-unit-id="${CSS.escape(id)}"]`,
  );
};

const updateUnitHealth = (unit: RuntimeUnit) => {
  const element = getUnitElement(unit.id);

  if (!element) {
    return;
  }

  const ratio =
    unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;

  element.setAttribute("data-runtime-hp", String(unit.hp));
  element.setAttribute("data-runtime-max-hp", String(unit.maxHp));
  element.style.setProperty("--runtime-hp-ratio", String(ratio));

  const healthBar = element.querySelector<HTMLElement>(
    "[data-runtime-health-bar]",
  );

  if (healthBar) {
    healthBar.style.width = `${ratio * 100}%`;
  }

  const healthText = element.querySelector<HTMLElement>(
    "[data-runtime-health-text]",
  );

  if (healthText) {
    healthText.textContent = `${Math.ceil(unit.hp)} / ${Math.ceil(unit.maxHp)}`;
  }

  const overlay = element.querySelector<HTMLElement>(
    "[data-runtime-health-overlay]",
  );

  if (overlay) {
    overlay.style.opacity = ratio >= 1 ? "0" : "1";
  }
};

const getUnitSize = (id: string) => {
  const element = getUnitElement(id);

  if (!element) {
    return {
      width: 0,
      height: 0,
    };
  }

  const rect = element.getBoundingClientRect();

  return {
    width: rect.width,
    height: rect.height,
  };
};

const getRuntimeContainer = (id: string) => {
  const element = getUnitElement(id);

  if (!element) {
    return null;
  }

  let parent = element.parentElement;

  while (parent) {
    if (parent.hasAttribute("data-component-id")) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
};

const getRuntimeBounds = (id: string) => {
  const container = getRuntimeContainer(id);

  if (!container) {
    return null;
  }

  const rect = container.getBoundingClientRect();

  return {
    width: rect.width,
    height: rect.height,
  };
};

const clampUnitPosition = (unit: RuntimeUnit, x: number, y: number) => {
  const bounds = getRuntimeBounds(unit.id);

  if (!bounds) {
    return {
      x,
      y,
    };
  }

  const size = getUnitSize(unit.id);
  return {
    x: Math.min(Math.max(x, 0), Math.max(0, bounds.width - size.width)),
    y: Math.min(Math.max(y, 0), Math.max(0, bounds.height - size.height)),
  };
};

const showCommandMarker = (
  container: HTMLElement,
  x: number,
  y: number,
  type: "move" | "attackMove" | "attack",
) => {
  const marker = document.createElement("div");
  const isAttack = type === "attackMove" || type === "attack";

  marker.setAttribute("data-runtime-command-marker", type);
  marker.style.position = "absolute";
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;
  marker.style.width = "24px";
  marker.style.height = "24px";
  marker.style.borderRadius = "9999px";
  marker.style.transform = "translate(-50%, -50%)";
  marker.style.pointerEvents = "none";
  marker.style.zIndex = "99999";
  marker.style.border = isAttack ? "2px solid #ef4444" : "2px solid #38bdf8";
  marker.style.boxShadow = isAttack
    ? "0 0 16px rgba(239,68,68,0.8)"
    : "0 0 16px rgba(56,189,248,0.8)";
  marker.style.boxShadow =
    type === "attackMove"
      ? "0 0 16px rgba(239,68,68,0.8)"
      : "0 0 16px rgba(56,189,248,0.8)";
  marker.style.transition = "opacity 300ms ease, transform 300ms ease";

  container.appendChild(marker);

  requestAnimationFrame(() => {
    marker.style.opacity = "0";

    marker.style.transform = "translate(-50%, -50%) scale(1.8)";
  });

  window.setTimeout(() => {
    marker.remove();
  }, 320);
};

const ensureHealthBar = (unit: RuntimeUnit) => {
  const element = getUnitElement(unit.id);

  if (!element) {
    return;
  }

  if (element.querySelector("[data-runtime-health-overlay]")) {
    return;
  }

  if (getComputedStyle(element).position === "static") {
    element.style.position = "relative";
  }

  const wrapper = document.createElement("div");

  wrapper.setAttribute("data-runtime-health-overlay", "true");
  wrapper.style.position = "absolute";
  wrapper.style.left = "10%";
  wrapper.style.right = "10%";
  wrapper.style.top = "-10px";
  wrapper.style.height = "5px";
  wrapper.style.background = "rgba(0,0,0,0.55)";
  wrapper.style.borderRadius = "9999px";
  wrapper.style.overflow = "hidden";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "9999";

  const bar = document.createElement("div");

  bar.setAttribute("data-runtime-health-bar", "true");
  bar.style.width = "100%";
  bar.style.height = "100%";
  bar.style.background = "#22c55e";
  bar.style.transition = "width 120ms linear";

  wrapper.appendChild(bar);
  element.appendChild(wrapper);
};

const ensureTeamRing = (unit: RuntimeUnit) => {
  const element = getUnitElement(unit.id);

  if (!element) {
    return;
  }

  if (getComputedStyle(element).position === "static") {
    element.style.position = "relative";
  }

  let ring = element.querySelector<HTMLElement>("[data-runtime-team-ring]");

  if (!ring) {
    ring = document.createElement("div");
    ring.setAttribute("data-runtime-team-ring", "true");
    ring.style.position = "absolute";
    ring.style.inset = "-4px";
    ring.style.border = "2px solid transparent";
    ring.style.borderRadius = "inherit";
    ring.style.pointerEvents = "none";
    ring.style.zIndex = "9998";

    element.appendChild(ring);
  }

  ring.style.borderColor = unit.teamColor;

  element.style.setProperty("--runtime-team-color", unit.teamColor);

  element.setAttribute("data-runtime-unit-type", unit.unitType);
};

const getTargetScore = (unit: RuntimeUnit, enemy: RuntimeUnit) => {
  const unitElement = getUnitElement(unit.id);
  const enemyElement = getUnitElement(enemy.id);

  if (!unitElement || !enemyElement) {
    return Infinity;
  }

  const unitRect = unitElement.getBoundingClientRect();
  const enemyRect = enemyElement.getBoundingClientRect();
  const unitX = unitRect.left + unitRect.width / 2;
  const unitY = unitRect.top + unitRect.height / 2;
  const enemyX = enemyRect.left + enemyRect.width / 2;
  const enemyY = enemyRect.top + enemyRect.height / 2;
  const distance = Math.hypot(enemyX - unitX, enemyY - unitY);
  const healthRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;

  return distance + healthRatio * 40;
};

const findNearestEnemy = (unit: RuntimeUnit, maxDistance: number) => {
  let bestEnemy: RuntimeUnit | undefined;
  let bestScore = Infinity;

  const unitElement = getUnitElement(unit.id);

  if (!unitElement) {
    return undefined;
  }

  const unitRect = unitElement.getBoundingClientRect();
  const unitX = unitRect.left + unitRect.width / 2;
  const unitY = unitRect.top + unitRect.height / 2;

  units.forEach((enemy) => {
    if (enemy.id === unit.id || enemy.team === unit.team || enemy.hp <= 0) {
      return;
    }

    const enemyElement = getUnitElement(enemy.id);

    if (!enemyElement) {
      return;
    }

    const enemyRect = enemyElement.getBoundingClientRect();
    const enemyX = enemyRect.left + enemyRect.width / 2;
    const enemyY = enemyRect.top + enemyRect.height / 2;
    const distance = Math.hypot(enemyX - unitX, enemyY - unitY);

    if (distance > maxDistance) {
      return;
    }

    const score = getTargetScore(unit, enemy);

    if (score < bestScore) {
      bestScore = score;
      bestEnemy = enemy;
    }
  });

  return bestEnemy;
};

const updateAggro = () => {
  let hasAggroActivity = false;

  units.forEach((unit) => {
    if (unit.command !== "attackMove") {
      return;
    }

    if (unit.attackTargetId) {
      const currentTarget = units.get(unit.attackTargetId);

      if (currentTarget && currentTarget.hp > 0) {
        const unitElement = getUnitElement(unit.id);
        const targetElement = getUnitElement(currentTarget.id);

        if (unitElement && targetElement) {
          const unitRect = unitElement.getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();
          const distance = Math.hypot(
            targetRect.left +
              targetRect.width / 2 -
              (unitRect.left + unitRect.width / 2),
            targetRect.top +
              targetRect.height / 2 -
              (unitRect.top + unitRect.height / 2),
          );

          if (distance <= unit.aggroLeashRange) {
            return;
          }
        }
      }

      unit.attackTargetId = undefined;
      unit.aggroTargetId = undefined;
      resumeUnitCommand(unit);
    }

    const enemy = findNearestEnemy(unit, unit.aggroRange);

    if (!enemy) {
      return;
    }

    unit.attackTargetId = enemy.id;
    unit.aggroTargetId = enemy.id;
    hasAggroActivity = true;
  });

  return hasAggroActivity;
};

const resumeUnitCommand = (unit: RuntimeUnit) => {
  unit.attackTargetId = undefined;
  unit.aggroTargetId = undefined;

  if (
    unit.command === "attackMove" &&
    unit.commandTargetX !== undefined &&
    unit.commandTargetY !== undefined
  ) {
    unit.targetX = unit.commandTargetX;
    unit.targetY = unit.commandTargetY;

    return;
  }

  unit.targetX = unit.x;
  unit.targetY = unit.y;

  if (unit.command === "attack") {
    unit.command = "idle";
    unit.commandTargetX = undefined;
    unit.commandTargetY = undefined;
  }
};

const getMeleeAttackPosition = (attacker: RuntimeUnit, target: RuntimeUnit) => {
  const attackers = Array.from(units.values()).filter(
    (unit) =>
      unit.hp > 0 &&
      unit.unitType === "melee" &&
      unit.attackTargetId === target.id,
  );

  const index = Math.max(
    0,
    attackers.findIndex((unit) => unit.id === attacker.id),
  );

  const count = Math.max(attackers.length, 1);
  const angle = (index / count) * Math.PI * 2;
  const radius = target.collisionRadius + attacker.collisionRadius + 8;

  return {
    x: target.x + Math.cos(angle) * radius,
    y: target.y + Math.sin(angle) * radius,
  };
};

const updateCombat = (time: number) => {
  let hasCombatActivity = false;

  const deadUnitIds = new Set<string>();

  units.forEach((unit) => {
    const targetId = unit.attackTargetId;

    if (!targetId) {
      return;
    }

    const target = units.get(targetId);
    if (!target || target.hp <= 0) {
      resumeUnitCommand(unit);

      return;
    }

    const unitElement = getUnitElement(unit.id);
    const targetElement = getUnitElement(target.id);

    if (!unitElement || !targetElement) {
      return;
    }

    const unitRect = unitElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const unitCenterX = unitRect.left + unitRect.width / 2;
    const unitCenterY = unitRect.top + unitRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const dx = targetCenterX - unitCenterX;
    const dy = targetCenterY - unitCenterY;
    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
      setUnitFacing(unit, dx, dy);
    }

    hasCombatActivity = true;

    const effectiveRange =
      unit.unitType === "melee"
        ? unit.attackRange + unit.collisionRadius + target.collisionRadius
        : unit.attackRange;

    if (distance > effectiveRange) {
      if (unit.unitType === "melee") {
        const attackPosition = getMeleeAttackPosition(unit, target);
        const next = clampUnitPosition(
          unit,
          attackPosition.x,
          attackPosition.y,
        );

        unit.targetX = next.x;
        unit.targetY = next.y;
      } else {
        unit.targetX = unit.x + dx;
        unit.targetY = unit.y + dy;
      }

      return;
    }

    unit.targetX = unit.x;
    unit.targetY = unit.y;

    const elapsed = time - unit.lastAttackTime;

    if (elapsed < unit.attackCooldown) {
      return;
    }

    unit.lastAttackTime = time;
    setUnitAnimationState(unit, "attack");
    unit.attackStateUntil = time + unit.attackAnimationDuration;

    dispatchRuntimeEvent("runtime-unit-attack", {
      unitId: unit.id,
      targetId: target.id,
      unit,
      target,
    });

    playAttackEffect(unit);

    if (unit.unitType === "ranged") {
      fireProjectile(unit, target);

      return;
    }

    const previousHp = target.hp;

    target.hp = Math.max(0, target.hp - unit.attackDamage);

    dispatchRuntimeEvent("runtime-unit-damage", {
      unitId: target.id,
      attackerId: unit.id,
      amount: previousHp - target.hp,
      hp: target.hp,
      maxHp: target.maxHp,
      unit: target,
      attacker: unit,
    });

    playHitEffect(target);
    updateUnitHealth(target);

    if (target.hp <= 0) {
      grantKillReward(unit, target);
      deadUnitIds.add(target.id);
    }
  });

  deadUnitIds.forEach((id) => {
    const deadUnit = units.get(id);

    if (!deadUnit) {
      return;
    }

    playDeathEffect(deadUnit, () => {
      removeRuntimeUnit(id);
    });
  });

  return hasCombatActivity;
};

const playAttackEffect = (unit: RuntimeUnit) => {
  const element = getUnitElement(unit.id);

  if (!element) {
    return;
  }

  element.animate(
    [
      {
        filter: "brightness(1)",
      },
      {
        filter: "brightness(1.7)",
      },
      {
        filter: "brightness(1)",
      },
    ],
    {
      duration: 160,
      easing: "ease-out",
    },
  );
};

const playHitEffect = (unit: RuntimeUnit) => {
  const element = getUnitElement(unit.id);

  if (!element) {
    return;
  }

  const flash = document.createElement("div");

  flash.setAttribute("data-runtime-hit-effect", "true");
  flash.style.position = "absolute";
  flash.style.inset = "-6px";
  flash.style.borderRadius = "inherit";
  flash.style.background = "rgba(255,255,255,0.65)";
  flash.style.pointerEvents = "none";
  flash.style.zIndex = "10000";
  element.appendChild(flash);

  const animation = flash.animate(
    [
      {
        opacity: 1,
      },
      {
        opacity: 0,
      },
    ],
    {
      duration: 180,
      easing: "ease-out",
    },
  );

  animation.onfinish = () => {
    flash.remove();
  };
};

const grantKillReward = (attacker: RuntimeUnit, target?: RuntimeUnit) => {
  attacker.kills += 1;
  attacker.experience += 25;

  dispatchRuntimeEvent("runtime-unit-kill", {
    unitId: attacker.id,
    targetId: target?.id,
    kills: attacker.kills,
    experience: attacker.experience,
    unit: attacker,
    target,
  });
};

const playDeathEffect = (unit: RuntimeUnit, onComplete: () => void) => {
  const element = getUnitElement(unit.id);

  if (!element) {
    onComplete();

    return;
  }

  setUnitAnimationState(unit, "death");
  updateElement(unit);

  dispatchRuntimeEvent("runtime-unit-death", {
    unitId: unit.id,
    unit,
  });

  element.style.pointerEvents = "none";
  element.setAttribute("data-runtime-dead", "true");

  const animation = element.animate(
    [
      {
        opacity: 1,
        filter: "grayscale(0)",
      },
      {
        opacity: 0,
        filter: "grayscale(1)",
      },
    ],
    {
      duration: unit.deathAnimationDuration,
      easing: "ease-in",
      fill: "forwards",
    },
  );

  animation.onfinish = () => {
    onComplete();
  };
};

const playImpactEffect = (
  x: number,
  y: number,
  color: string,
  size: number,
) => {
  const effect = document.createElement("div");

  effect.style.position = "fixed";

  effect.style.left = `${x}px`;

  effect.style.top = `${y}px`;

  effect.style.width = `${size}px`;

  effect.style.height = `${size}px`;

  effect.style.borderRadius = "9999px";

  effect.style.background = color;

  effect.style.opacity = "0.65";

  effect.style.pointerEvents = "none";

  effect.style.zIndex = "99999";

  effect.style.transform = "translate(-50%, -50%) scale(0.2)";

  document.body.appendChild(effect);

  const animation = effect.animate(
    [
      {
        opacity: 0.8,
        transform: "translate(-50%, -50%) scale(0.2)",
      },
      {
        opacity: 0,
        transform: "translate(-50%, -50%) scale(1)",
      },
    ],
    {
      duration: 280,
      easing: "ease-out",
    },
  );

  animation.onfinish = () => {
    effect.remove();
  };
};

const applyProjectileStyle = (
  projectile: HTMLElement,
  attacker: RuntimeUnit,
) => {
  switch (attacker.projectileType) {
    case "arrow":
      projectile.style.width = "18px";
      projectile.style.height = "4px";
      projectile.style.borderRadius = "9999px";
      projectile.style.background = attacker.teamColor;
      projectile.style.boxShadow = `0 0 6px ${attacker.teamColor}`;
      break;

    case "orb":
      projectile.style.width = "14px";
      projectile.style.height = "14px";
      projectile.style.borderRadius = "9999px";
      projectile.style.background = attacker.teamColor;
      projectile.style.boxShadow = `0 0 16px ${attacker.teamColor}`;
      break;

    case "shell":
      projectile.style.width = "12px";
      projectile.style.height = "12px";
      projectile.style.borderRadius = "4px";
      projectile.style.background = "#f97316";
      projectile.style.boxShadow = "0 0 12px rgba(249,115,22,0.9)";
      break;

    default:
      projectile.style.width = "9px";
      projectile.style.height = "9px";
      projectile.style.borderRadius = "9999px";
      projectile.style.background = attacker.teamColor;
      break;
  }
};

const applySplashDamage = (
  attacker: RuntimeUnit,
  impactTarget: RuntimeUnit,
) => {
  const targetElement = getUnitElement(impactTarget.id);

  if (!targetElement) {
    return;
  }

  const targetRect = targetElement.getBoundingClientRect();
  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;

  units.forEach((unit) => {
    if (unit.team === attacker.team) {
      return;
    }

    if (unit.hp <= 0) {
      return;
    }

    const element = getUnitElement(unit.id);

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const unitX = rect.left + rect.width / 2;
    const unitY = rect.top + rect.height / 2;
    const distance = Math.hypot(unitX - centerX, unitY - centerY);

    if (distance > attacker.splashRadius) {
      return;
    }

    const damageScale = 1 - Math.min(1, distance / attacker.splashRadius) * 0.5;
    const damage = attacker.attackDamage * damageScale;
    const wasAlive = unit.hp > 0;

    const previousHp = unit.hp;

    unit.hp = Math.max(0, unit.hp - damage);

    dispatchRuntimeEvent("runtime-unit-damage", {
      unitId: unit.id,
      attackerId: attacker.id,
      amount: previousHp - unit.hp,
      hp: unit.hp,
      maxHp: unit.maxHp,
      unit,
      attacker,
    });

    playHitEffect(unit);
    updateUnitHealth(unit);

    if (wasAlive && unit.hp <= 0) {
      grantKillReward(attacker, unit);

      playDeathEffect(unit, () => {
        removeRuntimeUnit(unit.id);
      });
    }
  });
};

const fireProjectile = (attacker: RuntimeUnit, target: RuntimeUnit) => {
  const attackerElement = getUnitElement(attacker.id);

  const targetElement = getUnitElement(target.id);

  if (!attackerElement || !targetElement) {
    return;
  }

  const attackerRect = attackerElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  const startX = attackerRect.left + attackerRect.width / 2;
  const startY = attackerRect.top + attackerRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;
  const deltaX = endX - startX;

  const deltaY = endY - startY;

  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  const distance = Math.hypot(endX - startX, endY - startY);
  const duration = Math.max(
    80,
    Math.min(1200, (distance / attacker.projectileSpeed) * 1000),
  );

  const projectile = document.createElement("div");

  projectile.setAttribute("data-runtime-projectile", attacker.team);
  projectile.style.position = "fixed";
  projectile.style.left = `${startX}px`;
  projectile.style.top = `${startY}px`;
  applyProjectileStyle(projectile, attacker);
  projectile.style.boxShadow = `0 0 10px ${attacker.teamColor}`;
  projectile.style.pointerEvents = "none";
  projectile.style.zIndex = "100000";
  projectile.style.transform = `translate(-50%, -50%) translate(0px, 0px) rotate(${angle}deg)`;
  document.body.appendChild(projectile);
  activeProjectiles.add(projectile);

  const generation = runtimeGeneration;

  const animation = projectile.animate(
    [
      {
        transform: `translate(-50%, -50%) translate(0px, 0px) rotate(${angle}deg)`,
      },
      {
        transform: `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) rotate(${angle}deg)`,
      },
    ],
    {
      duration,
      easing: "linear",
    },
  );

  const cleanup = () => {
    activeProjectiles.delete(projectile);
    projectile.remove();
  };

  animation.onfinish = () => {
    cleanup();

    if (generation !== runtimeGeneration) {
      return;
    }

    const liveTarget = units.get(target.id);

    if (!liveTarget || liveTarget.hp <= 0) {
      return;
    }

    dispatchRuntimeEvent("runtime-projectile-hit", {
      unitId: attacker.id,
      targetId: liveTarget.id,
      projectileType: attacker.projectileType,
      unit: attacker,
      target: liveTarget,
    });

    if (
      attacker.projectileType === "orb" ||
      attacker.projectileType === "shell"
    ) {
      playImpactEffect(
        endX,
        endY,
        attacker.projectileType === "shell" ? "#f97316" : attacker.teamColor,
        attacker.splashRadius > 0 ? attacker.splashRadius * 2 : 50,
      );
    }

    if (attacker.splashRadius > 0) {
      applySplashDamage(attacker, liveTarget);

      return;
    }

    const previousHp = liveTarget.hp;

    liveTarget.hp = Math.max(0, liveTarget.hp - attacker.attackDamage);

    dispatchRuntimeEvent("runtime-unit-damage", {
      unitId: liveTarget.id,
      attackerId: attacker.id,
      amount: previousHp - liveTarget.hp,
      hp: liveTarget.hp,
      maxHp: liveTarget.maxHp,
      unit: liveTarget,
      attacker,
    });

    playHitEffect(liveTarget);
    updateUnitHealth(liveTarget);

    if (liveTarget.hp <= 0) {
      grantKillReward(attacker, liveTarget);

      playDeathEffect(liveTarget, () => {
        removeRuntimeUnit(liveTarget.id);
      });
    }
  };

  animation.oncancel = cleanup;
};

const getAvoidanceVector = (unit: RuntimeUnit) => {
  let avoidX = 0;
  let avoidY = 0;

  units.forEach((other) => {
    if (other.id === unit.id || other.hp <= 0) {
      return;
    }

    const dx = unit.x - other.x;
    const dy = unit.y - other.y;
    const distance = Math.hypot(dx, dy);
    const avoidDistance = (unit.collisionRadius + other.collisionRadius) * 1.8;

    if (distance <= 0 || distance > avoidDistance) {
      return;
    }

    const strength = 1 - distance / avoidDistance;

    avoidX += (dx / distance) * strength;
    avoidY += (dy / distance) * strength;
  });

  return {
    x: avoidX,
    y: avoidY,
  };
};

const applyUnitSeparation = () => {
  const unitList = Array.from(units.values()).filter((unit) => unit.hp > 0);

  for (let i = 0; i < unitList.length; i += 1) {
    const a = unitList[i];

    for (let j = i + 1; j < unitList.length; j += 1) {
      const b = unitList[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);

      if (distance === 0) {
        dx = i % 2 === 0 ? 1 : -1;
        dy = j % 2 === 0 ? 0.5 : -0.5;
        distance = Math.hypot(dx, dy);
      }

      const minDistance = a.collisionRadius + b.collisionRadius;

      if (distance >= minDistance) {
        continue;
      }

      const overlap = minDistance - distance;
      const normalX = dx / distance;
      const normalY = dy / distance;
      const strength = Math.min(a.separationStrength, b.separationStrength);
      const push = overlap * 0.5 * strength;
      const nextA = clampUnitPosition(
        a,
        a.x - normalX * push,
        a.y - normalY * push,
      );
      const nextB = clampUnitPosition(
        b,
        b.x + normalX * push,
        b.y + normalY * push,
      );

      a.x = nextA.x;
      a.y = nextA.y;
      b.x = nextB.x;
      b.y = nextB.y;
    }
  }
};

const tick = (time: number) => {
  if (!lastTime) {
    lastTime = time;
  }

  const delta = Math.min((time - lastTime) / 1000, 0.05);

  lastTime = time;

  const arrivalRadius = 2;
  const slowRadius = 120;
  const hasAggroActivity = updateAggro();

  let hasActivity = updateCombat(time) || hasAggroActivity;
  const unitList = Array.from(units.values());

  unitList.forEach((unit) => {
    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const distance = Math.hypot(dx, dy);

    if (unit.animationState !== "death" && time >= unit.attackStateUntil) {
      setUnitAnimationState(unit, distance > arrivalRadius ? "move" : "idle");
    }

    if (distance <= arrivalRadius) {
      unit.x = unit.targetX;
      unit.y = unit.targetY;

      if (
        (unit.command === "move" || unit.command === "attackMove") &&
        !unit.attackTargetId
      ) {
        unit.command = "idle";
        unit.commandTargetX = undefined;
        unit.commandTargetY = undefined;
      }

      return;
    }

    hasActivity = true;

    const speedFactor =
      distance < slowRadius ? Math.max(distance / slowRadius, 0.15) : 1;
    const currentSpeed = unit.speed * speedFactor;
    const moveDistance = Math.min(currentSpeed * delta, distance);
    const directionX = dx / distance;
    const directionY = dy / distance;
    const avoidance = getAvoidanceVector(unit);
    let moveX = directionX + avoidance.x * 0.7;
    let moveY = directionY + avoidance.y * 0.7;
    const moveLength = Math.hypot(moveX, moveY);

    if (moveLength > 0) {
      moveX /= moveLength;
      moveY /= moveLength;
      setUnitFacing(unit, moveX, moveY);
    }

    unit.x += moveX * moveDistance;
    unit.y += moveY * moveDistance;
  });

  applyUnitSeparation();

  unitList.forEach((unit) => {
    const position = clampUnitPosition(unit, unit.x, unit.y);

    unit.x = position.x;
    unit.y = position.y;

    updateElement(unit);
  });

  if (!hasActivity) {
    frameId = 0;
    lastTime = 0;

    return;
  }

  frameId = requestAnimationFrame(tick);
};

const ensureLoop = () => {
  if (frameId) {
    return;
  }

  lastTime = 0;

  frameId = requestAnimationFrame(tick);
};

const removeRuntimeUnit = (id: string) => {
  const unit = units.get(id);

  if (!unit) {
    return false;
  }

  units.delete(id);
  selectedUnitIds.delete(id);

  dispatchRuntimeEvent("runtime-unit-remove", {
    unitId: unit.id,
    unit,
  });

  const element = getUnitElement(id);

  if (element) {
    element.removeAttribute("data-runtime-selected");
    element.removeAttribute("data-runtime-preview-selected");
    element.setAttribute("data-runtime-dead", "true");
    element.style.display = "none";
  }

  units.forEach((otherUnit) => {
    if (otherUnit.attackTargetId === id) {
      resumeUnitCommand(otherUnit);
    }
  });

  return true;
};

const attackUnit = (attackerId: string, targetId: string) => {
  if (attackerId === targetId) {
    return false;
  }

  const attacker = units.get(attackerId);
  const target = units.get(targetId);

  if (!attacker || !target) {
    return false;
  }

  if (attacker.team === target.team) {
    return false;
  }

  attacker.attackTargetId = targetId;
  attacker.aggroTargetId = undefined;
  attacker.command = "attack";
  attacker.commandTargetX = undefined;
  attacker.commandTargetY = undefined;

  ensureLoop();

  return true;
};

const stopAttackUnit = (id: string) => {
  const unit = units.get(id);

  if (!unit) {
    return false;
  }

  unit.attackTargetId = undefined;
  unit.aggroTargetId = undefined;
  unit.command = "idle";
  unit.commandTargetX = undefined;
  unit.commandTargetY = undefined;
  unit.targetX = unit.x;
  unit.targetY = unit.y;

  return true;
};

export const runtimeUnits = {
  spawn(id: string, options: RuntimeUnitSpawnOptions = {}) {
    const element = document.querySelector<HTMLElement>(
      `[data-runtime-unit-id="${CSS.escape(id)}"]`,
    );

    if (!element) {
      console.warn("[runtimeUnits] element not found:", id);

      return null;
    }

    const team = options.team ?? "neutral";
    const teamColor = getTeamColor(team, options.teamColor);
    const unitClass = options.unitClass ?? "custom";
    const preset =
      unitClass === "custom" ? undefined : UNIT_CLASS_PRESETS[unitClass];
    const unitType = options.unitType ?? preset?.unitType ?? "melee";
    const hp = options.hp ?? preset?.hp ?? 100;

    const unit: RuntimeUnit = {
      id,
      x: options.x ?? 0,
      y: options.y ?? 0,
      targetX: options.x ?? 0,
      targetY: options.y ?? 0,
      speed: options.speed ?? preset?.speed ?? 120,
      collisionRadius: options.collisionRadius ?? preset?.collisionRadius ?? 28,
      separationStrength: options.separationStrength ?? 1,
      animationState: "idle",
      facingX: 1,
      facingY: 0,
      facingAngle: 0,
      attackStateUntil: 0,
      attackAnimationDuration: options.attackAnimationDuration ?? 180,
      deathAnimationDuration: options.deathAnimationDuration ?? 350,
      hp,
      maxHp: hp,
      team,
      teamColor,
      unitType,
      unitClass,
      attackDamage: options.attackDamage ?? preset?.attackDamage ?? 10,
      attackRange:
        options.attackRange ??
        preset?.attackRange ??
        (unitType === "ranged" ? 280 : 100),
      attackCooldown: options.attackCooldown ?? preset?.attackCooldown ?? 800,
      lastAttackTime: 0,
      attackTargetId: undefined,
      command: "idle",
      commandTargetX: undefined,
      commandTargetY: undefined,
      aggroRange: options.aggroRange ?? preset?.aggroRange ?? 250,
      aggroLeashRange: options.aggroLeashRange ?? 500,
      kills: 0,
      experience: 0,
      aggroTargetId: undefined,
      projectileSpeed:
        options.projectileSpeed ?? preset?.projectileSpeed ?? 700,
      projectileType:
        options.projectileType ??
        preset?.projectileType ??
        (unitType === "ranged" ? "arrow" : "none"),
      splashRadius: options.splashRadius ?? preset?.splashRadius ?? 0,
    };

    units.set(id, unit);
    updateElement(unit);

    const runtimeElement = getUnitElement(id);

    if (runtimeElement) {
      runtimeElement.setAttribute("data-runtime-team", unit.team);
      runtimeElement.setAttribute("data-runtime-unit-type", unit.unitType);
      runtimeElement.setAttribute("data-runtime-unit-class", unit.unitClass);
      runtimeElement.setAttribute(
        "data-runtime-projectile-type",
        unit.projectileType,
      );
      runtimeElement.removeAttribute("data-runtime-dead");
      runtimeElement.style.removeProperty("display");
    }

    ensureHealthBar(unit);
    ensureTeamRing(unit);
    updateUnitHealth(unit);

    dispatchRuntimeEvent("runtime-unit-spawn", {
      unitId: unit.id,
      unit,
    });

    ensureLoop();
    console.log("[runtimeUnits] spawned:", unit);

    return unit;
  },
  moveTo(id: string, x: number, y: number) {
    const unit = units.get(id);

    if (!unit) {
      return false;
    }

    unit.attackTargetId = undefined;
    unit.aggroTargetId = undefined;

    const target = clampUnitPosition(unit, x, y);
    unit.targetX = target.x;
    unit.targetY = target.y;

    unit.command = "move";
    unit.commandTargetX = target.x;
    unit.commandTargetY = target.y;

    ensureLoop();

    return true;
  },
  get(id: string) {
    return units.get(id);
  },
  getStats(id: string) {
    const unit = units.get(id);

    if (!unit) {
      return undefined;
    }

    return {
      hp: unit.hp,
      maxHp: unit.maxHp,
      kills: unit.kills,
      experience: unit.experience,
      unitClass: unit.unitClass,
      team: unit.team,
      animationState: unit.animationState,
      facingX: unit.facingX,
      facingY: unit.facingY,
      facingAngle: unit.facingAngle,
      command: unit.command,
      attackTargetId: unit.attackTargetId,
    };
  },
  setAnimationState(id: string, state: RuntimeUnitAnimationState) {
    const unit = units.get(id);

    if (!unit || unit.animationState === "death") {
      return false;
    }

    setUnitAnimationState(unit, state);
    updateElement(unit);

    return true;
  },
  setFacing(id: string, x: number, y: number) {
    const unit = units.get(id);

    if (!unit) {
      return false;
    }

    setUnitFacing(unit, x, y);
    updateElement(unit);

    return true;
  },
  getAllStats() {
    return Array.from(units.values()).map((unit) => ({
      id: unit.id,
      hp: unit.hp,
      maxHp: unit.maxHp,
      kills: unit.kills,
      experience: unit.experience,
      unitClass: unit.unitClass,
      unitType: unit.unitType,
      team: unit.team,
      animationState: unit.animationState,
      facingX: unit.facingX,
      facingY: unit.facingY,
      facingAngle: unit.facingAngle,
      command: unit.command,
      attackTargetId: unit.attackTargetId,
    }));
  },
  remove(id: string) {
    return removeRuntimeUnit(id);
  },
  clear() {
    runtimeGeneration += 1;

    activeProjectiles.forEach((projectile) => {
      projectile.getAnimations().forEach((animation) => animation.cancel());

      projectile.remove();
    });

    activeProjectiles.clear();

    units.forEach((unit) => {
      const element = getUnitElement(unit.id);

      if (!element) {
        return;
      }

      element.removeAttribute("data-runtime-selected");
      element.removeAttribute("data-runtime-preview-selected");
      element.removeAttribute("data-runtime-dead");
      element.removeAttribute("data-runtime-team");
      element.removeAttribute("data-runtime-hp");
      element.removeAttribute("data-runtime-max-hp");
      element.style.removeProperty("display");
      element.style.removeProperty("transform");
      element.style.removeProperty("opacity");
      element.style.removeProperty("filter");
      element.style.removeProperty("pointer-events");
      element.style.removeProperty("--runtime-hp-ratio");
      element.querySelector("[data-runtime-health-overlay]")?.remove();

      element.removeAttribute("data-runtime-unit-type");
      element.removeAttribute("data-runtime-unit-class");
      element.removeAttribute("data-runtime-projectile-type");
      element.removeAttribute("data-runtime-animation-state");
      element.removeAttribute("data-runtime-facing");
      element.removeAttribute("data-runtime-command");
      element.removeAttribute("data-runtime-attack-target");
      element.style.removeProperty("--runtime-facing-x");
      element.style.removeProperty("--runtime-facing-y");
      element.style.removeProperty("--runtime-facing-angle");
      element.style.removeProperty("--runtime-team-color");
      element.querySelector("[data-runtime-team-ring]")?.remove();
      element
        .querySelectorAll("[data-runtime-hit-effect]")
        .forEach((effect) => effect.remove());
    });

    units.clear();
    selectedUnitIds.clear();

    if (frameId) {
      cancelAnimationFrame(frameId);

      frameId = 0;
      lastTime = 0;
    }
  },
  select(id: string, append = false) {
    if (!units.has(id)) {
      return false;
    }

    if (append && selectedUnitIds.has(id)) {
      selectedUnitIds.delete(id);
      const element = document.querySelector<HTMLElement>(
        `[data-runtime-unit-id="${CSS.escape(id)}"]`,
      );

      element?.removeAttribute("data-runtime-selected");
      return true;
    }

    if (!append) {
      selectedUnitIds.forEach((selectedId) => {
        const previousElement = document.querySelector<HTMLElement>(
          `[data-runtime-unit-id="${CSS.escape(selectedId)}"]`,
        );

        previousElement?.removeAttribute("data-runtime-selected");
      });
      selectedUnitIds.clear();
    }
    selectedUnitIds.add(id);

    const element = document.querySelector<HTMLElement>(
      `[data-runtime-unit-id="${CSS.escape(id)}"]`,
    );
    element?.setAttribute("data-runtime-selected", "true");

    return true;
  },
  getSelected() {
    return Array.from(selectedUnitIds);
  },
  clearSelected() {
    selectedUnitIds.forEach((id: string) => {
      const element = document.querySelector<HTMLElement>(
        `[data-runtime-unit-id="${CSS.escape(id)}"]`,
      );

      element?.removeAttribute("data-runtime-selected");
    });

    selectedUnitIds.clear();
  },
  moveSelectedTo(x: number, y: number) {
    const selected = Array.from(selectedUnitIds)
      .map((id) => units.get(id))
      .filter((unit): unit is RuntimeUnit => Boolean(unit));

    if (selected.length === 0) {
      return false;
    }

    const centerX =
      selected.reduce((sum, unit) => sum + unit.x, 0) / selected.length;
    const centerY =
      selected.reduce((sum, unit) => sum + unit.y, 0) / selected.length;
    const targets = selected.map((unit) => {
      const size = getUnitSize(unit.id);

      return {
        unit,
        width: size.width,
        height: size.height,
        x: x + (unit.x - centerX),
        y: y + (unit.y - centerY),
      };
    });

    const firstBounds = getRuntimeBounds(selected[0].id);
    if (!firstBounds) {
      return false;
    }

    const minX = Math.min(...targets.map((target) => target.x));
    const minY = Math.min(...targets.map((target) => target.y));
    const maxX = Math.max(...targets.map((target) => target.x + target.width));
    const maxY = Math.max(...targets.map((target) => target.y + target.height));

    let correctionX = 0;
    let correctionY = 0;

    if (minX < 0) {
      correctionX = -minX;
    } else if (maxX > firstBounds.width) {
      correctionX = firstBounds.width - maxX;
    }

    if (minY < 0) {
      correctionY = -minY;
    } else if (maxY > firstBounds.height) {
      correctionY = firstBounds.height - maxY;
    }

    selected.forEach((unit) => {
      unit.attackTargetId = undefined;
      unit.aggroTargetId = undefined;
    });

    targets.forEach((target) => {
      const next = clampUnitPosition(
        target.unit,
        target.x + correctionX,
        target.y + correctionY,
      );

      target.unit.command = "move";
      target.unit.commandTargetX = next.x;
      target.unit.commandTargetY = next.y;
      target.unit.targetX = next.x;
      target.unit.targetY = next.y;
    });

    ensureLoop();

    return true;
  },
  selectMany(ids: string[], append = false) {
    if (!append) {
      selectedUnitIds.forEach((selectedId) => {
        const element = document.querySelector<HTMLElement>(
          `[data-runtime-unit-id="${CSS.escape(selectedId)}"]`,
        );

        element?.removeAttribute("data-runtime-selected");
      });

      selectedUnitIds.clear();
    }

    ids.forEach((id) => {
      if (!units.has(id)) {
        return;
      }

      selectedUnitIds.add(id);

      const element = document.querySelector<HTMLElement>(
        `[data-runtime-unit-id="${CSS.escape(id)}"]`,
      );

      element?.setAttribute("data-runtime-selected", "true");
    });

    return Array.from(selectedUnitIds);
  },
  attack(attackerId: string, targetId: string) {
    return attackUnit(attackerId, targetId);
  },
  stopAttack(id: string) {
    return stopAttackUnit(id);
  },
  damage(id: string, amount: number) {
    const unit = units.get(id);
    if (!unit) {
      return false;
    }

    unit.hp = Math.max(0, unit.hp - Math.max(0, amount));
    playHitEffect(unit);
    updateUnitHealth(unit);

    if (unit.hp <= 0) {
      playDeathEffect(unit, () => {
        removeRuntimeUnit(id);
      });
    }

    return true;
  },
  attackSelected(targetId: string) {
    const target = units.get(targetId);
    if (!target) {
      return false;
    }

    let attackCount = 0;

    selectedUnitIds.forEach((id) => {
      const attacker = units.get(id);

      if (
        !attacker ||
        attacker.id === target.id ||
        attacker.team === target.team
      ) {
        return;
      }

      attacker.attackTargetId = target.id;
      attacker.aggroTargetId = undefined;
      attacker.command = "attack";
      attacker.commandTargetX = undefined;
      attacker.commandTargetY = undefined;
      attackCount += 1;
    });

    if (attackCount === 0) {
      return false;
    }

    ensureLoop();

    return true;
  },
  attackMove(id: string, x: number, y: number) {
    const unit = units.get(id);

    if (!unit) {
      return false;
    }

    const target = clampUnitPosition(unit, x, y);

    unit.attackTargetId = undefined;
    unit.aggroTargetId = undefined;
    unit.command = "attackMove";
    unit.commandTargetX = target.x;
    unit.commandTargetY = target.y;
    unit.targetX = target.x;
    unit.targetY = target.y;

    ensureLoop();

    return true;
  },
  attackMoveSelectedTo(x: number, y: number) {
    const selected = Array.from(selectedUnitIds)
      .map((id) => units.get(id))
      .filter((unit): unit is RuntimeUnit => Boolean(unit));

    if (selected.length === 0) {
      return false;
    }

    const centerX =
      selected.reduce((sum, unit) => sum + unit.x, 0) / selected.length;
    const centerY =
      selected.reduce((sum, unit) => sum + unit.y, 0) / selected.length;
    const targets = selected.map((unit) => {
      const size = getUnitSize(unit.id);

      return {
        unit,
        width: size.width,
        height: size.height,
        x: x + (unit.x - centerX),
        y: y + (unit.y - centerY),
      };
    });

    const firstBounds = getRuntimeBounds(selected[0].id);
    if (!firstBounds) {
      return false;
    }

    const minX = Math.min(...targets.map((target) => target.x));
    const minY = Math.min(...targets.map((target) => target.y));
    const maxX = Math.max(...targets.map((target) => target.x + target.width));
    const maxY = Math.max(...targets.map((target) => target.y + target.height));

    let correctionX = 0;
    let correctionY = 0;

    if (minX < 0) {
      correctionX = -minX;
    } else if (maxX > firstBounds.width) {
      correctionX = firstBounds.width - maxX;
    }

    if (minY < 0) {
      correctionY = -minY;
    } else if (maxY > firstBounds.height) {
      correctionY = firstBounds.height - maxY;
    }

    targets.forEach((target) => {
      const next = clampUnitPosition(
        target.unit,
        target.x + correctionX,
        target.y + correctionY,
      );

      target.unit.attackTargetId = undefined;
      target.unit.aggroTargetId = undefined;
      target.unit.command = "attackMove";
      target.unit.commandTargetX = next.x;
      target.unit.commandTargetY = next.y;
      target.unit.targetX = next.x;
      target.unit.targetY = next.y;
    });

    ensureLoop();

    return true;
  },
  showCommandMarker(
    container: HTMLElement,
    x: number,
    y: number,
    type: "move" | "attackMove" | "attack",
  ) {
    showCommandMarker(container, x, y, type);
  },
};
