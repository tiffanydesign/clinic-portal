import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Bell, ChevronRight, ChevronDown, Search,
  LayoutDashboard, Calendar, Users, UserCog, Settings, CreditCard,
  MessageSquare, Clock, ClipboardList, User, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import epLogo from "../../assets/EPlogo.png";
import { SubmitFeedbackModal } from "./SubmitFeedbackModal";
import { GlobalSearch } from "./GlobalSearch";
import { GlobalSearchOverlay } from "./GlobalSearchOverlay";
import { DemoControlsPill } from "./DemoControlsPill";
import { FloatingPopover } from "./glass/FloatingPopover";
import { IS_DEMO_BUILD } from "../config/buildMode";
import { useUnreadNotificationCount } from "../pages/app/notificationsSelectors";
import { ROLE_GREETING } from "../pages/app/dashboard/dashboardData";

const NAV_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/calendar": Calendar,
  "/patients": Users,
  "/staff": UserCog,
  "/clinic-settings": Settings,
  "/billing": CreditCard,
  "/feedback": MessageSquare,
  "/timesheet": Clock,
  "/notifications": Bell,
  "/approval": ClipboardList,
  "/profile": User,
};

const NAV_ITEMS = {
  Admin: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendar", path: "/calendar", children: [
      { label: "Schedule", path: "/calendar/schedule" },
      { label: "Availability", path: "/calendar/availability" }
    ]},
    { label: "Patients", path: "/patients" },
    { label: "Staff", path: "/staff" },
    { label: "Clinic Settings", path: "/clinic-settings" },
    { label: "Billing", path: "/billing" },
    { label: "Feedback", path: "/feedback" },
    { label: "Timesheet", path: "/timesheet" },
    { label: "Notifications", path: "/notifications" },
    { label: "Approval", path: "/approval" },
    { label: "Profile", path: "/profile" }
  ],
  Reception: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendar", path: "/calendar", children: [
      { label: "Schedule", path: "/calendar/schedule" },
      { label: "Availability", path: "/calendar/availability" }
    ]},
    { label: "Patients", path: "/patients" },
    { label: "Billing", path: "/billing" },
    { label: "Notifications", path: "/notifications" },
    { label: "Profile", path: "/profile" }
  ],
  Nurse: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendar", path: "/calendar", children: [
      { label: "Schedule", path: "/calendar/schedule" },
      { label: "My Availability", path: "/calendar/my-availability" },
      { label: "Availability", path: "/calendar/availability" }
    ]},
    { label: "Patients", path: "/patients" },
    { label: "Notifications", path: "/notifications" },
    { label: "Profile", path: "/profile" }
  ],
  Clinician: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendar", path: "/calendar", children: [
      { label: "Schedule", path: "/calendar/schedule" },
      { label: "My Availability", path: "/calendar/my-availability" },
      { label: "Availability", path: "/calendar/availability" }
    ]},
    { label: "Patients", path: "/patients" },
    { label: "Notifications", path: "/notifications" },
    { label: "My Requests", path: "/approval" },
    { label: "Profile", path: "/profile" }
  ]
};

const LONG_PRESS_MS = 450;

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    role, isFeedbackModalOpen,
    sidebarCollapsed, setSidebarCollapsed,
  } = useAppContext();
  const unreadNotifications = useUnreadNotificationCount(role);
  const location = useLocation();
  const navigate = useNavigate();
  // Profile gets its own richer footer block below (avatar + name + role) —
  // it isn't rendered twice as a plain nav row too.
  const mainNav = NAV_ITEMS[role].filter((item) => item.path !== "/profile");

  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [calendarFlyoutOpen, setCalendarFlyoutOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const calendarAnchorRef = useRef<HTMLDivElement>(null);

  // Manual toggle wins forever once used; only the orientation default
  // (below) is allowed to move the rail before that happens.
  const userToggledRef = useRef(false);

  useEffect(() => {
    if (location.pathname.startsWith('/calendar')) {
      setCalendarExpanded(true);
    }
  }, [location.pathname]);

  // Flyout is a transient overlay, not a persistent state — drop it on
  // navigation or whenever the rail's expanded/collapsed state changes.
  useEffect(() => {
    setCalendarFlyoutOpen(false);
  }, [location.pathname, sidebarCollapsed]);

  // iPad portrait defaults to the collapsed rail; landscape defaults to
  // expanded. Only applies before the user has manually toggled the rail.
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const applyDefault = () => {
      if (userToggledRef.current) return;
      setSidebarCollapsed(mq.matches);
    };
    applyDefault();
    mq.addEventListener("change", applyDefault);
    return () => mq.removeEventListener("change", applyDefault);
  }, [setSidebarCollapsed]);

  const toggleSidebar = () => {
    userToggledRef.current = true;
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Collapsed-rail label reveal: long-press instead of hover (no reliable
  // hover on iPad). One shared bubble, portalled so it escapes the rail.
  const [pressedLabel, setPressedLabel] = useState<{ label: string; rect: DOMRect } | null>(null);
  const pressTimerRef = useRef<number | null>(null);

  const clearLongPress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setPressedLabel(null);
  };

  useEffect(() => () => {
    if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current);
  }, []);

  const longPressHandlers = (label: string) => {
    if (!sidebarCollapsed) return {};
    return {
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pressTimerRef.current = window.setTimeout(() => setPressedLabel({ label, rect }), LONG_PRESS_MS);
      },
      onPointerUp: clearLongPress,
      onPointerLeave: clearLongPress,
      onPointerCancel: clearLongPress,
    };
  };

  return (
    <div className="flex h-screen w-screen min-w-[1024px] bg-surface text-ink font-sans overflow-hidden">
      <div className={`${sidebarCollapsed ? "w-16" : "w-60"} bg-surface border-r border-divider flex flex-col shrink-0 transition-[width] duration-200 ease-out`}>
        {/* Brand + collapse toggle. Collapsed: the logo mark doubles as the
            expand affordance, so a 64px rail isn't split between mark + button. */}
        <div className={`h-16 flex items-center border-b border-divider shrink-0 ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          {sidebarCollapsed ? (
            <button
              onClick={toggleSidebar}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="group p-1.5 rounded-card hover:bg-surface-hover transition-colors flex items-center justify-center"
            >
              <img src={epLogo} alt="Phenome" className="h-7 w-auto group-hover:hidden" />
              <PanelLeftOpen className="w-5 h-5 text-ink-muted hidden group-hover:block" />
            </button>
          ) : (
            <>
              <span className="flex items-center gap-2 min-w-0">
                <img src={epLogo} alt="Phenome" className="h-6 w-auto shrink-0" />
                <span className="font-bold text-sm text-ink tracking-tight truncate">Phenome Portal</span>
              </span>
              <button
                onClick={toggleSidebar}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="w-11 h-11 flex items-center justify-center text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-card transition-colors shrink-0"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Search — inline field expanded, icon-to-overlay collapsed */}
        <div className={`shrink-0 border-b border-divider ${sidebarCollapsed ? "py-2 flex justify-center" : "px-3 py-3"}`}>
          {sidebarCollapsed ? (
            <button
              onClick={() => setSearchOverlayOpen(true)}
              title="Search"
              aria-label="Search"
              {...longPressHandlers("Search")}
              className="w-12 h-12 flex items-center justify-center text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-card transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          ) : (
            <GlobalSearch />
          )}
        </div>

        {/* Primary navigation */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {mainNav.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = NAV_ICON[item.path] ?? LayoutDashboard;
            const isNotifications = item.path === "/notifications";
            const showBadge = isNotifications && unreadNotifications > 0;

            if (item.children) {
              const isInlineExpanded = calendarExpanded && !sidebarCollapsed;
              return (
                <div key={item.label} className="flex flex-col">
                  <div
                    ref={sidebarCollapsed ? calendarAnchorRef : undefined}
                    onClick={() => {
                      if (sidebarCollapsed) { setCalendarFlyoutOpen(v => !v); return; }
                      if (!isInlineExpanded) navigate(item.children[0].path);
                      setCalendarExpanded(!isInlineExpanded);
                    }}
                    {...longPressHandlers(item.label)}
                    className={`w-full flex items-center rounded-card cursor-pointer transition-colors ${sidebarCollapsed ? "justify-center h-12" : "justify-between px-3 min-h-11 py-2.5"} text-sm font-medium ${isActive ? "bg-surface-hover text-ink" : "text-ink-soft hover:bg-surface-page"}`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!sidebarCollapsed && (isInlineExpanded ? <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" /> : <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />)}
                  </div>

                  {isInlineExpanded && (
                    <div className="flex flex-col bg-surface-page/60 rounded-card py-1 mt-0.5">
                      {item.children.map(child => {
                        const isChildActive = location.pathname.startsWith(child.path);
                        return (
                          <Link
                            key={child.label}
                            to={child.path}
                            className={`flex items-center pl-4 pr-3 min-h-11 py-2.5 rounded-card text-sm font-medium transition-colors ${isChildActive ? "bg-surface-sunken text-ink" : "text-ink-muted hover:bg-surface-hover hover:text-ink-soft"}`}
                          >
                            <span className="w-1 h-1 rounded-full bg-ink-muted mr-2 shrink-0"></span>
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {sidebarCollapsed && calendarFlyoutOpen && (
                    <FloatingPopover anchorRef={calendarAnchorRef} onClose={() => setCalendarFlyoutOpen(false)} align="left">
                      <div className="w-52 bg-surface border border-divider rounded-card shadow-lg py-1.5">
                        <div className="px-3 pb-1.5 text-label font-bold text-ink-muted uppercase tracking-wider">{item.label}</div>
                        {item.children.map(child => {
                          const isChildActive = location.pathname.startsWith(child.path);
                          return (
                            <Link
                              key={child.label}
                              to={child.path}
                              onClick={() => setCalendarFlyoutOpen(false)}
                              className={`flex items-center min-h-11 py-2.5 px-3 text-sm font-medium transition-colors ${isChildActive ? "bg-surface-hover text-ink" : "text-ink-soft hover:bg-surface-page"}`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </FloatingPopover>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                {...longPressHandlers(item.label)}
                className={`w-full flex items-center gap-3 rounded-card transition-colors ${sidebarCollapsed ? "justify-center h-12" : "px-3 min-h-11 py-2.5"} text-sm font-medium ${isActive ? "bg-surface-hover text-ink" : "text-ink-soft hover:bg-surface-page"}`}
              >
                <span className="relative shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                  {showBadge && sidebarCollapsed && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-surface-sunken rounded-full border-2 border-white" />
                  )}
                </span>
                {!sidebarCollapsed && <span className="truncate flex-1">{item.label}</span>}
                {!sidebarCollapsed && showBadge && (
                  <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-surface-sunken text-ink-soft text-label font-bold flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Profile — pinned footer, outside the scrollable nav. Logout and
            Help both live on the Profile page now (Log Out action, and the
            "Contact Administrator" button which already opens the same
            feedback modal Help used to). */}
        <div className="shrink-0 border-t border-divider">
          <Link
            to="/profile"
            title="Profile"
            {...longPressHandlers("Profile")}
            className={`w-full flex items-center gap-3 hover:bg-surface-page transition-colors ${sidebarCollapsed ? "justify-center h-14" : "px-4 h-16"}`}
          >
            <div className="w-9 h-9 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-xs font-bold text-ink-soft shrink-0">
              {role.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-semibold text-ink truncate">{ROLE_GREETING[role]}</div>
                <div className="text-xs text-ink-muted truncate">{role}</div>
              </div>
            )}
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto bg-surface-page relative">
          {children}
        </div>
      </div>

      {searchOverlayOpen && <GlobalSearchOverlay onClose={() => setSearchOverlayOpen(false)} />}
      {isFeedbackModalOpen && <SubmitFeedbackModal />}
      {IS_DEMO_BUILD && <DemoControlsPill />}

      {pressedLabel && createPortal(
        <div
          className="fixed z-[110] px-2.5 py-1.5 rounded-card bg-ink text-white text-xs font-medium shadow-lg pointer-events-none whitespace-nowrap"
          style={{ top: pressedLabel.rect.top + pressedLabel.rect.height / 2, left: pressedLabel.rect.right + 10, transform: "translateY(-50%)" }}
        >
          {pressedLabel.label}
        </div>,
        document.body
      )}
    </div>
  );
}
