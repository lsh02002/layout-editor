export interface RuntimeUnit {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  hp: number;
  maxHp: number;

  team: string;

  attackDamage: number;
  attackRange: number;
  attackCooldown: number;

  lastAttackTime: number;
  attackTargetId?: string;
}

const units = new Map<string, RuntimeUnit>();

const selectedUnitIds = new Set<string>();

let frameId = 0;
let lastTime = 0;

const updateElement = (unit: RuntimeUnit) => {
  const element = document.querySelector<HTMLElement>(
    `[data-runtime-unit-id="${CSS.escape(unit.id)}"]`,
  );

  if (!element) {
    return;
  }

  element.style.transform = `translate3d(${unit.x}px, ${unit.y}px, 0)`;
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

const getRuntimeBounds = (id: string) => {
  const element = getUnitElement(id);

  const container = element?.closest<HTMLElement>("[data-runtime-map]");

  if (!element || !container) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();

  return {
    width: containerRect.width,
    height: containerRect.height,
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
      unit.attackTargetId = undefined;

      unit.targetX = unit.x;

      unit.targetY = unit.y;

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

    hasCombatActivity = true;

    if (distance > unit.attackRange) {
      unit.targetX = unit.x + dx;
      unit.targetY = unit.y + dy;
      return;
    }

    unit.targetX = unit.x;
    unit.targetY = unit.y;

    const elapsed = time - unit.lastAttackTime;

    if (elapsed < unit.attackCooldown) {
      return;
    }

    unit.lastAttackTime = time;
    target.hp = Math.max(0, target.hp - unit.attackDamage);

    updateUnitHealth(target);

    if (target.hp <= 0) {
      deadUnitIds.add(target.id);
    }
  });

  deadUnitIds.forEach((id) => {
    removeRuntimeUnit(id);
  });

  return hasCombatActivity;
};

const tick = (time: number) => {
  if (!lastTime) {
    lastTime = time;
  }

  const delta = Math.min((time - lastTime) / 1000, 0.05);

  lastTime = time;

  const arrivalRadius = 2;
  const slowRadius = 120;
  const separationEpsilon = 0.5;

  let hasActivity = updateCombat(time);
  const unitList = Array.from(units.values());

  unitList.forEach((unit) => {
    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= arrivalRadius) {
      unit.x = unit.targetX;
      unit.y = unit.targetY;

      return;
    }

    hasActivity = true;

    const speedFactor =
      distance < slowRadius ? Math.max(distance / slowRadius, 0.15) : 1;
    const currentSpeed = unit.speed * speedFactor;
    const moveDistance = Math.min(currentSpeed * delta, distance);
    unit.x += (dx / distance) * moveDistance;
    unit.y += (dy / distance) * moveDistance;
  });

  unitList.forEach((unit) => {
    updateElement(unit);
  });

  for (let i = 0; i < unitList.length; i += 1) {
    const unitA = unitList[i];
    const elementA = document.querySelector<HTMLElement>(
      `[data-runtime-unit-id="${CSS.escape(unitA.id)}"]`,
    );

    if (!elementA) {
      continue;
    }

    const rectA = elementA.getBoundingClientRect();

    for (let j = i + 1; j < unitList.length; j += 1) {
      const unitB = unitList[j];
      const elementB = document.querySelector<HTMLElement>(
        `[data-runtime-unit-id="${CSS.escape(unitB.id)}"]`,
      );

      if (!elementB) {
        continue;
      }

      const rectB = elementB.getBoundingClientRect();
      const centerAX = rectA.left + rectA.width / 2;
      const centerAY = rectA.top + rectA.height / 2;
      const centerBX = rectB.left + rectB.width / 2;
      const centerBY = rectB.top + rectB.height / 2;
      let dx = centerAX - centerBX;
      let dy = centerAY - centerBY;

      let distance = Math.hypot(dx, dy);
      const radiusA = Math.max(rectA.width, rectA.height) / 2;
      const radiusB = Math.max(rectB.width, rectB.height) / 2;
      const minDistance = radiusA + radiusB;

      if (distance >= minDistance) {
        continue;
      }

      if (distance === 0) {
        dx = i % 2 === 0 ? 1 : -1;

        dy = j % 2 === 0 ? 0.5 : -0.5;

        distance = Math.hypot(dx, dy);
      }

      const overlap = minDistance - distance;

      if (overlap <= separationEpsilon) {
        continue;
      }

      hasActivity = true;

      const normalX = dx / distance;
      const normalY = dy / distance;
      const pushStrength = Math.min(overlap * 0.25, 3);
      const pushX = normalX * pushStrength;
      const pushY = normalY * pushStrength;

      unitA.x += pushX;
      unitA.y += pushY;
      unitB.x -= pushX;
      unitB.y -= pushY;
    }
  }

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

  const element = getUnitElement(id);

  if (element) {
    element.removeAttribute("data-runtime-selected");

    element.removeAttribute("data-runtime-preview-selected");

    element.setAttribute("data-runtime-dead", "true");

    element.style.display = "none";
  }

  units.forEach((otherUnit) => {
    if (otherUnit.attackTargetId === id) {
      otherUnit.attackTargetId = undefined;

      otherUnit.targetX = otherUnit.x;

      otherUnit.targetY = otherUnit.y;
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
  ensureLoop();

  return true;
};

const stopAttackUnit = (id: string) => {
  const unit = units.get(id);

  if (!unit) {
    return false;
  }

  unit.attackTargetId = undefined;
  unit.targetX = unit.x;
  unit.targetY = unit.y;

  return true;
};

export const runtimeUnits = {
  spawn(
    id: string,
    options: {
      x?: number;
      y?: number;
      speed?: number;
      hp?: number;
      team?: string;
      attackDamage?: number;
      attackRange?: number;
      attackCooldown?: number;
    } = {},
  ) {
    const element = document.querySelector<HTMLElement>(
      `[data-runtime-unit-id="${CSS.escape(id)}"]`,
    );

    if (!element) {
      console.warn("[runtimeUnits] element not found:", id);

      return null;
    }

    const hp = options.hp ?? 100;

    const unit: RuntimeUnit = {
      id,
      x: options.x ?? 0,
      y: options.y ?? 0,
      targetX: options.x ?? 0,
      targetY: options.y ?? 0,
      speed: options.speed ?? 120,
      hp: options.hp ?? 100,
      maxHp: hp,
      team: options.team ?? "neutral",
      attackDamage: options.attackDamage ?? 10,
      attackRange: options.attackRange ?? 100,
      attackCooldown: options.attackCooldown ?? 800,
      lastAttackTime: 0,
      attackTargetId: undefined,
    };

    units.set(id, unit);
    updateElement(unit);

    const runtimeElement = getUnitElement(id);

    if (runtimeElement) {
      runtimeElement.setAttribute("data-runtime-team", unit.team);
      runtimeElement.removeAttribute("data-runtime-dead");
      runtimeElement.style.removeProperty("display");
    }

    updateUnitHealth(unit);
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

    const target = clampUnitPosition(unit, x, y);
    unit.targetX = target.x;
    unit.targetY = target.y;

    ensureLoop();

    return true;
  },
  get(id: string) {
    return units.get(id);
  },
  remove(id: string) {
    return removeRuntimeUnit(id);
  },
  clear() {
    selectedUnitIds.forEach((id) => {
      const element = getUnitElement(id);

      element?.removeAttribute("data-runtime-selected");
    });

    units.forEach((unit) => {
      const element = getUnitElement(unit.id);

      if (!element) {
        return;
      }

      element.removeAttribute("data-runtime-selected");
      element.removeAttribute("data-runtime-preview-selected");
      element.removeAttribute("data-runtime-dead");
      element.removeAttribute("data-runtime-team");
      element.style.removeProperty("display");
      element.style.removeProperty("transform");
    });

    units.clear();
    selectedUnitIds.clear();
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
    });

    targets.forEach((target) => {
      const next = clampUnitPosition(
        target.unit,
        target.x + correctionX,
        target.y + correctionY,
      );

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

    updateUnitHealth(unit);

    if (unit.hp <= 0) {
      removeRuntimeUnit(id);
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
      attackCount += 1;
    });

    if (attackCount === 0) {
      return false;
    }

    ensureLoop();

    return true;
  },
};
