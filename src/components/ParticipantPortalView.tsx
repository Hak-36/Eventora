import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  QrCode,
  Users,
  Building,
  ArrowRight,
  Ticket,
  Hourglass,
  Tag,
  AlertCircle
} from 'lucide-react';
import {
  EventMetadata,
  PublicEventCategory,
  EventRegistration,
  UserAccount,
  EventMode
} from '../types';
import { CATEGORY_METADATA } from '../mockData';

interface ParticipantPortalViewProps {
  currentUser: UserAccount;
  publishedEvents: EventMetadata[];
  userTickets: EventRegistration[];
  onOpenEventDetail: (event: EventMetadata) => void;
  onOpenMyTickets: () => void;
  onViewTicket: (ticket: EventRegistration) => void;
}

const CATEGORIES: (PublicEventCategory | 'All')[] = [
  'All',
  'Civic & Government',
  'Health & Wellness',
  'Education & Career',
  'Cultural & Festival',
  'Sports & Fitness',
  'Community & Social Service',
  'Business & Startup',
  'Science & Tech Outreach',
  'Religious & Heritage',
  'Entertainment',
];

export const ParticipantPortalView: React.FC<ParticipantPortalViewProps> = ({
  currentUser,
  publishedEvents,
  userTickets,
  onOpenEventDetail,
  onOpenMyTickets,
  onViewTicket,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PublicEventCategory | 'All'>('All');
  const [selectedMode, setSelectedMode] = useState<EventMode | 'All'>('All');
  const [selectedEntryType, setSelectedEntryType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Map of eventId -> user ticket if registered
  const registeredMap = useMemo(() => {
    const map = new Map<string, EventRegistration>();
    userTickets.forEach((t) => {
      if (t.status !== 'Cancelled') {
        map.set(t.eventId, t);
      }
    });
    return map;
  }, [userTickets]);

  // Filtered public events
  const filteredEvents = useMemo(() => {
    return publishedEvents.filter((evt) => {
      // Category filter
      if (selectedCategory !== 'All' && evt.category !== selectedCategory) {
        return false;
      }

      // Mode filter
      if (selectedMode !== 'All') {
        const mode = evt.mode || 'In-Person';
        if (mode !== selectedMode) return false;
      }

      // Entry type filter
      if (selectedEntryType !== 'All') {
        if (selectedEntryType === 'Free' && !evt.entryType.toLowerCase().includes('free') && evt.priceType === 'Paid') {
          return false;
        }
        if (selectedEntryType === 'Paid' && evt.priceType !== 'Paid') {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          evt.title.toLowerCase().includes(q) ||
          evt.venue.toLowerCase().includes(q) ||
          evt.city.toLowerCase().includes(q) ||
          evt.description.toLowerCase().includes(q) ||
          evt.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [publishedEvents, selectedCategory, selectedMode, selectedEntryType, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 select-none">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">
            Public Gateway // Discover Assemblies
          </span>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white mt-1">
            Discover Verified Public Events
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Browse published town halls, civic forums, health camps, tournaments, and festivals. Register to claim your cinema-style entry pass.
          </p>
        </div>

        {/* My Tickets Button with Counter Badge */}
        <button
          onClick={onOpenMyTickets}
          className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl border border-neutral-800 hover:border-neutral-700 flex items-center gap-2.5 transition-colors cursor-pointer text-xs self-start md:self-auto shadow-sm"
        >
          <Ticket className="w-4 h-4 text-emerald-400" />
          <span>My Tickets</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
            {userTickets.filter((t) => t.status !== 'Cancelled').length}
          </span>
        </button>
      </div>

      {/* 10 Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-white text-black font-bold border-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search & Extra Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event title, location, description, or keyword..."
            className="w-full pl-9 pr-3 py-1.5 bg-black border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Mode */}
          <div className="flex items-center gap-1.5 bg-black border border-neutral-800 rounded-xl px-2.5 py-1">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-200 py-1 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-neutral-900">All Modes</option>
              <option value="In-Person" className="bg-neutral-900">In-Person</option>
              <option value="Online" className="bg-neutral-900">Online</option>
              <option value="Hybrid" className="bg-neutral-900">Hybrid</option>
            </select>
          </div>

          {/* Pricing / Admission */}
          <div className="flex items-center gap-1.5 bg-black border border-neutral-800 rounded-xl px-2.5 py-1">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold">Admission:</span>
            <select
              value={selectedEntryType}
              onChange={(e) => setSelectedEntryType(e.target.value)}
              className="bg-transparent text-xs text-neutral-200 py-1 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-neutral-900">All Admissions</option>
              <option value="Free" className="bg-neutral-900">Free / Open</option>
              <option value="Paid" className="bg-neutral-900">Paid Ticket</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-3xl space-y-3 text-xs">
          <Building className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-xl sm:text-2xl font-bold text-white font-accent tracking-wide">
            No Public Events Match
          </h3>
          <p className="text-neutral-400 max-w-sm mx-auto">
            Try resetting your filters or search keywords to view other upcoming assemblies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const meta = CATEGORY_METADATA[evt.category];
            const userTicket = registeredMap.get(evt.id);
            const isRegistered = Boolean(userTicket);

            const isDeadlinePassed = Boolean(
              evt.registrationDeadline && new Date() > new Date(evt.registrationDeadline)
            );
            const isSoldOut = evt.capacity > 0 && false; // calculated against real tickets
            const mode = evt.mode || 'In-Person';

            return (
              <div
                key={evt.id}
                onClick={() => onOpenEventDetail(evt)}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all cursor-pointer group text-xs"
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.badgeClass}`}
                    >
                      {evt.category}
                    </span>

                    {/* Registration / Status Badge */}
                    {isRegistered ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Registered
                      </span>
                    ) : isSoldOut ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Sold Out
                      </span>
                    ) : isDeadlinePassed ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Registration Closed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-300 text-[10px] border border-neutral-700">
                        {mode}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-relaxed group-hover:text-neutral-200 transition-colors">
                    {evt.title}
                  </h3>

                  <div className="space-y-1 text-neutral-400 pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{new Date(evt.startDateTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="truncate">
                        {mode === 'Online' ? 'Online Video Broadcast' : `${evt.venue}, ${evt.city}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Entry & Action */}
                <div className="space-y-2 pt-3 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">{evt.entryType}</span>
                    <span className="text-emerald-400 font-bold">{evt.capacity} seats</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-neutral-500">
                      {isRegistered ? 'Pass active' : 'Click to inspect & register'}
                    </span>
                    <span className="text-white font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {isRegistered ? 'View Ticket' : 'Learn & Register'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
