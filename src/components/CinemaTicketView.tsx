import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  MapPin,
  Clock,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  CalendarPlus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Hourglass,
  Tag,
  Building,
  Sparkles
} from 'lucide-react';
import { EventMetadata, EventRegistration } from '../types';

interface CinemaTicketViewProps {
  registration: EventRegistration;
  event: EventMetadata;
  onBackToMyTickets: () => void;
  onBackToDiscovery: () => void;
  isNewlyRegistered?: boolean;
}

export const CinemaTicketView: React.FC<CinemaTicketViewProps> = ({
  registration,
  event,
  onBackToMyTickets,
  onBackToDiscovery,
  isNewlyRegistered = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const qrData = `EVP1:${registration.eventId}:${registration.ticketId}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(registration.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate .ics calendar file
  const handleAddToCalendar = () => {
    try {
      const start = new Date(event.startDateTime).toISOString().replace(/-|:|\.\d+/g, '');
      const end = new Date(event.endDateTime).toISOString().replace(/-|:|\.\d+/g, '');
      const location = event.mode === 'Online' ? (event.meetingLink || 'Online Event') : `${event.venue}, ${event.city}`;
      const description = `${event.description}\n\nYour Ticket Code: ${registration.ticketCode}\nTier: ${registration.roleTier}`;

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Eventora//Public Events//EN',
        'BEGIN:VEVENT',
        `UID:${registration.ticketId}@eventora.io`,
        `DTSTAMP:${start}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.title.slice(0, 20)}_Ticket.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating calendar file:', err);
    }
  };

  // Download ticket as PNG using HTML Canvas
  const handleDownloadPNG = async () => {
    setIsDownloading(true);
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 800, 1100);

      // Border and ticket frame
      ctx.strokeStyle = '#262626';
      ctx.lineWidth = 3;
      ctx.strokeRect(25, 25, 750, 1050);

      // Perforation line
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = '#404040';
      ctx.beginPath();
      ctx.moveTo(35, 680);
      ctx.lineTo(765, 680);
      ctx.stroke();
      ctx.setLineDash([]);

      // Notch cutouts
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(25, 680, 22, 0, Math.PI * 2);
      ctx.arc(775, 680, 22, 0, Math.PI * 2);
      ctx.fill();

      // Brand Title
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 20px 'Nunito', 'Segoe UI', sans-serif";
      ctx.fillText('EVENTORA // OFFICIAL ADMISSION PASS', 60, 80);

      // Status
      ctx.font = "bold 16px 'Nunito', 'Segoe UI', sans-serif";
      if (registration.isCheckedIn) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('● CHECKED IN AT GATE', 60, 120);
      } else if (registration.status === 'Approved') {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('● VALID: SHOW THIS AT GATE', 60, 120);
      } else {
        ctx.fillStyle = '#facc15';
        ctx.fillText('● PENDING HOST APPROVAL', 60, 120);
      }

      // Event Title
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 28px 'Nunito', 'Segoe UI', sans-serif";
      ctx.fillText(event.title.length > 38 ? event.title.substring(0, 36) + '...' : event.title, 60, 180);

      // Details
      ctx.fillStyle = '#9ca3af';
      ctx.font = "500 18px 'Nunito', 'Segoe UI', sans-serif";
      ctx.fillText(`Category: ${event.category}`, 60, 225);
      ctx.fillText(`Date: ${new Date(event.startDateTime).toLocaleDateString()} - ${new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 60, 260);
      ctx.fillText(`Venue: ${event.venue}, ${event.city}`, 60, 295);

      // Attendee info
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 22px 'Nunito', 'Segoe UI', sans-serif";
      ctx.fillText(`Attendee: ${registration.participantName}`, 60, 370);
      ctx.font = "500 18px 'Nunito', 'Segoe UI', sans-serif";
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(`Role / Tier: ${registration.roleTier}`, 60, 405);
      ctx.fillText(`Email: ${registration.participantEmail}`, 60, 440);
      if (registration.company) {
        ctx.fillText(`Affiliation: ${registration.company}`, 60, 475);
      }

      // QR section (lower ticket half)
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 18px 'Nunito', 'Segoe UI', sans-serif";
      ctx.fillText('GATE VERIFICATION CODE', 60, 730);

      // Unique Ticket Code in JetBrains Mono
      ctx.font = "bold 36px 'JetBrains Mono', monospace";
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(registration.ticketCode, 60, 785);

      ctx.fillStyle = '#9ca3af';
      ctx.font = "500 15px 'Nunito', 'Segoe UI', sans-serif";
      ctx.fillText('A volunteer will verify your code manually or verify your QR code.', 60, 830);
      ctx.fillText(`Registration ID: ${registration.ticketId}`, 60, 865);
      ctx.fillText(`Issued: ${new Date(registration.registeredAt).toLocaleDateString()}`, 60, 900);

      // Download trigger
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Ticket_${registration.ticketCode}.png`;
      link.click();
    } catch (err) {
      console.error('Error rendering ticket image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isPending = registration.status === 'Pending';
  const isCheckedIn = registration.isCheckedIn;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 select-none">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDiscovery}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Discovery</span>
        </button>

        <button
          onClick={onBackToMyTickets}
          className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-800 transition-colors cursor-pointer"
        >
          View My Tickets
        </button>
      </div>

      {/* Confirmation Success Banner (shown right after registration) */}
      {isNewlyRegistered && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3.5 text-xs text-emerald-300 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-accent tracking-wide">
              Registered! You're in for {event.title}
            </h3>
            <p className="text-emerald-300/90 leading-relaxed text-xs">
              Your official ticket and gate fastpass have been issued below. Please present this ticket code or QR upon arriving at the venue. A gate volunteer will verify your credentials and mark you present.
            </p>
          </div>
        </div>
      )}

      {/* Cinema-Style Perforated Ticket Container */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Ticket Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-neutral-950 to-neutral-900 border-b border-neutral-800 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border-purple-500/20">
                  {event.category}
                </span>
                <span className="text-xs text-neutral-500">
                  {event.mode || 'In-Person'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {event.title}
              </h2>
            </div>

            {/* Live Status Badge */}
            <div className="shrink-0">
              {isCheckedIn ? (
                <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Checked In {registration.checkInTimestamp ? `at ${registration.checkInTimestamp}` : ''}</span>
                </div>
              ) : isPending ? (
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-2 text-xs font-bold">
                  <Hourglass className="w-4 h-4 text-amber-400" />
                  <span>Pending Host Approval</span>
                </div>
              ) : (
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Valid: Show at Gate</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-4 border-t border-neutral-800/80 text-xs text-neutral-300">
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
                {event.mode === 'Online' ? 'Online Video Broadcast' : `${event.venue}, ${event.city}`}
              </span>
            </div>
          </div>
        </div>

        {/* Perforated Edge Divider with Authentic Ticket Notches */}
        <div className="relative w-full h-8 flex items-center justify-between overflow-hidden bg-neutral-900 pointer-events-none">
          {/* Left Notch */}
          <div className="w-6 h-12 bg-black rounded-r-full -ml-3 border-r border-neutral-800" />
          {/* Dashed Perforation Line */}
          <div className="flex-1 border-b-2 border-dashed border-neutral-800 mx-4" />
          {/* Right Notch */}
          <div className="w-6 h-12 bg-black rounded-l-full -mr-3 border-l border-neutral-800" />
        </div>

        {/* Ticket Bottom: QR Code & Gate Credentials */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Attendee Details (7 cols) */}
          <div className="md:col-span-7 space-y-4 text-xs">
            <div>
              <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">Ticket Holder</span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                {registration.participantName}
              </h3>
              <p className="text-neutral-400 mt-0.5">{registration.participantEmail}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Admission Tier</span>
                <span className="font-bold text-white text-sm">{registration.roleTier}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Gate Pass Status</span>
                <span className={`font-bold ${isCheckedIn ? 'text-blue-400' : isPending ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isCheckedIn ? 'Checked In' : isPending ? 'Pending Review' : 'Verified & Ready'}
                </span>
              </div>
            </div>

            {registration.company && (
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Affiliation</span>
                <span className="text-neutral-300">{registration.company}</span>
              </div>
            )}

            {registration.interests && registration.interests.length > 0 && (
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">
                  Registered Interest Tracks
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {registration.interests.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[10px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-[11px] text-neutral-500">
              <span>Ticket ID: {registration.ticketId.slice(0, 16)}...</span>
            </div>
          </div>

          {/* Right: Large QR Code & Big Monospace Code (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-black border border-neutral-800 rounded-2xl text-center space-y-3">
            <div className="relative p-3 bg-white rounded-xl shadow-md">
              <QRCodeSVG
                value={qrData}
                size={170}
                level="M"
                className={isPending ? 'opacity-25 grayscale' : ''}
              />
              {isPending && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-black/80 rounded-xl text-neutral-200 text-xs">
                  <Hourglass className="w-6 h-6 text-amber-400 mb-1" />
                  <span className="font-bold text-[11px] text-amber-300">
                    Activates Once Approved
                  </span>
                </div>
              )}
            </div>

            {/* Short Ticket Code in Large Monospace */}
            <div className="space-y-1 w-full">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
                Gate Ticket Code
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-widest text-emerald-400 bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800">
                  {registration.ticketCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Copy Ticket Code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500">
              Show at entrance. Gate volunteer verifies code manually.
            </p>
          </div>
        </div>

        {/* Ticket Footer Action Buttons */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-xl border border-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Fullscreen Ticket</span>
            </button>

            <button
              onClick={handleAddToCalendar}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-xl border border-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add to Calendar (.ics)</span>
            </button>
          </div>

          <button
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="px-5 py-2 bg-white text-black hover:bg-neutral-200 font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Rendering...' : 'Download Ticket (PNG)'}</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Ticket Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center text-center space-y-4 shadow-2xl">
            <div className="w-full flex justify-end">
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <QRCodeSVG value={qrData} size={240} level="M" />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-neutral-400 uppercase font-semibold block">Ticket Code</span>
              <span className="text-3xl font-bold font-mono tracking-widest text-emerald-400">
                {registration.ticketCode}
              </span>
            </div>

            <div className="text-xs text-neutral-300">
              <h4 className="font-bold text-white">{registration.participantName}</h4>
              <p className="text-neutral-400">{event.title}</p>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
