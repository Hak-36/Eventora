import React, { useState } from 'react';
import {
  Pin,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementCardProps {
  announcement: Announcement;
  onMarkAsRead?: (id: string) => void;
  onViewEvent?: (eventId: string) => void;
  isNewArrival?: boolean;
  defaultExpanded?: boolean;
}

// Format relative time helper
export function getRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = Date.now();
    const diffMs = now - d.getTime();

    if (isNaN(diffMs)) return 'Recently';
    if (diffMs < 60000) return 'Just now';

    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin} min ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function getFullDateFormatted(dateString: string): string {
  try {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  } catch {
    return '';
  }
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onMarkAsRead,
  onViewEvent,
  isNewArrival = false,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isUrgent = announcement.type === 'Urgent';
  const isPinned = Boolean(announcement.isPinned);
  const isUnread = !announcement.isRead;

  const handleCardClick = () => {
    setIsExpanded((prev) => !prev);
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(announcement.id);
    }
  };

  // Detect time or venue change
  const mentionsScheduleOrVenue =
    announcement.type === 'Schedule change' ||
    /time|venue|location|schedule|room|postponed|relocated|moved|rescheduled|date|delay/i.test(
      `${announcement.title || ''} ${announcement.message || ''}`
    );

  // Type badge styling
  const getTypeBadge = () => {
    switch (announcement.type) {
      case 'Urgent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Urgent
          </span>
        );
      case 'Schedule change':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Schedule Change
          </span>
        );
      case 'Reminder':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-sky-400" />
            Reminder
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            General
          </span>
        );
    }
  };

  const cardBorderClass = isUrgent
    ? 'border-rose-500/50 bg-neutral-900/90 shadow-rose-950/30'
    : isPinned
    ? 'border-neutral-700 bg-neutral-900/90'
    : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700';

  const fullDate = getFullDateFormatted(announcement.createdAt || announcement.timestamp);
  const relativeTime = getRelativeTime(announcement.createdAt || announcement.timestamp);

  return (
    <div
      onClick={handleCardClick}
      className={`relative rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer shadow-md text-xs select-none ${cardBorderClass}`}
    >
      {/* Top Banner Row: Event Info + Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-neutral-800/80">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Event thumbnail or fallback icon */}
          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-neutral-300 overflow-hidden">
            {announcement.eventBannerUrl ? (
              <img
                src={announcement.eventBannerUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Building className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </div>

          <div className="min-w-0">
            <span className="font-bold text-neutral-200 text-xs truncate block max-w-xs sm:max-w-sm">
              {announcement.eventTitle || 'Event Update'}
            </span>
            <span className="text-[10px] text-neutral-500 truncate block">
              by {announcement.organizerName || 'Host Organizer'}
            </span>
          </div>
        </div>

        {/* Right tags: Pinned, Type, New, Unread dot */}
        <div className="flex items-center gap-2 shrink-0">
          {isNewArrival && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-black shadow-sm animate-pulse">
              NEW
            </span>
          )}

          {isPinned && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-amber-300 border border-neutral-700 flex items-center gap-1"
              title="Pinned to top by host"
            >
              <Pin className="w-3 h-3 text-amber-400 rotate-45" />
              <span>Pinned</span>
            </span>
          )}

          {getTypeBadge()}

          {/* Unread indicator dot */}
          {isUnread ? (
            <span
              className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20 shrink-0"
              title="Unread announcement"
            />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 text-neutral-600 shrink-0" title="Read" />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h4
            className={`font-bold text-sm tracking-tight leading-snug ${
              isUrgent ? 'text-rose-200' : 'text-white'
            }`}
          >
            {announcement.title || 'Announcement'}
          </h4>

          <span
            className="text-[11px] text-neutral-400 shrink-0 cursor-help whitespace-nowrap"
            title={fullDate}
          >
            {relativeTime}
            {announcement.isEdited && (
              <span className="ml-1 text-[10px] text-neutral-500 italic">(Edited)</span>
            )}
          </span>
        </div>

        {/* Message body (clamped if not expanded) */}
        <p
          className={`text-neutral-300 leading-relaxed whitespace-pre-line text-xs ${
            isExpanded ? '' : 'line-clamp-2'
          }`}
        >
          {announcement.message || announcement.polishedText || announcement.rawText || ''}
        </p>

        {/* Expanded View Extras */}
        {isExpanded && (
          <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2.5 mt-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="text-neutral-500">Audience:</span>
              <span className="px-2 py-0.5 rounded-md bg-black border border-neutral-800 text-neutral-300">
                {announcement.targetAudience || 'All Attendees'}
              </span>
            </div>

            {mentionsScheduleOrVenue && onViewEvent && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewEvent(announcement.eventId);
                }}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Event Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            )}
          </div>
        )}

        {/* Expand/Collapse Toggle Hint */}
        <div className="flex items-center justify-end pt-1">
          <span className="text-[11px] text-neutral-500 hover:text-neutral-400 flex items-center gap-1">
            {isExpanded ? (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Read more</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
