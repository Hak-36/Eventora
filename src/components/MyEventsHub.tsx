import React, { useState, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  XCircle,
  ExternalLink,
  Radio,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { EventMetadata, EventStatus, Participant, UserAccount } from '../types';
import { CATEGORY_METADATA } from '../mockData';

interface MyEventsHubProps {
  currentUser: UserAccount;
  events: EventMetadata[];
  participants: Participant[];
  onOpenDashboard: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onCreateEvent: () => void;
  onDuplicateEvent: (eventId: string) => void;
  onCancelEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onUpdateStatus: (eventId: string, newStatus: EventStatus) => void;
}

export const MyEventsHub: React.FC<MyEventsHubProps> = ({
  currentUser,
  events,
  participants,
  onOpenDashboard,
  onEditEvent,
  onCreateEvent,
  onDuplicateEvent,
  onCancelEvent,
  onDeleteEvent,
  onUpdateStatus,
}) => {
  // Search, filter & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | EventStatus>('All');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'updated'>('updated');

  // Confirmation Modals state
  const [eventToCancel, setEventToCancel] = useState<EventMetadata | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventMetadata | null>(null);

  // Compute summary stats
  const stats = useMemo(() => {
    const total = events.length;
    const liveNow = events.filter((e) => e.status === 'Live').length;
    const upcoming = events.filter((e) => e.status === 'Published').length;
    const completed = events.filter((e) => e.status === 'Completed').length;
    
    // Total registrations across host's events
    const hostEventIds = new Set(events.map((e) => e.id));
    const totalRegistrations = participants.filter((p) => hostEventIds.has(p.eventId)).length;

    return { total, liveNow, upcoming, completed, totalRegistrations };
  }, [events, participants]);

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const matchesSearch =
          evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
          evt.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          evt.category.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (statusFilter === 'All') return true;
        return evt.status === statusFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') {
          return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
        }
        if (sortBy === 'date_desc') {
          return new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime();
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [events, searchQuery, statusFilter, sortBy]);

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'Live':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live Now
          </span>
        );
      case 'Published':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Published
          </span>
        );
      case 'Draft':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-800 text-neutral-400 border border-neutral-700">
            Draft
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getEventRegistrations = (eventId: string) => {
    const list = participants.filter((p) => p.eventId === eventId);
    const checkedIn = list.filter((p) => p.isCheckedIn).length;
    return { count: list.length, checkedIn };
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider mb-1">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>Organizer Command // My Events Hub</span>
          </div>
          <div className="text-xl sm:text-2xl font-accent font-bold text-emerald-400 mb-0.5">
            Welcome back, {currentUser.name}!
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
            {currentUser.hostProfile?.organization || currentUser.name}'s Events
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage your multiple public assemblies, track attendee capacity, dispatch announcements, and update event states.
          </p>
        </div>

        <button
          onClick={onCreateEvent}
          className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-lg shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Event</span>
        </button>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider block">Total Events</span>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          <span className="text-[10px] text-neutral-500 mt-1 block">In your organizer registry</span>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider block">Live Now</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.liveNow}</div>
          <span className="text-[10px] text-emerald-500/80 mt-1 block">Active on-site broadcast</span>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <span className="text-[11px] text-blue-400 uppercase font-bold tracking-wider block">Upcoming (Published)</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">{stats.upcoming}</div>
          <span className="text-[10px] text-neutral-500 mt-1 block">Open for public RSVP</span>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <span className="text-[11px] text-purple-400 uppercase font-bold tracking-wider block">Completed</span>
          <div className="text-2xl font-bold text-purple-300 mt-1">{stats.completed}</div>
          <span className="text-[10px] text-neutral-500 mt-1 block">Concluded assemblies</span>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl col-span-2 sm:col-span-1">
          <span className="text-[11px] text-amber-400 uppercase font-bold tracking-wider block">Total Registrations</span>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.totalRegistrations}</div>
          <span className="text-[10px] text-neutral-500 mt-1 block">Across all hosted events</span>
        </div>
      </div>

      {/* Filter, Search & Sort Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, venue, city or category..."
            className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-black border border-neutral-800 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-200 py-1 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-neutral-900">All Statuses ({events.length})</option>
              <option value="Live" className="bg-neutral-900">Live ({stats.liveNow})</option>
              <option value="Published" className="bg-neutral-900">Published ({stats.upcoming})</option>
              <option value="Draft" className="bg-neutral-900">Drafts</option>
              <option value="Completed" className="bg-neutral-900">Completed ({stats.completed})</option>
              <option value="Cancelled" className="bg-neutral-900">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-black border border-neutral-800 rounded-xl px-2.5 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-200 py-1 focus:outline-none cursor-pointer"
            >
              <option value="updated" className="bg-neutral-900">Recently Updated</option>
              <option value="date_asc" className="bg-neutral-900">Date (Earliest First)</option>
              <option value="date_desc" className="bg-neutral-900">Date (Latest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-3xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-accent tracking-wide">
              {events.length === 0 ? 'No Events Created Yet' : 'No Events Match Your Filters'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              {events.length === 0
                ? 'Welcome to Eventora! Create your first public assembly across civic, cultural, athletic, or wellness categories.'
                : 'Try adjusting your search query or status filter to see other events.'}
            </p>
          </div>
          {events.length === 0 && (
            <button
              onClick={onCreateEvent}
              className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Event</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const meta = CATEGORY_METADATA[evt.category];
            const { count: regCount, checkedIn } = getEventRegistrations(evt.id);
            const fillPct = evt.capacity > 0 ? Math.min(100, Math.round((regCount / evt.capacity) * 100)) : 0;

            return (
              <div
                key={evt.id}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all"
              >
                {/* Card Top: Badges & Title */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${meta.badgeClass}`}
                    >
                      {evt.category}
                    </span>
                    {getStatusBadge(evt.status)}
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-relaxed">
                    {evt.title}
                  </h3>

                  <div className="space-y-1 text-xs text-neutral-400 pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="truncate">{formatDate(evt.startDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="truncate">
                        {evt.venue}, {evt.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Capacity */}
                <div className="space-y-2 pt-3 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">
                      Registrations: <strong className="text-white">{regCount}</strong> / {evt.capacity}
                    </span>
                    <span className="text-neutral-400 font-bold">{fillPct}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        fillPct >= 90 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>{checkedIn} checked in</span>
                    <span>Entry: {evt.entryType}</span>
                  </div>
                </div>

                {/* Quick Status Dropdown & Primary Action */}
                <div className="space-y-2.5 pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] text-neutral-500 uppercase font-semibold">
                      State:
                    </label>
                    <select
                      value={evt.status}
                      onChange={(e) => onUpdateStatus(evt.id, e.target.value as EventStatus)}
                      className="px-2 py-1 bg-black border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none cursor-pointer"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Live">Live</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Primary & Secondary Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onOpenDashboard(evt.id)}
                      className="py-2 px-3 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Dashboard</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditEvent(evt.id)}
                      className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                  </div>

                  {/* Utility Card Actions: Duplicate, Cancel, Delete */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400 border-t border-neutral-800/40">
                    <button
                      onClick={() => onDuplicateEvent(evt.id)}
                      className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      title="Duplicate this event as a Draft copy"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Duplicate</span>
                    </button>

                    {evt.status !== 'Cancelled' && (
                      <button
                        onClick={() => setEventToCancel(evt)}
                        className="hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Cancel this event"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    )}

                    <button
                      onClick={() => setEventToDelete(evt)}
                      className="hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Permanently delete event and its registrations"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog: Cancel Event */}
      {eventToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Cancel Public Event?</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to mark <strong className="text-white">"{eventToCancel.title}"</strong> as Cancelled?
              Attendees will see the cancelled status on their digital passes.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setEventToCancel(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Keep Event Active
              </button>
              <button
                onClick={() => {
                  onCancelEvent(eventToCancel.id);
                  setEventToCancel(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase rounded-xl text-xs cursor-pointer shadow-md"
              >
                Yes, Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Event */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Permanently Delete Event?</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{eventToDelete.title}"</strong>?
              This action is permanent and will remove all attendee registrations, announcements, agendas, and feedback for this event.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteEvent(eventToDelete.id);
                  setEventToDelete(null);
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase rounded-xl text-xs cursor-pointer shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
