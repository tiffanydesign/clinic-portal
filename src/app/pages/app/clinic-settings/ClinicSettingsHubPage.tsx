import React from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, DoorOpen, MonitorSmartphone, LucideIcon } from "lucide-react";
import { SETTINGS_CATEGORIES, SettingsModule } from "./clinicSettingsHubData";
import { useRooms } from "./roomsStore";
import { useDeviceViews } from "./deviceView";

// One icon per module name — deliberately keyed by name rather than a data
// field, since lucide's icon set has no single "module icon id" concept and
// this keeps clinicSettingsHubData.ts a plain data file.
const MODULE_ICON: Record<string, LucideIcon> = {
  "Consent Form Template": ShieldCheck,
  Rooms: DoorOpen,
  Devices: MonitorSmartphone,
};

type CardMeta = { text: string; alert?: boolean };

function ModuleCard({ module, meta }: { module: SettingsModule; meta?: CardMeta }) {
  const navigate = useNavigate();
  const Icon = MODULE_ICON[module.name];

  if (!module.enabled) {
    return (
      <div className="relative border border-divider rounded-card p-5 bg-surface-page opacity-60 cursor-not-allowed">
        <span className="absolute top-4 right-4 px-2 py-0.5 rounded-control text-overline bg-surface-sunken text-ink-muted">
          {module.badge}
        </span>
        <div className="w-10 h-10 rounded-card bg-surface-sunken flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-ink-muted" />
        </div>
        <h3 className="text-sm font-bold text-ink-muted">{module.name}</h3>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">{module.description}</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate(module.route!)}
      className="text-left border border-divider rounded-card p-5 bg-surface shadow-sm hover:border-border-strong hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-card bg-surface-hover flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-ink-soft" />
        </div>
        {module.status && (
          <span className="px-2 py-0.5 rounded-full text-label font-bold bg-success/10 border border-success/30 text-success-ink shrink-0">
            {module.status}
          </span>
        )}
      </div>
      <h3 className="text-sm font-bold text-ink">{module.name}</h3>
      <p className="text-xs text-ink-muted mt-1 leading-relaxed">{module.description}</p>
      {meta && (
        <p className="flex items-center gap-1.5 text-label font-semibold text-ink-muted mt-3 tabular-nums">
          {meta.alert && <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-hidden />}
          {meta.text}
        </p>
      )}
      {module.lastEdited && <p className="text-label text-ink-muted mt-3">{module.lastEdited}</p>}
    </button>
  );
}

export function ClinicSettingsHubPage() {
  const rooms = useRooms();
  const devices = useDeviceViews();

  // Live subtext, so the counts never drift from what the detail pages show.
  const activeRoomCount = rooms.filter((r) => r.status === "active").length;
  const liveDevices = devices.filter((d) => !d.retired);
  const needAttention = liveDevices.filter((d) => d.status === "needs-attention").length;

  const META: Record<string, CardMeta> = {
    Rooms: { text: `${rooms.length} rooms · ${activeRoomCount} active` },
    Devices: {
      text: `${liveDevices.length} devices · ${needAttention} need attention`,
      alert: needAttention > 0,
    },
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-page">
      <div className="px-6 py-6 border-b border-divider bg-surface">
        <h1 className="text-2xl font-bold text-ink">Clinic Settings</h1>
        <p className="text-sm text-ink-muted mt-1">Configure templates and clinic-wide preferences</p>
      </div>

      <div className="p-4 space-y-8">
        {SETTINGS_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">{category.name}</h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 300px))" }}>
              {category.modules.map((module) => (
                <ModuleCard key={module.name} module={module} meta={META[module.name]} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
