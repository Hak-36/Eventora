import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  FileText,
  Tag,
  Building,
  Radio,
  Sliders,
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  EventMetadata,
  PublicEventCategory,
  CommunicationTone,
  EventStatus,
  UserAccount
} from '../types';
import { CATEGORY_METADATA } from '../mockData';

interface HostSetupViewProps {
  currentUser: UserAccount;
  eventToEdit?: EventMetadata | null;
  onSaveEvent: (event: EventMetadata) => void;
  onCancel?: () => void;
  welcomeMessage?: string;
}

const CATEGORIES: PublicEventCategory[] = [
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

const COMMUNICATION_TONES: CommunicationTone[] = [
  'Civic & Official',
  'Warm & Community-First',
  'High-Energy & Inspiring',
  'Educational & Informative',
  'Celebratory & Festive',
  'Reverent & Heritage-Focused',
];

export const HostSetupView: React.FC<HostSetupViewProps> = ({
  currentUser,
  eventToEdit,
  onSaveEvent,
  onCancel,
  welcomeMessage,
}) => {
  const isEditMode = Boolean(eventToEdit);

  // Form states
  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [category, setCategory] = useState<PublicEventCategory>(
    eventToEdit?.category || 'Civic & Government'
  );
  const [description, setDescription] = useState(eventToEdit?.description || '');
  const [startDateTime, setStartDateTime] = useState(
    eventToEdit?.startDateTime || '2026-10-20T09:00'
  );
  const [endDateTime, setEndDateTime] = useState(
    eventToEdit?.endDateTime || '2026-10-20T17:00'
  );
  const [venue, setVenue] = useState(eventToEdit?.venue || '');
  const [city, setCity] = useState(eventToEdit?.city || currentUser.hostProfile?.city || '');
  const [state, setState] = useState(eventToEdit?.state || currentUser.hostProfile?.state || '');
  const [capacity, setCapacity] = useState<number>(eventToEdit?.capacity || 200);
  const [organizerName, setOrganizerName] = useState(
    eventToEdit?.organizerName || currentUser.hostProfile?.organization || currentUser.name || ''
  );
  const [organizerContact, setOrganizerContact] = useState(
    eventToEdit?.organizerContact || currentUser.hostProfile?.officialEmail || currentUser.email || ''
  );
  const [entryType, setEntryType] = useState<EventMetadata['entryType']>(
    eventToEdit?.entryType || 'Free Public Entry'
  );
  const [tone, setTone] = useState<CommunicationTone>(
    eventToEdit?.tone || 'Civic & Official'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Reset or initialize if eventToEdit changes
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setCategory(eventToEdit.category);
      setDescription(eventToEdit.description);
      setStartDateTime(eventToEdit.startDateTime);
      setEndDateTime(eventToEdit.endDateTime);
      setVenue(eventToEdit.venue);
      setCity(eventToEdit.city);
      setState(eventToEdit.state);
      setCapacity(eventToEdit.capacity);
      setOrganizerName(eventToEdit.organizerName);
      setOrganizerContact(eventToEdit.organizerContact);
      setEntryType(eventToEdit.entryType);
      setTone(eventToEdit.tone);
    }
  }, [eventToEdit]);

  const handleSelectCategory = (cat: PublicEventCategory) => {
    setCategory(cat);
    const meta = CATEGORY_METADATA[cat];
    setTone(meta.defaultTone);
    if (!description || description === CATEGORY_METADATA[category]?.description) {
      setDescription(meta.description);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Event title is required';
    if (!description.trim()) newErrors.description = 'Event description is required';

    if (!startDateTime) newErrors.startDateTime = 'Start date and time is required';
    if (!endDateTime) newErrors.endDateTime = 'End date and time is required';

    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime).getTime();
      const end = new Date(endDateTime).getTime();
      if (isNaN(start) || isNaN(end)) {
        newErrors.endDateTime = 'Invalid date format';
      } else if (end <= start) {
        newErrors.endDateTime = 'End date and time must be after the start date and time';
      }
    }

    if (!venue.trim()) newErrors.venue = 'Venue or location is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State is required';

    if (!capacity || capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }

    if (!organizerContact.trim()) {
      newErrors.organizerContact = 'Organizer contact email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(organizerContact.trim())) {
        newErrors.organizerContact = 'Enter a valid organizer contact email';
      }
    }

    if (!organizerName.trim()) {
      newErrors.organizerName = 'Organizer name or organization is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (targetStatus: EventStatus) => {
    if (!validate()) return;

    const now = new Date().toISOString();
    const updatedEvent: EventMetadata = {
      id: eventToEdit ? eventToEdit.id : `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      hostId: currentUser.id,
      title: title.trim(),
      category,
      description: description.trim(),
      startDateTime,
      endDateTime,
      venue: venue.trim(),
      city: city.trim(),
      state: state.trim(),
      capacity: Number(capacity),
      tone,
      organizerName: organizerName.trim(),
      organizerContact: organizerContact.trim(),
      entryType,
      status: targetStatus,
      createdAt: eventToEdit ? eventToEdit.createdAt : now,
      updatedAt: now,
    };

    setSaveSuccessMsg(`Event saved successfully as ${targetStatus}!`);
    setTimeout(() => {
      onSaveEvent(updatedEvent);
    }, 400);
  };

  const activeMeta = CATEGORY_METADATA[category] || CATEGORY_METADATA['Civic & Government'];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 select-none">
      {/* Welcome Message if first time */}
      {welcomeMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-white font-accent tracking-wide">Welcome, {currentUser.name}!</h3>
            <p className="mt-0.5">{welcomeMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-neutral-400 text-xs uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>{isEditMode ? 'Modify Event Configuration' : 'Create Public Event'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isEditMode ? `Edit: ${eventToEdit?.title}` : 'Create New Public Event'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Configure your event schedule, category domain, venue location, attendee capacity, and broadcast tone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wider ${activeMeta.badgeClass}`}
          >
            {category}
          </span>
          {eventToEdit && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
              Current: {eventToEdit.status}
            </span>
          )}
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 10 Category Quick Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-neutral-400" />
          <span>Event Category (10 Public Domains)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            const meta = CATEGORY_METADATA[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${meta.bgClass} ${meta.borderClass} text-white font-bold`
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <span className="line-clamp-2">{cat}</span>
                {isSelected && (
                  <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs">
        {/* Event Title */}
        <div>
          <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2">
            Event Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            className={`w-full px-4 py-2.5 bg-black border rounded-xl text-white text-sm focus:outline-none ${
              errors.title ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
            }`}
            placeholder="e.g. Metro Civic Town Hall: Transit & Urban Sustainability 2026"
          />
          {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title}</p>}
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Start Date & Time</span> <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => {
                setStartDateTime(e.target.value);
                if (errors.startDateTime) setErrors({ ...errors, startDateTime: '' });
              }}
              className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-200 focus:outline-none ${
                errors.startDateTime ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
              }`}
            />
            {errors.startDateTime && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.startDateTime}</p>
            )}
          </div>

          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>End Date & Time</span> <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => {
                setEndDateTime(e.target.value);
                if (errors.endDateTime) setErrors({ ...errors, endDateTime: '' });
              }}
              className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-200 focus:outline-none ${
                errors.endDateTime ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
              }`}
            />
            {errors.endDateTime && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.endDateTime}</p>
            )}
          </div>
        </div>

        {/* Venue, City, State */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              <span>Venue / Location</span> <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => {
                setVenue(e.target.value);
                if (errors.venue) setErrors({ ...errors, venue: '' });
              }}
              className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-200 focus:outline-none ${
                errors.venue ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
              }`}
              placeholder="e.g. City Council Chamber"
            />
            {errors.venue && <p className="text-[11px] text-rose-400 mt-1">{errors.venue}</p>}
          </div>

          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2">
              City <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (errors.city) setErrors({ ...errors, city: '' });
              }}
              className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-200 focus:outline-none ${
                errors.city ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
              }`}
              placeholder="e.g. San Francisco"
            />
            {errors.city && <p className="text-[11px] text-rose-400 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2">
              State / Region <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                if (errors.state) setErrors({ ...errors, state: '' });
              }}
              className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-200 focus:outline-none ${
                errors.state ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
              }`}
              placeholder="e.g. CA"
            />
            {errors.state && <p className="text-[11px] text-rose-400 mt-1">{errors.state}</p>}
          </div>
        </div>

        {/* Capacity, Entry Type, Tone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span>Attendee Capacity</span> <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => {
                setCapacity(parseInt(e.target.value) || 0);
                if (errors.capacity) setErrors({ ...errors, capacity: '' });
              }}
              className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-200 focus:outline-none ${
                errors.capacity ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
              }`}
            />
            {errors.capacity && <p className="text-[11px] text-rose-400 mt-1">{errors.capacity}</p>}
          </div>

          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-neutral-400" />
              <span>Entry / Admission</span>
            </label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as any)}
              className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="Free Public Entry">Free Public Entry</option>
              <option value="Registration Required">Registration Required</option>
              <option value="Ticketed RSVP">Ticketed RSVP</option>
              <option value="Donation / Open Pass">Donation / Open Pass</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-neutral-400" />
              <span>Announcement Tone</span>
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as CommunicationTone)}
              className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none cursor-pointer"
            >
              {COMMUNICATION_TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Organizer Name & Organizer Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2">
              Organizer Entity Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={organizerName}
              onChange={(e) => {
                setOrganizerName(e.target.value);
                if (errors.organizerName) setErrors({ ...errors, organizerName: '' });
              }}
              className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-200 focus:outline-none ${
                errors.organizerName ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
              }`}
              placeholder="e.g. Metropolitan Civic Board"
            />
            {errors.organizerName && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.organizerName}</p>
            )}
          </div>

          <div>
            <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2">
              Organizer Contact Email <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              value={organizerContact}
              onChange={(e) => {
                setOrganizerContact(e.target.value);
                if (errors.organizerContact) setErrors({ ...errors, organizerContact: '' });
              }}
              className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-200 focus:outline-none ${
                errors.organizerContact ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
              }`}
              placeholder="e.g. organizer@cityevents.org"
            />
            {errors.organizerContact && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.organizerContact}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>Event Description & Purpose</span> <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-200 focus:outline-none leading-relaxed ${
              errors.description ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
            }`}
            placeholder="Describe the scope, objectives, audience expectations, and logistics for this event..."
          />
          {errors.description && (
            <p className="text-[11px] text-rose-400 mt-1">{errors.description}</p>
          )}
        </div>

        {/* Action Buttons: Save as Draft vs Publish */}
        <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave('Draft')}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700 font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave(eventToEdit?.status === 'Live' ? 'Live' : 'Published')}
            className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <span>{isEditMode ? 'Update & Publish' : 'Publish Event'}</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
