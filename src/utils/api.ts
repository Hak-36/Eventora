import { EventRegistration, Announcement } from '../types';
import { suggestInterests as localSuggestInterests } from './formDefaults';

const API_BASE = '/api';

export async function submitRegistrationToServer(
  eventId: string,
  participantData: {
    name: string;
    email: string;
    roleTier: string;
    interests: string[];
    phone?: string;
    company?: string;
    answers: Record<string, any>;
  }
): Promise<EventRegistration> {
  const res = await fetch(`${API_BASE}/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId,
      participant: participantData,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit registration. Please try again.');
  }

  return data as EventRegistration;
}

export async function fetchParticipantTickets(email: string): Promise<EventRegistration[]> {
  try {
    const res = await fetch(`${API_BASE}/participants/${encodeURIComponent(email)}/tickets`);
    if (!res.ok) {
      throw new Error('Failed to fetch tickets');
    }
    return (await res.json()) as EventRegistration[];
  } catch (err) {
    console.warn('API fetchParticipantTickets fallback to cache/offline:', err);
    return [];
  }
}

export async function fetchEventParticipants(eventId: string): Promise<EventRegistration[]> {
  try {
    const res = await fetch(`${API_BASE}/events/${encodeURIComponent(eventId)}/participants`);
    if (!res.ok) {
      throw new Error('Failed to fetch event participants');
    }
    return (await res.json()) as EventRegistration[];
  } catch (err) {
    console.warn('API fetchEventParticipants fallback to cache/offline:', err);
    return [];
  }
}

export async function updateRegistrationAnswersOnServer(
  ticketId: string,
  updates: {
    participantName?: string;
    roleTier?: string;
    interests?: string[];
    phone?: string;
    company?: string;
    answers?: Record<string, any>;
  }
): Promise<EventRegistration> {
  const res = await fetch(`${API_BASE}/registrations/${encodeURIComponent(ticketId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update registration answers');
  }

  return data as EventRegistration;
}

export async function cancelRegistrationOnServer(ticketId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/registrations/${encodeURIComponent(ticketId)}`, {
    method: 'DELETE',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to cancel registration');
  }

  return data;
}

export async function updateRegistrationStatusOnServer(
  ticketId: string,
  status: string,
  isCheckedIn?: boolean
): Promise<EventRegistration> {
  const res = await fetch(`${API_BASE}/registrations/${encodeURIComponent(ticketId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, isCheckedIn }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update registration status');
  }

  return data as EventRegistration;
}

export async function getSuggestedInterests(text: string, categories: string[]): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/ai/suggest-interests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, categories }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.interests) && data.interests.length > 0) {
        return data.interests;
      }
    }
  } catch {
    // Fall back seamlessly to isolated local function
  }
  return localSuggestInterests(text, categories);
}

// ---------------- ANNOUNCEMENTS API ----------------

export async function fetchParticipantAnnouncements(
  email: string,
  since?: number
): Promise<{ announcements: Announcement[]; isOffline: boolean }> {
  try {
    const url = since
      ? `${API_BASE}/participants/${encodeURIComponent(email)}/announcements?since=${since}`
      : `${API_BASE}/participants/${encodeURIComponent(email)}/announcements`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return { announcements: data as Announcement[], isOffline: false };
  } catch (err) {
    console.warn('API fetchParticipantAnnouncements offline, falling back to cache:', err);
    return { announcements: [], isOffline: true };
  }
}

export async function createAnnouncementOnServer(
  eventId: string,
  payload: {
    title: string;
    message: string;
    rawText?: string;
    polishedText?: string;
    type?: string;
    tone?: string;
    targetAudience?: string;
    isPinned?: boolean;
    scheduledFor?: string | null;
    organizerName?: string;
  }
): Promise<Announcement> {
  const res = await fetch(`${API_BASE}/events/${encodeURIComponent(eventId)}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to dispatch announcement to attendees.');
  }

  return data as Announcement;
}

export async function updateAnnouncementOnServer(
  id: string,
  updates: Partial<Announcement>
): Promise<Announcement> {
  const res = await fetch(`${API_BASE}/announcements/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update announcement.');
  }

  return data as Announcement;
}

export async function deleteAnnouncementOnServer(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/announcements/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete announcement.');
  }

  return true;
}

export async function markAnnouncementAsReadOnServer(email: string, id: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/participants/${encodeURIComponent(email)}/announcements/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      return data.readAnnouncementIds || [];
    }
  } catch (err) {
    console.warn('Failed to sync read state to server:', err);
  }
  return [];
}

export async function markAllAnnouncementsAsReadOnServer(email: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/participants/${encodeURIComponent(email)}/announcements/read-all`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      return data.readAnnouncementIds || [];
    }
  } catch (err) {
    console.warn('Failed to sync mark-all-read to server:', err);
  }
  return [];
}

export async function fetchEventAnnouncements(eventId: string): Promise<Announcement[]> {
  try {
    const res = await fetch(`${API_BASE}/events/${encodeURIComponent(eventId)}/announcements`);
    if (!res.ok) throw new Error('Failed to fetch announcements');
    return (await res.json()) as Announcement[];
  } catch (err) {
    console.warn('fetchEventAnnouncements fallback:', err);
    return [];
  }
}

