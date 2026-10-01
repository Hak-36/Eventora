import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  CheckCheck,
  Search,
  Filter,
  WifiOff,
  Calendar,
  Sparkles,
  ArrowRight,
  Pin,
  AlertTriangle,
} from 'lucide-react';
import { Announcement, EventMetadata, AnnouncementType } from '../types';
import { AnnouncementCard } from './AnnouncementCard';

interface ParticipantAnnouncementsViewProps {
  announcements: Announcement[];
  registeredEvents: EventMetadata[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onViewEvent: (eventId: string) => void;
  onDiscoverEvents: () => void;
  isOffline?: boolean;
  newArrivalIds?: Set<string>;
}

export const ParticipantAnnouncementsView: React.FC<ParticipantAnnouncementsViewProps> = ({
  announcements,
  registeredEvents,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewEvent,
  onDiscoverEvents,
  isOffline = false,
  newArrivalIds = new Set(),
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [visibleLimit, setVisibleLimit] = useState<number>(20);

  // Unread count
  const unreadCount = useMemo(() => {
    return announcements.filter((a) => !a.isRead).length;
  }, [announcements]);

  // Total count
  const totalCount = announcements.length;

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      // Event filter
      if (selectedEventId !== 'all' && ann.eventId !== selectedEventId) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all') {
        if (ann.type !== selectedType) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (ann.title || '').toLowerCase().includes(query);
        const matchesMessage = (ann.message || ann.polishedText || ann.rawText || '').toLowerCase().includes(query);
        const matchesEvent = (ann.eventTitle || '').toLowerCase().includes(query);
        const matchesOrganizer = (ann.organizerName || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesMessage && !matchesEvent && !matchesOrganizer) {
          return false;
        }
      }

      return true;
    });
  }, [announcements, selectedEventId, selectedType, searchQuery]);

  // Sort: Pinned first, then Urgent first, then newest createdAt
  const sortedAnnouncements = useMemo(() => {
    return [...filteredAnnouncements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.type === 'Urgent' && b.type !== 'Urgent') return -1;
      if (a.type !== 'Urgent' && b.type === 'Urgent') return 1;
      const timeA = new Date(a.createdAt || a.timestamp).getTime();
      const timeB = new Date(b.createdAt || b.timestamp).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [filteredAnnouncements]);

  // Paginated items
  const paginatedAnnouncements = useMemo(() => {
    return sortedAnnouncements.slice(0, visibleLimit);
  }, [sortedAnnouncements, visibleLimit]);

  // Group by day helper ("Today", "Yesterday", "Earlier")
  const groupedAnnouncements = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: Announcement[] } = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    for (const ann of paginatedAnnouncements) {
      try {
        const d = new Date(ann.createdAt || ann.timestamp);
        if (isNaN(d.getTime())) {
          groups['Earlier'].push(ann);
          continue;
        }
        const itemDay = new Date(d);
        itemDay.setHours(0, 0, 0, 0);

        if (itemDay.getTime() === today.getTime()) {
          groups['Today'].push(ann);
        } else if (itemDay.getTime() === yesterday.getTime()) {
          groups['Yesterday'].push(ann);
        } else {
          groups['Earlier'].push(ann);
        }
      } catch {
        groups['Earlier'].push(ann);
      }
    }

    return groups;
  }, [paginatedAnnouncements]);

  const hasAnyRegistrations = registeredEvents.length > 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 select-none">
      {/* Offline Notice */}
      {isOffline && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-300">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Offline: showing saved announcements</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4 text-emerald-400" />
            <span>Participant Broadcasts // Live Updates</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Announcements
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                {totalCount} total
              </span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm animate-pulse">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Official host alerts, venue instructions, and schedule updates for your registered assemblies.
          </p>
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer flex items-center gap-2 self-start md:self-auto shrink-0 shadow-sm"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements by title, keyword, host or event name..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Chips: Registered Events (Horizontal scroll) */}
        {hasAnyRegistrations && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
              Filter By Event:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedEventId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedEventId === 'all'
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                }`}
              >
                All Events
              </button>

              {registeredEvents.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border truncate max-w-[220px] ${
                    selectedEventId === evt.id
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                  }`}
                  title={evt.title}
                >
                  {evt.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type Filter Chips: All / Urgent / Schedule change / General / Reminder */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
            Filter By Priority / Type:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {['all', 'Urgent', 'Schedule change', 'General', 'Reminder'].map((typeOption) => {
              const label =
                typeOption === 'all'
                  ? 'All Types'
                  : typeOption === 'Schedule change'
                  ? 'Schedule Change'
                  : typeOption;
              const isSelected = selectedType === typeOption;

              return (
                <button
                  key={typeOption}
                  onClick={() => setSelectedType(typeOption)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                      : 'bg-black text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Announcements Feed */}
      {!hasAnyRegistrations ? (
        /* Empty State 1: No Registrations */
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-3xl space-y-4 text-xs">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-accent tracking-wide">
              Register for an event to get updates
            </h3>
            <p className="text-neutral-400 max-w-md mx-auto">
              You haven't claimed passes to any public gatherings yet. Discover town halls, cultural festivals, and summits to unlock live dispatch alerts.
            </p>
          </div>
          <button
            onClick={onDiscoverEvents}
            className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-lg"
          >
            <span>Discover Events</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      ) : sortedAnnouncements.length === 0 ? (
        /* Empty State 2: No Announcements yet */
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-3xl space-y-4 text-xs">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-accent tracking-wide">
              No announcements yet. We'll notify you here
            </h3>
            <p className="text-neutral-400 max-w-md mx-auto">
              Your registered hosts have not published any dispatches matching this filter. New updates will automatically appear live right here.
            </p>
          </div>
          {(selectedEventId !== 'all' || selectedType !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedEventId('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Announcement Feed grouped by day */
        <div className="space-y-6">
          {(['Today', 'Yesterday', 'Earlier'] as const).map((dayKey) => {
            const items = groupedAnnouncements[dayKey];
            if (!items || items.length === 0) return null;

            return (
              <div key={dayKey} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {dayKey}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    ({items.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map((ann) => (
                    <AnnouncementCard
                      key={ann.id}
                      announcement={ann}
                      onMarkAsRead={onMarkAsRead}
                      onViewEvent={onViewEvent}
                      isNewArrival={newArrivalIds.has(ann.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Load More Button if over 20 items */}
          {sortedAnnouncements.length > visibleLimit && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisibleLimit((prev) => prev + 20)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-xl border border-neutral-800 hover:border-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Load more (showing {paginatedAnnouncements.length} of {sortedAnnouncements.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
