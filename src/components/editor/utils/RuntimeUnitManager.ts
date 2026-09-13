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

  command: "idle" | "move" | "attack" | "attackMove";

  commandTargetX?: number;
  commandTargetY?: number;

  aggroRange: number;
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

const findNearestEnemy = (unit: RuntimeUnit, maxDistance: number) => {
  const element = getUnitElement(unit.id);

  if (!element) {
    return undefined;
  }

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let nearest: RuntimeUnit | undefined;
  let nearestDistance = maxDistance;

  units.forEach((otherUnit) => {
    if (
      otherUnit.id === unit.id ||
      otherUnit.team === unit.team ||
      otherUnit.hp <= 0
    ) {
      return;
    }

    const otherElement = getUnitElement(otherUnit.id);

    if (!otherElement) {
      return;
    }

    const otherRect = otherElement.getBoundingClientRect();
    const otherCenterX = otherRect.left + otherRect.width / 2;
    const otherCenterY = otherRect.top + otherRect.height / 2;
    const distance = Math.hypot(otherCenterX - centerX, otherCenterY - centerY);

    if (distance > nearestDistance) {
      return;
    }

    nearestDistance = distance;

    nearest = otherUnit;
  });

  return nearest;
};

const updateAggro = () => {
  let hasAggroActivity = false;

  units.forEach((unit) => {
    if (unit.command !== "attackMove") {
      return;
    }

    if (unit.attackTargetId) {
      return;
    }

    const enemy = findNearestEnemy(unit, unit.aggroRange);

    if (!enemy) {
      return;
    }

    unit.attackTargetId = enemy.id;
    hasAggroActivity = true;
  });

  return hasAggroActivity;
};

const resumeUnitCommand = (unit: RuntimeUnit) => {
  unit.attackTargetId = undefined;

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
  const hasAggroActivity = updateAggro();

  let hasActivity = updateCombat(time) || hasAggroActivity;
  const unitList = Array.from(units.values());

  unitList.forEach((unit) => {
    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const distance = Math.hypot(dx, dy);

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
  unit.command = "idle";
  unit.commandTargetX = undefined;
  unit.commandTargetY = undefined;
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
      aggroRange?: number;
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
      command: "idle",
      commandTargetX: undefined,
      commandTargetY: undefined,
      aggroRange: options.aggroRange ?? 250,
    };

    units.set(id, unit);
    updateElement(unit);

    const runtimeElement = getUnitElement(id);

    if (runtimeElement) {
      runtimeElement.setAttribute("data-runtime-team", unit.team);
      runtimeElement.removeAttribute("data-runtime-dead");
      runtimeElement.style.removeProperty("display");
    }

    ensureHealthBar(unit);
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

    unit.command = "move";
    unit.commandTargetX = target.x;
    unit.commandTargetY = target.y;

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
      element.style.removeProperty("--runtime-hp-ratio");
      element.querySelector("[data-runtime-health-overlay]")?.remove();
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
