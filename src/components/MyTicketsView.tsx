import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  MapPin,
  Clock,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  XCircle,
  AlertTriangle,
  QrCode,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Hourglass,
  Tag
} from 'lucide-react';
import { EventMetadata, EventRegistration, UserAccount } from '../types';
import { CATEGORY_METADATA } from '../mockData';

interface MyTicketsViewProps {
  currentUser: UserAccount;
  tickets: EventRegistration[];
  allEvents: EventMetadata[];
  onViewTicket: (ticket: EventRegistration) => void;
  onEditDetails: (ticket: EventRegistration) => void;
  onCancelRegistration: (ticketId: string) => Promise<void>;
  onOpenEventDetail: (eventId: string) => void;
  onDiscoverEvents: () => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  currentUser,
  tickets,
  allEvents,
  onViewTicket,
  onEditDetails,
  onCancelRegistration,
  onOpenEventDetail,
  onDiscoverEvents,
}) => {
  const [tab, setTab] = useState<'Upcoming' | 'Past' | 'All'>('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketToCancel, setTicketToCancel] = useState<EventRegistration | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Helper to find matching event
  const getEventForTicket = (eventId: string): EventMetadata | undefined => {
    return allEvents.find((e) => e.id === eventId);
  };

  // Helper for event countdown badge
  const getCountdown = (startDateTime: string) => {
    try {
      const now = Date.now();
      const eventTime = new Date(startDateTime).getTime();
      const diffMs = eventTime - now;

      if (diffMs < 0) {
        return { text: 'Event Concluded', isPast: true };
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffDays === 0) {
        return { text: diffHours <= 1 ? 'Starts shortly!' : `Starts in ${diffHours}h`, isPast: false };
      }
      if (diffDays === 1) {
        return { text: 'Starts tomorrow', isPast: false };
      }
      return { text: `Starts in ${diffDays} days`, isPast: false };
    } catch {
      return { text: 'Scheduled', isPast: false };
    }
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const event = getEventForTicket(ticket.eventId);
      const title = event?.title || '';
      const code = ticket.ticketCode || '';

      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (tab === 'All') return true;

      const { isPast } = event ? getCountdown(event.startDateTime) : { isPast: false };
      if (tab === 'Upcoming') return !isPast;
      if (tab === 'Past') return isPast;

      return true;
    });
  }, [tickets, allEvents, searchQuery, tab]);

  const handleConfirmCancel = async () => {
    if (!ticketToCancel) return;
    setIsCancelling(true);
    setActionError(null);
    try {
      await onCancelRegistration(ticketToCancel.ticketId);
      setTicketToCancel(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel registration');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">
            Participant Portal // Passes
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            My Registered Event Passes ({tickets.length})
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Access your cinema-style entry tickets, fastpass QR codes, and reservation management.
          </p>
        </div>

        <button
          onClick={onDiscoverEvents}
          className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-lg self-start md:self-auto"
        >
          <span>Discover More Events</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl text-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-black rounded-xl">
          {(['Upcoming', 'Past', 'All'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                tab === t ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search by title or ticket code */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event title or EVP code..."
            className="w-full pl-9 pr-3 py-1.5 bg-black border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>
      </div>

      {/* Error alert */}
      {actionError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-3xl space-y-4 text-xs">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-accent tracking-wide">
              {tickets.length === 0 ? 'No Event Passes Yet' : 'No Tickets Match Filter'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              {tickets.length === 0
                ? "You haven't registered for any public assemblies yet. Browse available events and claim your verified ticket."
                : 'Try clearing your search or switching tabs to see past tickets.'}
            </p>
          </div>
          {tickets.length === 0 && (
            <button
              onClick={onDiscoverEvents}
              className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-lg"
            >
              <span>Explore Public Events</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => {
            const event = getEventForTicket(ticket.eventId);
            const meta = event ? CATEGORY_METADATA[event.category] : null;
            const qrData = `EVP1:${ticket.eventId}:${ticket.ticketId}`;
            const countdown = event ? getCountdown(event.startDateTime) : { text: 'Scheduled', isPast: false };

            const isPending = ticket.status === 'Pending';
            const isCheckedIn = ticket.isCheckedIn;

            return (
              <div
                key={ticket.ticketId}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md transition-all hover:border-neutral-700 text-xs"
              >
                {/* Card Top: Header & Badges */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    {meta && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${meta.badgeClass}`}>
                        {event?.category}
                      </span>
                    )}

                    {/* Status Badge */}
                    {isCheckedIn ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                        Checked In
                      </span>
                    ) : isPending ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Hourglass className="w-3 h-3 text-amber-400" />
                        Pending Approval
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Valid Pass
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-relaxed">
                    {event?.title || 'Registered Public Event'}
                  </h3>

                  {/* Date, Location, Countdown */}
                  <div className="space-y-1 text-neutral-400 pt-1">
                    {event && (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span>{new Date(event.startDateTime).toLocaleDateString()} · {new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate">{event.venue}, {event.city}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-0.5">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>{countdown.text}</span>
                    </div>
                  </div>
                </div>

                {/* Perforated mini divider */}
                <div className="border-b border-dashed border-neutral-800 my-1" />

                {/* Card Middle: Compact QR & Code */}
                <div className="flex items-center justify-between gap-3 p-3 bg-black border border-neutral-800/80 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Ticket Code</span>
                    <span className="text-base font-bold font-mono tracking-widest text-emerald-400">
                      {ticket.ticketCode}
                    </span>
                    <div className="text-[11px] text-neutral-400">
                      <span>Tier: <strong className="text-white">{ticket.roleTier}</strong></span>
                    </div>
                  </div>

                  <div className="p-1.5 bg-white rounded-lg shrink-0">
                    <QRCodeSVG
                      value={qrData}
                      size={64}
                      level="L"
                      className={isPending ? 'opacity-30' : ''}
                    />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onViewTicket(ticket)}
                      className="py-2 px-3 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Ticket</span>
                    </button>

                    <button
                      onClick={() => onEditDetails(ticket)}
                      className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                    <button
                      onClick={() => onOpenEventDetail(ticket.eventId)}
                      className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Event Info</span>
                    </button>

                    {!isCheckedIn && !countdown.isPast && (
                      <button
                        onClick={() => setTicketToCancel(ticket)}
                        className="hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Cancel Pass</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {ticketToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Cancel Registration?</h3>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              Are you sure you want to cancel your pass for ticket <strong className="text-white font-mono">{ticketToCancel.ticketCode}</strong>?
              This action will release your reserved seat back to the public.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setTicketToCancel(null)}
                disabled={isCancelling}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold cursor-pointer"
              >
                Keep Pass
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase rounded-xl cursor-pointer shadow-md"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
