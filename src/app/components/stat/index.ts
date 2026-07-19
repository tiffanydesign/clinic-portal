// The portal's unified KPI / counter component family.
// Import from here, never from the individual modules.
export { Stat, StatStripGroup } from "./Stat";
export type { StatProps } from "./Stat";
export type {
  Stat as StatConfig,
  StatKind,
  StatVariant,
  StatTone,
  StatIconTone,
  RangeValue,
  Trend,
  TimeRange,
} from "./types";
export { statDisciplineViolation } from "./types";
