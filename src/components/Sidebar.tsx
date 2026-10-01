import React from 'react';
import {
  CalendarDays,
  LayoutDashboard,
  Users,
  Settings,
  QrCode,
  CheckCircle2,
  X,
  LogOut,
  Building,
  Radio,
  RotateCcw,
  UserCheck,
  Plus,
  Ticket,
  Megaphone
} from 'lucide-react';
import { ActiveView, EventMetadata, UserAccount } from '../types';
import { CATEGORY_METADATA } from '../mockData';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  currentEvent: EventMetadata | null;
  hostEvents: EventMetadata[];
  currentUser: UserAccount;
  unreadAnnouncementsCount?: number;
  onSelectEvent: (eventId: string) => void;
  onLogout: () => void;
  onResetDemo: () => void;
  onOpenQRScanner: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  currentEvent,
  hostEvents,
  currentUser,
  unreadAnnouncementsCount = 0,
  onSelectEvent,
  onLogout,
  onResetDemo,
  onOpenQRScanner,
}) => {
  const currentRole = currentUser.role;

  const hostNavItems = [
    {
      id: 'my_events' as ActiveView,
      label: 'My Events Hub',
      subtitle: 'Manage Multiple Assemblies',
      icon: CalendarDays,
      badge: `${hostEvents.length}`,
    },
    {
      id: 'admin_dashboard' as ActiveView,
      label: 'Organizer Dashboard',
      subtitle: currentEvent ? currentEvent.title : 'Select an Event',
      icon: LayoutDashboard,
      badge: currentEvent ? currentEvent.status : 'None',
    },
    {
      id: 'host_setup' as ActiveView,
      label: 'Create Public Event',
      subtitle: 'Setup in 10 Categories',
      icon: Plus,
      badge: 'New',
    },
    {
      id: 'edit_host_profile' as ActiveView,
      label: 'Edit Host Profile',
      subtitle: 'Official Organization Details',
      icon: UserCheck,
      badge: currentUser.profileCompleted ? 'Verified' : 'Required',
    },
  ];

  const participantNavItems = [
    {
      id: 'participant_portal' as ActiveView,
      label: 'Discover Events',
      subtitle: 'Browse 10 Event Categories',
      icon: Users,
      badge: 'Public',
    },
    {
      id: 'my_tickets' as ActiveView,
      label: 'My Tickets',
      subtitle: 'Cinema Pass & QR Codes',
      icon: Ticket,
      badge: 'Passes',
    },
    {
      id: 'participant_announcements' as ActiveView,
      label: 'Announcements',
      subtitle: 'Host Broadcasts & Alerts',
      icon: Megaphone,
      badge: unreadAnnouncementsCount > 9 ? '9+' : unreadAnnouncementsCount > 0 ? `${unreadAnnouncementsCount}` : '',
      isRedBadge: unreadAnnouncementsCount > 0,
    },
  ];

  const activeNavItems = currentRole === 'host' ? hostNavItems : participantNavItems;

  const handleSelectNav = (view: ActiveView) => {
    setActiveView(view);
    onClose();
  };

  const activeMeta = currentEvent
    ? CATEGORY_METADATA[currentEvent.category] || CATEGORY_METADATA['Civic & Government']
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Slide-out Sidebar Drawer */}
      <aside className="fixed inset-y-0 left-0 w-84 max-w-[85vw] bg-black border-r border-neutral-800 flex flex-col h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Brand Header with Close Button */}
        <div className="p-5 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shadow-sm font-extrabold text-sm tracking-wider">
                EV
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">
                  Eventora
                </h1>
                <p className="text-[11px] text-neutral-400">Public Events Hub</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 border border-transparent hover:border-neutral-700 transition-colors cursor-pointer"
              title="Close Menu"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Event Context Banner (for Hosts) */}
        {currentRole === 'host' && currentEvent && activeMeta && (
          <div className="p-4 mx-4 mt-4 bg-neutral-950 border border-neutral-800/90 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${activeMeta.badgeClass}`}>
                {currentEvent.category}
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold">
                {currentEvent.status}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white line-clamp-1 leading-relaxed">
              {currentEvent.title}
            </h4>

            {/* Quick Event Switcher */}
            <div className="pt-2 border-t border-neutral-900">
              <label className="text-[10px] text-neutral-500 uppercase font-semibold block mb-1">
                Active Event:
              </label>
              <select
                value={currentEvent.id}
                onChange={(e) => {
                  onSelectEvent(e.target.value);
                  onClose();
                }}
                className="w-full px-2 py-1.5 bg-black border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none cursor-pointer"
              >
                {hostEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    [{e.status}] {e.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
          <div>
            <div className="px-2 mb-2 flex items-center justify-between text-[11px] text-neutral-500 uppercase tracking-wider">
              <span>Navigation</span>
              <span className="text-[10px] text-emerald-400 capitalize">{currentRole} portal</span>
            </div>

            <nav className="space-y-1.5">
              {activeNavItems.map((item) => {
                const isActive = activeView === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 border-neutral-700 text-white shadow-sm'
                        : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg border ${
                          isActive
                            ? 'bg-white text-black border-white'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{item.label}</div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-[140px]">{item.subtitle}</div>
                      </div>
                    </div>

                    {item.badge ? (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold ${
                          (item as any).isRedBadge
                            ? 'bg-rose-500 text-white font-bold shadow-sm'
                            : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Tools for Host */}
          {currentRole === 'host' && (
            <div>
              <div className="px-2 mb-2 text-[11px] text-neutral-500 uppercase tracking-wider">
                Tools
              </div>
              <button
                onClick={() => {
                  onOpenQRScanner();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-neutral-800/80 bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Launch QR Pass Scanner</span>
              </button>
            </div>
          )}

          {/* Reset Demo Data Button */}
          <div>
            <div className="px-2 mb-2 text-[11px] text-neutral-500 uppercase tracking-wider">
              Diagnostics
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all events and registrations back to seed demo data?')) {
                  onResetDemo();
                  onClose();
                }
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Demo Seed Data</span>
            </button>
          </div>
        </div>

        {/* Footer with Authenticated User & Logout */}
        <div className="p-4 border-t border-neutral-800 space-y-3">
          <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-xs text-white">
                {currentUser.avatarSeed || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[11px] text-neutral-400 capitalize">{currentUser.role}</div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full py-2.5 px-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold"
            title="Log Out of Eventora"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Log Out</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
