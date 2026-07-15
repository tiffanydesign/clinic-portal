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
      <div className="relative border border-gray-200 rounded-xl p-5 bg-gray-50 opacity-60 cursor-not-allowed">
        <span className="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-500">
          {module.badge}
        </span>
        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-500">{module.name}</h3>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{module.description}</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate(module.route!)}
      className="text-left border border-gray-300 rounded-xl p-5 bg-white shadow-sm hover:border-slate-400 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        {module.status && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
            {module.status}
          </span>
        )}
      </div>
      <h3 className="text-sm font-bold text-gray-800">{module.name}</h3>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{module.description}</p>
      {meta && (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mt-3 tabular-nums">
          {meta.alert && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden />}
          {meta.text}
        </p>
      )}
      {module.lastEdited && <p className="text-[11px] text-gray-400 mt-3">{module.lastEdited}</p>}
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
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-800">Clinic Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure templates and clinic-wide preferences</p>
      </div>

      <div className="p-8 space-y-8 max-w-5xl">
        {SETTINGS_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{category.name}</h2>
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
