// Orchestrator for the Clinician/Nurse "My Schedule" surface: left rail
// (mini calendar + search + layers) beside the week/day/month grid, with a
// top bar (Today, paging, date title + picker, Day/Week[/Month]),
// swipe-to-page, and a responsive rail that collapses to an overlay on
// narrow/portrait screens. Month is Nurse-only (see VIEW_OPTIONS below) —
// Clinician's toggle is unchanged.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { addDays, addMonths, endOfWeek, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, PanelLeftOpen, X, FileText, PanelRightOpen } from "lucide-react";
import { ANCHOR_DATE, NOW_MINUTES, Appt } from "./scheduleData";
import {
  ScheduleRole, ScheduleTarget, buildMyWeek, apptsForDate, layerCounts, defaultLayers, LayerState, weekStartOf, WeekDay, apptVisible,
} from "./myScheduleData";
import { DAYS, WeekSchedule } from "../availability/availabilityData";
import { ScheduleLeftRail, LayerKey } from "./ScheduleLeftRail";
import { MiniCalendar } from "./MiniCalendar";
import { MyScheduleGrid } from "./MyScheduleGrid";
import { MyScheduleMonthGrid } from "./MyScheduleMonthGrid";
import { useAvailabilityStore } from "../availability/availabilityStore";

const TODAY = ANCHOR_DATE;
type ScheduleView = "day" | "week" | "month";

// Used when viewing someone else's schedule (Staff Management): the
// availability store only ever models the signed-in self, so a different
// staff member gets a fully "open" schedule (no non-working shading, no
// blocked time, no leave wash) rather than showing the wrong person's data.
const NEUTRAL_SCHEDULE: WeekSchedule = DAYS.reduce((acc, day) => {
  acc[day] = { active: true, slots: [{ start: "12:00am", end: "11:59pm" }] };
  return acc;
}, {} as WeekSchedule);

function useWideScreen(threshold = 1100) {
  const [wide, setWide] = useState(typeof window !== "undefined" ? window.innerWidth >= threshold : true);
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= threshold);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [threshold]);
  return wide;
}

export function MyScheduleView({
  role,
  onOpenAppt,
  target,
  possessive = true,
  availabilityAvailable = true,
}: {
  role: ScheduleRole;
  onOpenAppt: (id: string) => void;
  // Staff Management passes the specific staff member being viewed; the
  // Calendar's own "My Schedule" surface omits it and gets the signed-in self.
  target?: ScheduleTarget;
  possessive?: boolean;
  availabilityAvailable?: boolean;
}) {
  const navigate = useNavigate();
  const wide = useWideScreen();
  const store = useAvailabilityStore();
  const savedSchedule = availabilityAvailable ? store.savedSchedule : NEUTRAL_SCHEDULE;
  const blockedTime = availabilityAvailable ? store.blockedTime : [];
  const leaves = availabilityAvailable ? store.leaves : [];

  const viewOptions: readonly ScheduleView[] = role === "Nurse" ? (["day", "week", "month"] as const) : (["day", "week"] as const);
  const [view, setView] = useState<ScheduleView>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(TODAY);
  const [layers, setLayers] = useState<LayerState>(defaultLayers);
  const [search, setSearch] = useState("");
  const [railOpen, setRailOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quick, setQuick] = useState<Appt | null>(null);

  const weekStart = weekStartOf(selectedDate);
  const weekDaysAll = useMemo(() => buildMyWeek(role, weekStart, target), [role, weekStart, target]);
  const gridDays: WeekDay[] = useMemo(() => {
    if (view === "week") return weekDaysAll;
    const day = weekDaysAll.find((d) => isSameDay(d.date, selectedDate)) ?? { date: selectedDate, isToday: isSameDay(selectedDate, TODAY), appts: [] };
    return [day];
  }, [view, weekDaysAll, selectedDate]);

  const counts = useMemo(() => layerCounts(weekDaysAll), [weekDaysAll]);
  const totalVisible = gridDays.flatMap((d) => d.appts).filter((a) => apptVisible(a, layers)).length;
  const hasApptsOn = (d: Date) => apptsForDate(role, d, target).length > 0;
  const countFor = (d: Date) => apptsForDate(role, d, target).length;

  const page = (dir: 1 | -1) => {
    if (view === "month") { setSelectedDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1))); return; }
    setSelectedDate((d) => addDays(d, dir * (view === "week" ? 7 : 1)));
  };
  const goToday = () => setSelectedDate(TODAY);
  const selectMonthDay = (d: Date) => { setSelectedDate(d); setView("day"); };

  const toggleLayer = (key: LayerKey) => setLayers((p) => {
    if (key === "mine") return { ...p, mine: !p.mine };
    if (key === "video") return { ...p, video: !p.video };
    if (key === "availability") return { ...p, availability: !p.availability };
    return { ...p, types: { ...p.types, [key]: !p.types[key] } };
  });

  const openAppt = (a: Appt) => onOpenAppt(a.id.replace(/-w\d+-\d+$/, ""));

  const title = view === "month"
    ? format(selectedDate, "MMMM yyyy")
    : view === "week"
    ? `${format(weekStart, "MMM d")} – ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), "d, yyyy")}`
    : format(selectedDate, "EEE, MMM d, yyyy");

  // swipe to page
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) page(dx < 0 ? 1 : -1);
    touch.current = null;
  };

  const rail = (
    <ScheduleLeftRail
      role={role}
      selectedDate={selectedDate}
      today={TODAY}
      onSelectDate={(d) => { setSelectedDate(d); setRailOpen(false); }}
      hasApptsOn={hasApptsOn}
      search={search}
      onSearch={setSearch}
      layers={layers}
      onToggleLayer={toggleLayer}
      counts={counts}
      possessive={possessive}
      showAvailabilityToggle={availabilityAvailable}
    />
  );

  return (
    <div className="h-full flex min-h-0 bg-surface-page">
      {/* left rail — inline column on wide screens */}
      {wide && <div className="w-[280px] shrink-0 border-r border-divider bg-surface">{rail}</div>}

      {/* right main */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* top bar */}
        <div className="px-5 py-3 border-b border-divider bg-surface shrink-0 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {!wide && (
              <button onClick={() => setRailOpen(true)} aria-label="Open filters" className="p-2 text-ink-muted hover:bg-surface-hover rounded-card">
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
            <button onClick={goToday} className="px-3 py-1.5 text-data font-bold text-ink-soft border border-divider rounded-card hover:bg-surface-hover transition-colors">Today</button>
            <div className="flex items-center">
              <button onClick={() => page(-1)} aria-label="Previous" className="p-1.5 text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-control transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => page(1)} aria-label="Next" className="p-1.5 text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-control transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="relative">
              <button onClick={() => setPickerOpen((o) => !o)} className="text-section font-bold text-ink hover:text-ink-soft px-2 py-1 rounded-control hover:bg-surface-hover transition-colors">
                {title}
              </button>
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                  <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-surface border border-divider rounded-card shadow-xl p-3">
                    <MiniCalendar selectedDate={selectedDate} today={TODAY} onSelectDate={(d) => { setSelectedDate(d); setPickerOpen(false); }} hasApptsOn={hasApptsOn} />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="inline-flex bg-surface-hover rounded-card p-0.5 border border-divider">
            {viewOptions.map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-label font-bold rounded-control capitalize transition-colors ${view === v ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}>{v}</button>
            ))}
          </div>
        </div>

        {/* grid */}
        <div className="flex-1 min-h-0 pl-0 pr-4 py-4 relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {view === "month" ? (
            <MyScheduleMonthGrid
              viewMonth={startOfMonth(selectedDate)}
              selectedDate={selectedDate}
              today={TODAY}
              countFor={countFor}
              onSelectDay={selectMonthDay}
            />
          ) : (
            <>
              <MyScheduleGrid
                role={role}
                view={view}
                weekDays={gridDays}
                nowMinutes={NOW_MINUTES}
                layers={layers}
                schedule={savedSchedule}
                blockedTime={blockedTime}
                leaves={leaves}
                search={search}
                onApptClick={openAppt}
                onLongPress={setQuick}
              />
              {totalVisible === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-surface/80 rounded-card px-6 py-4">
                    <p className="text-data font-bold text-ink-muted">No appointments this {view}</p>
                    <p className="text-label text-ink-muted mt-1">{search ? "No patients match your search." : "Nothing scheduled in this range."}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* narrow-screen rail overlay */}
      {!wide && railOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-surface-sunken/40 backdrop-blur-sm" onClick={() => setRailOpen(false)} />
          <div className="relative w-[300px] max-w-[85vw] bg-surface shadow-2xl animate-in slide-in-from-left-8 duration-200 motion-reduce:animate-none">
            <div className="flex justify-end p-2 border-b border-divider">
              <button onClick={() => setRailOpen(false)} aria-label="Close" className="p-2 text-ink-muted hover:bg-surface-hover rounded-full"><X className="w-5 h-5" /></button>
            </div>
            {rail}
          </div>
        </div>
      )}

      {/* long-press quick menu */}
      {quick && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-surface-sunken/40 backdrop-blur-sm p-4" onClick={() => setQuick(null)}>
          <div className="bg-surface rounded-card shadow-2xl w-full max-w-xs overflow-hidden animate-in fade-in zoom-in-95 motion-reduce:animate-none" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-divider">
              <div className="text-data font-bold text-ink">{quick.patient.name}</div>
              <div className="text-label text-ink-muted">{quick.timeLabel}</div>
            </div>
            <button onClick={() => { const a = quick; setQuick(null); openAppt(a); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-data font-semibold text-ink-soft hover:bg-surface-hover transition-colors">
              <PanelRightOpen className="w-4 h-4 text-ink-muted" /> View in drawer
            </button>
            <button onClick={() => { const r = quick.patient.route; setQuick(null); navigate(r); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-data font-semibold text-ink-soft hover:bg-surface-hover transition-colors border-t border-divider">
              <FileText className="w-4 h-4 text-ink-muted" /> Open patient record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
