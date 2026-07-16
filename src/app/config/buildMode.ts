// Distinguishes the always-on prototype/demo build (Site Map, Demo Role
// switcher) from a hypothetical production build that ships without any
// reviewer-only affordances. Defaults to demo (current behavior for `npm
// run dev` / `npm run build`); a real production build sets
// VITE_DEMO_BUILD=false at build time to drop those traces from the UI.
// Routing/role guards are untouched either way — this only gates the two
// demo-only UI entry points (see DemoControlsPill).
export const IS_DEMO_BUILD = import.meta.env.VITE_DEMO_BUILD !== "false";
