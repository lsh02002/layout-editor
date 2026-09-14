import type {
  LayoutComponent,
  RuntimeUnitClass,
  RuntimeUnitConfig,
  RuntimeProjectileType,
} from "../../../../types/types";

type Props = {
  draftComponent: LayoutComponent;
  onChange: (updater: (component: LayoutComponent) => LayoutComponent) => void;
};

const TEAM_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
  neutral: "#94a3b8",
};

const UNIT_PRESETS: Record<
  Exclude<RuntimeUnitClass, "custom">,
  Partial<RuntimeUnitConfig>
> = {
  knight: {
    hp: 180,
    speed: 110,
    collisionRadius: 30,
    attackDamage: 24,
    attackRange: 80,
    attackCooldown: 700,
    projectileType: "none",
    projectileSpeed: 0,
    splashRadius: 0,
    aggroRange: 260,
  },

  archer: {
    hp: 90,
    speed: 120,
    collisionRadius: 24,
    attackDamage: 14,
    attackRange: 320,
    attackCooldown: 950,
    projectileType: "arrow",
    projectileSpeed: 850,
    splashRadius: 0,
    aggroRange: 400,
  },

  mage: {
    hp: 75,
    speed: 105,
    collisionRadius: 24,
    attackDamage: 22,
    attackRange: 280,
    attackCooldown: 1200,
    projectileType: "orb",
    projectileSpeed: 600,
    splashRadius: 90,
    aggroRange: 360,
  },

  tank: {
    hp: 260,
    speed: 70,
    collisionRadius: 36,
    attackDamage: 38,
    attackRange: 360,
    attackCooldown: 1600,
    projectileType: "shell",
    projectileSpeed: 500,
    splashRadius: 120,
    aggroRange: 420,
  },
};

const RtsUnitEditorTab = ({ draftComponent, onChange }: Props) => {
  const runtimeUnit = draftComponent.runtimeUnit;

  if (!runtimeUnit?.enabled) {
    return null;
  }

  const updateRuntimeUnit = (patch: Partial<RuntimeUnitConfig>) => {
    onChange((current) => ({
      ...current,

      runtimeUnit: {
        enabled: true,
        unitClass: current.runtimeUnit?.unitClass ?? "knight",
        team: current.runtimeUnit?.team ?? "blue",

        ...current.runtimeUnit,
        ...patch,
      },
    }));
  };

  const updateNumber = (key: keyof RuntimeUnitConfig, value: string) => {
    updateRuntimeUnit({
      [key]: value === "" ? undefined : Number(value),
    });
  };

  const applyUnitClass = (unitClass: RuntimeUnitClass) => {
    if (unitClass === "custom") {
      updateRuntimeUnit({
        unitClass,
      });

      return;
    }

    updateRuntimeUnit({
      ...UNIT_PRESETS[unitClass],
      unitClass,
    });
  };

  return (
    <>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Unit Class</label>

          <select
            className="form-select form-select-sm"
            value={runtimeUnit.unitClass}
            onChange={(event) =>
              applyUnitClass(event.target.value as RuntimeUnitClass)
            }
          >
            <option value="custom">Custom</option>
            <option value="knight">Knight</option>
            <option value="archer">Archer</option>
            <option value="mage">Mage</option>
            <option value="tank">Tank</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold">Team</label>

          <input
            type="text"
            className="form-control form-control-sm"
            value={runtimeUnit.team}
            onChange={(event) => {
              const team = event.target.value;

              updateRuntimeUnit({
                team,
                teamColor:
                  TEAM_COLORS[team] ?? runtimeUnit.teamColor ?? "#94a3b8",
              });
            }}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold">Team Color</label>

          <input
            type="color"
            className="form-control form-control-color"
            value={
              runtimeUnit.teamColor ??
              TEAM_COLORS[runtimeUnit.team] ??
              "#94a3b8"
            }
            disabled
            onChange={(event) =>
              updateRuntimeUnit({
                teamColor: event.target.value,
              })
            }
          />
        </div>

        <hr className="my-0" />

        <div className="fw-semibold small">Stats</div>

        <NumberField
          label="HP"
          value={runtimeUnit.hp}
          onChange={(value) => updateNumber("hp", value)}
        />

        <NumberField
          label="Move Speed"
          value={runtimeUnit.speed}
          onChange={(value) => updateNumber("speed", value)}
        />

        <NumberField
          label="Collision Radius"
          value={runtimeUnit.collisionRadius}
          onChange={(value) => updateNumber("collisionRadius", value)}
        />

        <NumberField
          label="Separation Strength"
          value={runtimeUnit.separationStrength}
          onChange={(value) => updateNumber("separationStrength", value)}
        />

        <hr className="my-3" />

        <div className="fw-semibold small">Combat</div>

        <NumberField
          label="Damage"
          value={runtimeUnit.attackDamage}
          onChange={(value) => updateNumber("attackDamage", value)}
        />

        <NumberField
          label="Attack Range"
          value={runtimeUnit.attackRange}
          onChange={(value) => updateNumber("attackRange", value)}
        />

        <NumberField
          label="Attack Cooldown"
          value={runtimeUnit.attackCooldown}
          onChange={(value) => updateNumber("attackCooldown", value)}
        />

        <NumberField
          label="Aggro Range"
          value={runtimeUnit.aggroRange}
          onChange={(value) => updateNumber("aggroRange", value)}
        />

        <NumberField
          label="Aggro Leash Range"
          value={runtimeUnit.aggroLeashRange}
          onChange={(value) => updateNumber("aggroLeashRange", value)}
        />

        <hr className="my-3" />

        <div className="fw-semibold small">Projectile</div>

        <div>
          <label className="form-label small">Projectile Type</label>

          <select
            className="form-select form-select-sm"
            value={runtimeUnit.projectileType ?? "none"}
            onChange={(event) =>
              updateRuntimeUnit({
                projectileType: event.target.value as RuntimeProjectileType,
              })
            }
          >
            <option value="none">None</option>
            <option value="arrow">Arrow</option>
            <option value="orb">Orb</option>
            <option value="shell">Shell</option>
          </select>
        </div>

        <NumberField
          label="Projectile Speed"
          value={runtimeUnit.projectileSpeed}
          onChange={(value) => updateNumber("projectileSpeed", value)}
        />

        <NumberField
          label="Splash Radius"
          value={runtimeUnit.splashRadius}
          onChange={(value) => updateNumber("splashRadius", value)}
        />

        <hr className="my-3" />

        <div className="fw-semibold small">Animation</div>

        <NumberField
          label="Attack Duration"
          value={runtimeUnit.attackAnimationDuration}
          onChange={(value) => updateNumber("attackAnimationDuration", value)}
        />

        <NumberField
          label="Death Duration"
          value={runtimeUnit.deathAnimationDuration}
          onChange={(value) => updateNumber("deathAnimationDuration", value)}
        />
      </div>
    </>
  );
};

type NumberFieldProps = {
  label: string;
  value?: number;
  onChange: (value: string) => void;
};

const NumberField = ({ label, value, onChange }: NumberFieldProps) => (
  <div className="col-md-6">
    <label className="form-label small">{label}</label>

    <input
      type="number"
      className="form-control form-control-sm"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

export default RtsUnitEditorTab;
