import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Sparkles,
  Send,
  Copy,
  Check,
  QrCode,
  UserPlus,
  X,
  Radio,
  Building,
  Plus,
  ChevronDown,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Ticket,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Edit2,
  Trash2,
  Pin,
  Eye,
  AlertTriangle
} from 'lucide-react';
import {
  EventMetadata,
  EventStatus,
  Participant,
  Announcement,
  AnnouncementType,
  FeedbackItem,
  TicketTier,
  CommunicationTone,
  RegistrationStatus
} from '../types';
import { CATEGORY_METADATA } from '../mockData';
import { polishAnnouncement, calculateHostInsights } from '../utils/aiEngines';

interface AdminDashboardViewProps {
  currentEvent: EventMetadata;
  hostEvents: EventMetadata[];
  participants: Participant[];
  announcements: Announcement[];
  feedbacks: FeedbackItem[];
  onSelectEvent: (eventId: string) => void;
  onGoToMyEvents: () => void;
  onOpenCreateEvent: () => void;
  onUpdateStatus: (eventId: string, newStatus: EventStatus) => void;
  onToggleCheckIn: (id: string) => void;
  onUpdateParticipantStatus?: (participantId: string, status: RegistrationStatus) => void;
  onAddParticipant: (participant: Omit<Participant, 'id' | 'eventId'>) => void;
  onBroadcastAnnouncement: (announcement: Omit<Announcement, 'id' | 'eventId'>) => void;
  onEditAnnouncement?: (id: string, updates: Partial<Announcement>) => void;
  onDeleteAnnouncement?: (id: string) => void;
  onOpenQRScanner: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentEvent,
  hostEvents,
  participants,
  announcements,
  feedbacks,
  onSelectEvent,
  onGoToMyEvents,
  onOpenCreateEvent,
  onUpdateStatus,
  onToggleCheckIn,
  onUpdateParticipantStatus,
  onAddParticipant,
  onBroadcastAnnouncement,
  onEditAnnouncement,
  onDeleteAnnouncement,
  onOpenQRScanner,
}) => {
  // Search & Filter state for attendees
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'All' | TicketTier | 'CheckedIn' | 'Pending'>('All');

  // Gate Manual Verification state
  const [gateCodeInput, setGateCodeInput] = useState('');
  const [gateVerifyResult, setGateVerifyResult] = useState<{
    success: boolean;
    message: string;
    participant?: Participant;
  } | null>(null);

  // Answers modal state
  const [viewingAnswersParticipant, setViewingAnswersParticipant] = useState<Participant | null>(null);

  // Announcement state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [rawNotes, setRawNotes] = useState('registration line moving fast main doors now open');
  const [selectedTone, setSelectedTone] = useState<CommunicationTone>(currentEvent.tone);
  const [polishedOutput, setPolishedOutput] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [broadcastType, setBroadcastType] = useState<AnnouncementType>('General');
  const [broadcastTarget, setBroadcastTarget] = useState<string>('All Attendees');
  const [isPinned, setIsPinned] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Edit / Delete announcement state
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editType, setEditType] = useState<AnnouncementType>('General');
  const [editTarget, setEditTarget] = useState('All Attendees');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editScheduledFor, setEditScheduledFor] = useState('');
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // Add Attendee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [newAttendeeTier, setNewAttendeeTier] = useState<TicketTier>('General');
  const [newAttendeeOrg, setNewAttendeeOrg] = useState('');

  const activeMeta = CATEGORY_METADATA[currentEvent.category] || CATEGORY_METADATA['Civic & Government'];

  // Metrics calculation
  const metrics = useMemo(() => {
    return calculateHostInsights(participants, currentEvent.capacity);
  }, [participants, currentEvent.capacity]);

  // Filtered attendees
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.company && p.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.role && p.role.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (tierFilter === 'All') return true;
      if (tierFilter === 'CheckedIn') return p.isCheckedIn;
      if (tierFilter === 'Pending') return !p.isCheckedIn;
      return p.ticketTier === tierFilter;
    });
  }, [participants, searchQuery, tierFilter]);

  // Polish Announcement (instant without fake delays)
  const handlePolishAnnouncement = () => {
    const polished = polishAnnouncement(rawNotes, selectedTone, currentEvent.title);
    setPolishedOutput(polished);
    if (!broadcastTitle) {
      setBroadcastTitle(rawNotes.length > 45 ? rawNotes.slice(0, 42).trim() + '...' : rawNotes);
    }
  };

  // Read count statistics helper
  const getReadStats = (ann: Announcement) => {
    const active = participants.filter((p) => p.status !== 'Cancelled' && p.status !== 'Rejected');
    let targetGroup = active;
    const target = (ann.targetAudience || 'All Attendees').trim();
    if (target === 'Checked-in only') {
      targetGroup = active.filter((p) => p.isCheckedIn);
    } else if (target === 'Not yet checked-in' || target === 'Not checked-in') {
      targetGroup = active.filter((p) => !p.isCheckedIn);
    } else if (target !== 'All' && target !== 'All Attendees' && target !== 'General Public') {
      const tierClean = target.toLowerCase().replace(/ only| attendees/gi, '').trim();
      targetGroup = active.filter((p) => (p.ticketTier || '').toLowerCase().includes(tierClean));
    }
    const readEmails = new Set(Array.isArray(ann.readBy) ? ann.readBy.map((e) => e.toLowerCase()) : []);
    const readCount = targetGroup.filter((p) => readEmails.has((p.email || '').toLowerCase())).length;
    return { readCount, totalTarget: Math.max(targetGroup.length, ann.readBy?.length || 0) };
  };

  // Gate Code Verification
  const handleVerifyGateCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = gateCodeInput.trim().toUpperCase();
    if (!clean) return;
    const match = participants.find(
      (p) => (p.ticketCode && p.ticketCode.toUpperCase() === clean) || p.id === clean
    );
    if (!match) {
      setGateVerifyResult({
        success: false,
        message: `No ticket found with code "${clean}" for this event.`,
      });
      return;
    }
    setGateVerifyResult({
      success: true,
      message: `Verified: ${match.name} [${match.ticketTier}]`,
      participant: match,
    });
  };

  const handleGateDirectCheckIn = (participantId: string) => {
    onToggleCheckIn(participantId);
    setGateVerifyResult((prev) => {
      if (!prev || !prev.participant || prev.participant.id !== participantId) return prev;
      const nextChecked = !prev.participant.isCheckedIn;
      return {
        ...prev,
        message: nextChecked ? `Successfully checked in ${prev.participant.name}!` : `Check-in undone for ${prev.participant.name}.`,
        participant: { ...prev.participant, isCheckedIn: nextChecked },
      };
    });
  };

  // Broadcast announcement
  const handleBroadcast = () => {
    if (!polishedOutput) return;

    onBroadcastAnnouncement({
      title: broadcastTitle.trim() || rawNotes.slice(0, 45).trim() + '...',
      message: polishedOutput,
      rawText: rawNotes,
      polishedText: polishedOutput,
      type: broadcastType,
      tone: selectedTone,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      targetAudience: broadcastTarget,
      isPinned,
      scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      organizerName: currentEvent.organizerName || 'Event Host',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDelivered: true,
      readBy: [],
    });

    setBroadcastSuccess(true);
    setBroadcastTitle('');
    setRawNotes('');
    setPolishedOutput('');
    setIsPinned(false);
    setScheduledFor('');
    setTimeout(() => setBroadcastSuccess(false), 2500);
  };

  // Open Edit Announcement Modal
  const handleStartEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setEditTitle(ann.title || '');
    setEditMessage(ann.message || ann.polishedText || '');
    setEditType(ann.type || 'General');
    setEditTarget(ann.targetAudience || 'All Attendees');
    setEditIsPinned(Boolean(ann.isPinned));
    setEditScheduledFor(ann.scheduledFor ? ann.scheduledFor.slice(0, 16) : '');
  };

  const handleSaveEditAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement || !editMessage.trim() || !onEditAnnouncement) return;

    onEditAnnouncement(editingAnnouncement.id, {
      title: editTitle.trim() || editingAnnouncement.title,
      message: editMessage.trim(),
      polishedText: editMessage.trim(),
      type: editType,
      targetAudience: editTarget,
      isPinned: editIsPinned,
      scheduledFor: editScheduledFor ? new Date(editScheduledFor).toISOString() : null,
    });

    setEditingAnnouncement(null);
  };

  const handleCopy = () => {
    if (!polishedOutput) return;
    navigator.clipboard.writeText(polishedOutput);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleCreateAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendeeName.trim() || !newAttendeeEmail.trim()) return;

    onAddParticipant({
      name: newAttendeeName.trim(),
      email: newAttendeeEmail.trim(),
      ticketTier: newAttendeeTier,
      company: newAttendeeOrg.trim() || 'Guest Delegate',
      role: 'Participant',
      isCheckedIn: false,
    });

    setNewAttendeeName('');
    setNewAttendeeEmail('');
    setNewAttendeeOrg('');
    setIsAddModalOpen(false);
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'Live':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
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
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 select-none">
      {/* 1. Dashboard Header & Event Switcher */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        {/* Back Link & Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <button
            onClick={onGoToMyEvents}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Events Hub</span>
          </button>

          {/* Top Event Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-neutral-500 uppercase hidden sm:inline">
              Switch Event:
            </label>
            <select
              value={currentEvent.id}
              onChange={(e) => onSelectEvent(e.target.value)}
              className="px-3 py-1.5 bg-black border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none cursor-pointer max-w-[280px] sm:max-w-xs truncate"
            >
              {hostEvents.map((evt) => (
                <option key={evt.id} value={evt.id} className="bg-neutral-900 text-white">
                  [{evt.status}] {evt.title}
                </option>
              ))}
            </select>

            <button
              onClick={onOpenCreateEvent}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Create another event"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Event</span>
            </button>
          </div>
        </div>

        {/* Current Event Details & Status Changer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${activeMeta.badgeClass}`}>
                {currentEvent.category}
              </span>
              {getStatusBadge(currentEvent.status)}
              <span className="text-xs text-neutral-400">
                {currentEvent.entryType}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {currentEvent.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                {currentEvent.venue}, {currentEvent.city}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                {new Date(currentEvent.startDateTime).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Actions & Status Changer */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5 bg-black border border-neutral-800 rounded-xl px-2.5 py-1">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">Status:</span>
              <select
                value={currentEvent.status}
                onChange={(e) => onUpdateStatus(currentEvent.id, e.target.value as EventStatus)}
                className="bg-transparent text-xs text-neutral-200 py-1 focus:outline-none cursor-pointer"
              >
                <option value="Draft" className="bg-neutral-900">Draft</option>
                <option value="Published" className="bg-neutral-900">Published</option>
                <option value="Live" className="bg-neutral-900">Live</option>
                <option value="Completed" className="bg-neutral-900">Completed</option>
                <option value="Cancelled" className="bg-neutral-900">Cancelled</option>
              </select>
            </div>

            {/* Launch QR Scanner */}
            <button
              onClick={onOpenQRScanner}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Scan QR Pass</span>
            </button>
          </div>
        </div>

        {/* 4 Core Metrics Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4 border-t border-neutral-800">
          <div className="p-3.5 bg-black rounded-2xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider block">Registered</span>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              {metrics.total}
              <span className="text-xs text-neutral-500 font-normal ml-1">/ {currentEvent.capacity}</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">
              {metrics.capacityFillRate}% Capacity Filled
            </span>
          </div>

          <div className="p-3.5 bg-black rounded-2xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider block">Checked In</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
              {metrics.checkedIn}
            </div>
            <span className="text-[10px] text-emerald-500/80 mt-1 block">
              {metrics.checkInRate}% Live Turnout
            </span>
          </div>

          <div className="p-3.5 bg-black rounded-2xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider block">Pending Arrival</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
              {metrics.pending}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Awaiting On-Site Check-In
            </span>
          </div>

          <div className="p-3.5 bg-black rounded-2xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider block">Category Tone</span>
            <div className="text-xs font-bold text-white mt-2 truncate">
              {currentEvent.tone}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Domain: {currentEvent.category}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Announcement Broadcast Center */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider mb-1">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Broadcast Center // Live Dispatch</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Publish Event Announcements
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-semibold">Tone:</span>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as CommunicationTone)}
              className="px-2.5 py-1 bg-black border border-neutral-800 rounded-xl text-xs text-neutral-200 cursor-pointer"
            >
              <option value="Civic & Official">Civic & Official</option>
              <option value="Warm & Community-First">Warm & Community-First</option>
              <option value="High-Energy & Inspiring">High-Energy & Inspiring</option>
              <option value="Educational & Informative">Educational & Informative</option>
              <option value="Celebratory & Festive">Celebratory & Festive</option>
              <option value="Reverent & Heritage-Focused">Reverent & Heritage-Focused</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          {/* Input raw notes & options */}
          <div className="space-y-3">
            <div>
              <label className="text-neutral-400 uppercase tracking-wider font-semibold block mb-1">
                Announcement Headline / Title
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Gate 2 Opening Early / Stage Change"
                className="w-full px-3.5 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:border-neutral-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-neutral-400 uppercase tracking-wider font-semibold block mb-1">
                Draft Dispatch Notes
              </label>
              <textarea
                rows={3}
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:border-neutral-500 focus:outline-none"
                placeholder="e.g. registration line moving fast main doors now open..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePolishAnnouncement}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Format & Polish Dispatch</span>
              </button>

              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-neutral-700 bg-black text-white focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Pin className="w-3 h-3 text-amber-400 rotate-45" /> Pin to top
                </span>
              </label>
            </div>
          </div>

          {/* Polished output & dispatch options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-neutral-400 uppercase tracking-wider font-semibold">
                Formatted Public Broadcast
              </label>
              {polishedOutput && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-black border border-neutral-800 rounded-xl min-h-[75px] text-neutral-200 leading-relaxed">
              {polishedOutput || (
                <span className="text-neutral-500 italic">
                  Click 'Format & Polish Dispatch' to preview how this announcement will appear to attendees.
                </span>
              )}
            </div>

            {/* Selectors: Type & Audience & Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[10px] text-neutral-500 uppercase block mb-1">
                  Priority / Type:
                </label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as AnnouncementType)}
                  className="w-full px-2.5 py-1.5 bg-black border border-neutral-800 rounded-xl text-neutral-300 cursor-pointer text-xs"
                >
                  <option value="General">General Announcement</option>
                  <option value="Schedule change">Schedule Change</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Urgent">Urgent Priority (Red Banner)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 uppercase block mb-1">
                  Audience Target:
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black border border-neutral-800 rounded-xl text-neutral-300 cursor-pointer text-xs"
                >
                  <option value="All Attendees">All Attendees</option>
                  <option value="Checked-in only">Checked-in only</option>
                  <option value="Not yet checked-in">Not yet checked-in</option>
                  <option value="VIP Only">VIP Tier Only</option>
                  <option value="Speakers">Speakers / Dignitaries</option>
                  <option value="Volunteers">Volunteers Only</option>
                </select>
              </div>
            </div>

            {/* Optional Schedule Send Date & Time */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neutral-500 uppercase whitespace-nowrap">Schedule (optional):</span>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="px-2 py-1 bg-black border border-neutral-800 rounded-lg text-neutral-300 text-xs focus:outline-none"
                  />
                  {scheduledFor && (
                    <button
                      type="button"
                      onClick={() => setScheduledFor('')}
                      className="text-[10px] text-neutral-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleBroadcast}
                disabled={!polishedOutput}
                className="px-4 py-2 bg-white text-black hover:bg-neutral-200 disabled:opacity-40 font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{broadcastSuccess ? 'Dispatched!' : 'Broadcast to Attendees'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Existing Announcements List for this Event with Delivered & Read Metrics */}
        {announcements.length > 0 && (
          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <span className="text-[11px] text-neutral-400 uppercase font-semibold tracking-wider block">
              Recent Dispatches ({announcements.length}):
            </span>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {announcements.map((ann) => {
                const { readCount, totalTarget } = getReadStats(ann);
                return (
                  <div
                    key={ann.id}
                    className="p-3 bg-black border border-neutral-800/90 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {ann.isPinned && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-amber-300 border border-neutral-700 flex items-center gap-1">
                            <Pin className="w-3 h-3 text-amber-400 rotate-45" /> Pinned
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ann.type === 'Urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : ann.type === 'Schedule change'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : ann.type === 'Reminder'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          }`}
                        >
                          {ann.type || 'General'}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          Target: {ann.targetAudience} · {ann.timestamp}
                          {ann.isEdited && <span className="ml-1 italic text-neutral-400">(Edited)</span>}
                        </span>
                      </div>

                      {ann.title && (
                        <h4 className="font-bold text-white text-xs truncate">
                          {ann.title}
                        </h4>
                      )}

                      <p className="text-neutral-300 line-clamp-2 leading-relaxed">
                        {ann.message || ann.polishedText || ann.rawText}
                      </p>

                      {ann.scheduledFor && (
                        <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Scheduled for: {new Date(ann.scheduledFor).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-900">
                      {/* Delivered & Read Count */}
                      <div className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 flex items-center gap-1.5 shadow-sm">
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Read by <strong>{readCount}</strong> of <strong>{totalTarget}</strong></span>
                      </div>

                      {/* Edit & Delete Controls */}
                      <div className="flex items-center gap-1">
                        {onEditAnnouncement && (
                          <button
                            type="button"
                            onClick={() => handleStartEditAnnouncement(ann)}
                            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                            title="Edit announcement"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteAnnouncement && (
                          <button
                            type="button"
                            onClick={() => setAnnouncementToDelete(ann)}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. Attendee Registry & Live Check-In Management */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Participant Registry // Gate Verification & Live Access</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Registered Attendees ({participants.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, role, email..."
                className="pl-9 pr-3 py-1.5 bg-black border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none w-48 sm:w-56"
              />
            </div>

            {/* Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-black border border-neutral-800 rounded-xl text-xs text-neutral-200 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="CheckedIn">Checked In</option>
              <option value="Pending">Pending</option>
              <option value="General">General</option>
              <option value="Delegate">Delegate</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Athlete">Athlete</option>
              <option value="Performer">Performer</option>
              <option value="VIP">VIP</option>
            </select>

            {/* Add Attendee */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Guest</span>
            </button>
          </div>
        </div>

        {/* Gate Volunteer Manual Code Lookup */}
        <div className="p-4 bg-black/60 border border-neutral-800 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
                Gate Volunteer Manual Verification
              </span>
              <p className="text-xs text-neutral-300 font-medium">
                Verify attendee ticket codes manually upon arrival (e.g. EVP-XXXXX)
              </p>
            </div>

            <form onSubmit={handleVerifyGateCode} className="flex items-center gap-2">
              <div className="relative">
                <Ticket className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={gateCodeInput}
                  onChange={(e) => setGateCodeInput(e.target.value)}
                  placeholder="Enter Code (e.g. EVP-7K3Q9)"
                  className="pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-white w-52"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Verify
              </button>
            </form>
          </div>

          {/* Verification Result Banner */}
          {gateVerifyResult && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                gateVerifyResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {gateVerifyResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{gateVerifyResult.message}</span>
              </div>

              {gateVerifyResult.participant && (
                <button
                  onClick={() => handleGateDirectCheckIn(gateVerifyResult.participant!.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    gateVerifyResult.participant.isCheckedIn
                      ? 'bg-neutral-800 text-neutral-300 hover:text-white'
                      : 'bg-emerald-500 text-black hover:bg-emerald-400'
                  }`}
                >
                  {gateVerifyResult.participant.isCheckedIn ? 'Undo Check-In' : 'Mark Checked In'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Participants Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Participant</th>
                <th className="py-2.5 px-3">Ticket Code</th>
                <th className="py-2.5 px-3">Affiliation / Role</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    No participants matched your search criteria for this event.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const hasAnswers = p.answers && Object.keys(p.answers).length > 0;
                  const isManualPending = currentEvent.approvalMode === 'Manual' && p.status === 'Pending';

                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[11px] text-neutral-400">{p.email}</div>
                        {p.registeredAt && (
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            Reg: {new Date(p.registeredAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 bg-black border border-neutral-700 rounded-lg text-emerald-400 font-mono font-bold text-[11px] tracking-wider">
                          {p.ticketCode || `EVP-${p.id.slice(-5).toUpperCase()}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-300">
                        <div>{p.company || p.role || 'Community Delegate'}</div>
                        {hasAnswers && (
                          <button
                            onClick={() => setViewingAnswersParticipant(p)}
                            className="mt-1 text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer underline"
                          >
                            <FileText className="w-3 h-3 text-purple-400" />
                            <span>View Answers</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {p.ticketTier}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.isCheckedIn ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Checked In ({p.checkInTimestamp || 'On Site'})
                          </span>
                        ) : p.status === 'Rejected' ? (
                          <span className="text-rose-400 font-semibold text-[11px]">Rejected</span>
                        ) : p.status === 'Pending' ? (
                          <span className="text-amber-400 font-semibold text-[11px]">Pending Approval</span>
                        ) : (
                          <span className="text-neutral-400 font-semibold text-[11px]">Approved</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approval buttons for Manual events */}
                          {isManualPending && onUpdateParticipantStatus && (
                            <>
                              <button
                                onClick={() => onUpdateParticipantStatus(p.id, 'Approved')}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors cursor-pointer"
                                title="Approve Registration"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onUpdateParticipantStatus(p.id, 'Rejected')}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors cursor-pointer"
                                title="Reject Registration"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Check in toggle */}
                          <button
                            onClick={() => onToggleCheckIn(p.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              p.isCheckedIn
                                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                            }`}
                          >
                            {p.isCheckedIn ? 'Undo' : 'Check In'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Community Feedback Section */}
      {feedbacks.length > 0 && (
        <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider mb-1">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Attendee Reviews & Sentiment</span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Community Feedback ({feedbacks.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="p-3.5 bg-black border border-neutral-800 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{fb.authorName} ({fb.ticketTier})</span>
                  <span className="text-[11px] text-neutral-500">{fb.timestamp}</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">"{fb.comment}"</p>
                <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                  <span>Rating: {fb.ratings.contentQuality}/5</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-bold">{fb.sentiment} Sentiment</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add Attendee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add Guest to Event</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAttendee} className="space-y-4">
              <div>
                <label className="block text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAttendeeName}
                  onChange={(e) => setNewAttendeeName(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none"
                  placeholder="e.g. Jordan Rivera"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newAttendeeEmail}
                  onChange={(e) => setNewAttendeeEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none"
                  placeholder="e.g. jordan@example.com"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                  Affiliation / Organization
                </label>
                <input
                  type="text"
                  value={newAttendeeOrg}
                  onChange={(e) => setNewAttendeeOrg(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none"
                  placeholder="e.g. Transit League or Volunteer Group"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                  Admission Tier
                </label>
                <select
                  value={newAttendeeTier}
                  onChange={(e) => setNewAttendeeTier(e.target.value as TicketTier)}
                  className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-200 cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Delegate">Citizen Delegate</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Athlete">Athlete</option>
                  <option value="Performer">Performer</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black hover:bg-neutral-200 font-bold uppercase rounded-xl"
                >
                  Add Attendee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submitted Answers Modal */}
      {viewingAnswersParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Application Answers: {viewingAnswersParticipant.name}
                </h3>
                <span className="text-[11px] text-neutral-400">
                  {viewingAnswersParticipant.email} · {viewingAnswersParticipant.ticketTier} ·{' '}
                  <span className="font-mono text-emerald-400 font-bold">{viewingAnswersParticipant.ticketCode || 'No Code'}</span>
                </span>
              </div>
              <button
                onClick={() => setViewingAnswersParticipant(null)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {viewingAnswersParticipant.answers && Object.keys(viewingAnswersParticipant.answers).length > 0 ? (
                Object.entries(viewingAnswersParticipant.answers).map(([key, value]) => {
                  const displayValue =
                    typeof value === 'boolean'
                      ? value ? 'Yes (Confirmed)' : 'No'
                      : Array.isArray(value)
                      ? value.join(', ')
                      : typeof value === 'object' && value !== null
                      ? JSON.stringify(value)
                      : String(value);

                  return (
                    <div key={key} className="p-3 bg-black border border-neutral-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <p className="text-neutral-200 font-medium whitespace-pre-wrap break-words">
                        {displayValue || <span className="text-neutral-600 italic">None provided</span>}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-neutral-500">
                  No additional custom application answers were submitted.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                onClick={() => setViewingAnswersParticipant(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {editingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Edit Announcement</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAnnouncement(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAnnouncement} className="space-y-4">
              <div>
                <label className="block text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                  Headline / Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none"
                  placeholder="Headline title"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                  Announcement Message <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                    Priority / Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as AnnouncementType)}
                    className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-300 text-xs"
                  >
                    <option value="General">General</option>
                    <option value="Schedule change">Schedule change</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                    Target Audience
                  </label>
                  <select
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-300 text-xs"
                  >
                    <option value="All Attendees">All Attendees</option>
                    <option value="Checked-in only">Checked-in only</option>
                    <option value="Not yet checked-in">Not yet checked-in</option>
                    <option value="VIP Only">VIP Tier Only</option>
                    <option value="Speakers">Speakers / Dignitaries</option>
                    <option value="Volunteers">Volunteers Only</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editIsPinned}
                    onChange={(e) => setEditIsPinned(e.target.checked)}
                    className="rounded border-neutral-700 bg-black text-white focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Pin className="w-3 h-3 text-amber-400 rotate-45" /> Pin to top
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="datetime-local"
                    value={editScheduledFor}
                    onChange={(e) => setEditScheduledFor(e.target.value)}
                    className="px-2 py-1 bg-black border border-neutral-800 rounded-lg text-neutral-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black hover:bg-neutral-200 font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Announcement Modal */}
      {announcementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Announcement?</h3>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{announcementToDelete.title || 'this announcement'}"</strong>?
              This will remove it from all attendee feeds and event screens.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setAnnouncementToDelete(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold cursor-pointer"
              >
                Keep Announcement
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAnnouncement) {
                    onDeleteAnnouncement(announcementToDelete.id);
                  }
                  setAnnouncementToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase rounded-xl cursor-pointer shadow-md"
              >
                Delete for Everyone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
