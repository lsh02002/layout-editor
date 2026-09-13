export interface RuntimeUnit {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  hp: number;
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

const tick = (time: number) => {
  if (!lastTime) {
    lastTime = time;
  }

  const delta = Math.min((time - lastTime) / 1000, 0.05);

  lastTime = time;

  units.forEach((unit) => {
    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= 1) {
      unit.x = unit.targetX;
      unit.y = unit.targetY;

      updateElement(unit);

      return;
    }

    const moveDistance = Math.min(unit.speed * delta, distance);
    unit.x += (dx / distance) * moveDistance;
    unit.y += (dy / distance) * moveDistance;

    updateElement(unit);
  });

  frameId = requestAnimationFrame(tick);
};

const ensureLoop = () => {
  if (frameId) {
    return;
  }

  lastTime = 0;

  frameId = requestAnimationFrame(tick);
};

export const runtimeUnits = {
  spawn(
    id: string,
    options: {
      x?: number;
      y?: number;
      speed?: number;
      hp?: number;
    } = {},
  ) {
    const element = document.querySelector<HTMLElement>(
      `[data-runtime-unit-id="${CSS.escape(id)}"]`,
    );

    if (!element) {
      console.warn("[runtimeUnits] element not found:", id);

      return null;
    }

    const unit: RuntimeUnit = {
      id,
      x: options.x ?? 0,
      y: options.y ?? 0,
      targetX: options.x ?? 0,
      targetY: options.y ?? 0,
      speed: options.speed ?? 120,
      hp: options.hp ?? 100,
    };

    units.set(id, unit);

    updateElement(unit);
    ensureLoop();

    console.log("[runtimeUnits] spawned:", unit);

    return unit;
  },
  moveTo(id: string, x: number, y: number) {
    const unit = units.get(id);

    if (!unit) {
      return false;
    }

    unit.targetX = x;
    unit.targetY = y;

    ensureLoop();

    return true;
  },
  get(id: string) {
    return units.get(id);
  },
  remove(id: string) {
    selectedUnitIds.delete(id);
    return units.delete(id);
  },
  clear() {
    units.clear();
    selectedUnitIds.clear();
  },
  select(id: string, append = false) {
    if (!units.has(id)) {
      return false;
    }

    if (!append) {
      selectedUnitIds.forEach((selectedId: string) => {
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
    const selected = Array.from(selectedUnitIds);

    if (selected.length === 0) {
      return false;
    }

    const spacing = 90;
    const columns = Math.ceil(Math.sqrt(selected.length));

    selected.forEach((id, index) => {
      const unit = units.get(id as string);

      if (!unit) {
        return;
      }

      const column = index % columns;
      const row = Math.floor(index / columns);
      const offsetX = (column - (columns - 1) / 2) * spacing;
      const offsetY = row * spacing;

      unit.targetX = x + offsetX;
      unit.targetY = y + offsetY;
    });

    ensureLoop();

    return true;
  },
  selectMany(ids: string[]) {
    selectedUnitIds.forEach((selectedId) => {
      const element = document.querySelector<HTMLElement>(
        `[data-runtime-unit-id="${CSS.escape(selectedId)}"]`,
      );

      element?.removeAttribute("data-runtime-selected");
    });

    selectedUnitIds.clear();

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
};
