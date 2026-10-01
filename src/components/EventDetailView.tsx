import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  QrCode,
  Building,
  Mail,
  ExternalLink,
  Tag,
  Megaphone
} from 'lucide-react';
import { EventMetadata, AgendaSession, UserAccount, EventRegistration, Announcement } from '../types';
import { CATEGORY_METADATA } from '../mockData';
import { AnnouncementCard, getRelativeTime } from './AnnouncementCard';

interface EventDetailViewProps {
  event: EventMetadata;
  currentUser: UserAccount | null;
  userRegistration?: EventRegistration | null;
  agenda: AgendaSession[];
  registeredCount: number;
  announcements?: Announcement[];
  onMarkAnnouncementAsRead?: (id: string) => void;
  onBack: () => void;
  onApply: () => void;
  onViewTicket: () => void;
  onRequireLogin: () => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({
  event,
  currentUser,
  userRegistration,
  agenda,
  registeredCount,
  announcements = [],
  onMarkAnnouncementAsRead,
  onBack,
  onApply,
  onViewTicket,
  onRequireLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'agenda' | 'announcements' | 'faqs'>('details');
  const meta = CATEGORY_METADATA[event.category] || CATEGORY_METADATA['Civic & Government'];

  // Latest announcement for banner
  const latestAnnouncement = announcements.length > 0 ? announcements[0] : null;

  // Check deadline
  const isDeadlinePassed = Boolean(
    event.registrationDeadline && new Date() > new Date(event.registrationDeadline)
  );

  // Check capacity
  const isSoldOut = event.capacity > 0 && registeredCount >= event.capacity;
  const seatsLeft = Math.max(0, event.capacity - registeredCount);
  const fillPct = event.capacity > 0 ? Math.min(100, Math.round((registeredCount / event.capacity) * 100)) : 0;

  // Check event status
  const isClosed = event.status === 'Completed' || event.status === 'Cancelled' || isDeadlinePassed;
  const isRegistered = Boolean(userRegistration);

  // Standard or custom FAQs
  const faqs = event.faqs && event.faqs.length > 0 ? event.faqs : [
    {
      question: 'How do I access the venue or meeting on the day of the event?',
      answer: 'Upon registration, you receive a verified digital pass with an EVP ticket code and QR. Show this pass on your phone or printed at the gate, where a volunteer will verify your credentials.',
    },
    {
      question: 'Can I edit my registration details or cancel if my plans change?',
      answer: 'Yes! From the "My Tickets" section in your portal, you can edit your submitted questionnaire answers or cancel your ticket until the registration deadline.',
    },
    {
      question: 'Is there an admission fee?',
      answer: `This gathering is designated as "${event.entryType}". Complimentary admission is granted to all registered attendees.`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 select-none">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Discovery</span>
        </button>

        {isRegistered && (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> You're Registered
          </span>
        )}
      </div>

      {/* Main Event Showcase Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Banner Section */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-neutral-950 to-neutral-900 border-b border-neutral-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${meta.badgeClass}`}>
                {event.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-neutral-800 text-neutral-300 text-[11px] border border-neutral-700">
                {event.mode || 'In-Person'}
              </span>
            </div>

            <span className="text-xs text-neutral-400">
              Status: <strong className="text-emerald-400">{event.status}</strong>
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {event.title}
          </h1>

          {/* Logistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>{new Date(event.startDateTime).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>
                {new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(event.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="truncate">
                {event.mode === 'Online' ? 'Online Event Broadcast' : `${event.venue}, ${event.city}`}
              </span>
            </div>
          </div>

          {/* Seats Left Bar */}
          <div className="p-3.5 bg-black rounded-2xl border border-neutral-800/80 space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">
                Attendee Capacity: <strong className="text-white">{registeredCount}</strong> / {event.capacity}
              </span>
              <span className={isSoldOut ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {isSoldOut ? 'Sold Out' : `${seatsLeft} seats remaining (${100 - fillPct}%)`}
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isSoldOut ? 'bg-rose-500' : fillPct >= 85 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 space-y-8 text-xs">
          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-base">About This Gathering</h3>
            <p className="text-neutral-300 leading-relaxed text-sm whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Agenda & Program Tracks */}
          {agenda.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Event Program & Agenda</h3>
                <span className="text-neutral-500 text-[11px]">{agenda.length} Sessions</span>
              </div>
              <div className="space-y-2">
                {agenda.map((s) => (
                  <div key={s.id} className="p-3.5 bg-black border border-neutral-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{s.title}</span>
                      <span className="text-neutral-500 text-[11px]">{s.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
                      <span>Lead: {s.speaker} ({s.speakerRole})</span>
                      <span>·</span>
                      <span>Room: {s.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Accordion */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <h3 className="font-bold text-white text-base">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-3.5 bg-black border border-neutral-800 rounded-xl space-y-1">
                  <span className="font-bold text-neutral-200 block">{faq.question}</span>
                  <p className="text-neutral-400 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Organizer Info & Contact */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t">
            <div className="space-y-0.5">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Organized By</span>
              <h4 className="font-bold text-white text-xs">{event.organizerName}</h4>
              <p className="text-neutral-400 text-xs">{event.organizerContact}</p>
            </div>

            <div className="text-[11px] text-neutral-500 sm:text-right">
              <span>Admission: {event.entryType}</span>
              {event.registrationDeadline && (
                <div className="text-amber-400/90 mt-0.5 font-semibold">
                  Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Bottom Action Bar */}
        <div className="p-4 sm:p-6 bg-black border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-sm font-bold text-white">{event.entryType}</span>
              <span>·</span>
              <span className={isSoldOut ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {isSoldOut ? 'Full' : `${seatsLeft} seats open`}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              FastPass ticket with unique QR issued upon registration
            </p>
          </div>

          {/* Call to action button */}
          <div className="w-full sm:w-auto">
            {isRegistered ? (
              <button
                onClick={onViewTicket}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg text-xs"
              >
                <QrCode className="w-4 h-4 text-black" />
                <span>View My Ticket</span>
              </button>
            ) : isSoldOut ? (
              <button
                disabled
                className="w-full sm:w-auto px-6 py-2.5 bg-neutral-800 text-neutral-500 font-bold uppercase rounded-xl cursor-not-allowed text-xs border border-neutral-700"
              >
                Sold Out (Capacity Reached)
              </button>
            ) : isClosed ? (
              <button
                disabled
                className="w-full sm:w-auto px-6 py-2.5 bg-neutral-800 text-neutral-500 font-bold uppercase rounded-xl cursor-not-allowed text-xs border border-neutral-700"
              >
                Registration Closed
              </button>
            ) : !currentUser ? (
              <button
                onClick={onRequireLogin}
                className="w-full sm:w-auto px-6 py-2.5 bg-white text-black hover:bg-neutral-200 font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg text-xs"
              >
                <span>Log In / Sign Up to Register</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            ) : (
              <button
                onClick={onApply}
                className="w-full sm:w-auto px-8 py-2.5 bg-white text-black hover:bg-neutral-200 font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg text-xs"
              >
                <span>Register / Apply Now</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
