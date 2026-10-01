import {
  UserAccount,
  EventMetadata,
  Participant,
  Announcement,
  FeedbackItem,
  AgendaSession,
} from '../types';
import {
  SEED_HOST_ACCOUNT,
  SEED_PARTICIPANT_ACCOUNT,
  SEED_EVENTS,
  SEED_PARTICIPANTS,
  SEED_ANNOUNCEMENTS,
  SEED_FEEDBACKS,
  SEED_AGENDA,
} from '../mockData';

const KEYS = {
  ACCOUNTS: 'accounts',
  SESSION: 'session_user',
  EVENTS: 'events',
  PARTICIPANTS: 'participants',
  ANNOUNCEMENTS: 'announcements',
  FEEDBACKS: 'feedbacks',
  AGENDA: 'agenda',
  ACTIVE_EVENT_ID: 'active_event_id',
  READ_ANNOUNCEMENTS_PREFIX: 'read_announcements_',
  DISMISSED_URGENT_PREFIX: 'dismissed_urgent_',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error loading key "${key}" from localStorage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key "${key}" to localStorage:`, err);
  }
}

// ---------------- ACCOUNTS ----------------
export function getStoredAccounts(): UserAccount[] {
  const accounts = safeGet<UserAccount[]>(KEYS.ACCOUNTS, []);
  if (!accounts || accounts.length === 0) {
    // Seed default accounts
    const initial = [SEED_HOST_ACCOUNT, SEED_PARTICIPANT_ACCOUNT];
    safeSet(KEYS.ACCOUNTS, initial);
    return initial;
  }
  return accounts;
}

export function saveStoredAccounts(accounts: UserAccount[]): void {
  safeSet(KEYS.ACCOUNTS, accounts);
}

export function saveUserAccount(user: UserAccount): void {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex((a) => a.id === user.id || a.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...user };
  } else {
    accounts.push(user);
  }
  saveStoredAccounts(accounts);
}

// ---------------- SESSION ----------------
export function getStoredSession(): UserAccount | null {
  return safeGet<UserAccount | null>(KEYS.SESSION, null);
}

export function saveStoredSession(user: UserAccount | null): void {
  if (user === null) {
    localStorage.removeItem(KEYS.SESSION);
  } else {
    safeSet(KEYS.SESSION, user);
  }
}

// ---------------- EVENTS ----------------
export function getStoredEvents(): EventMetadata[] {
  const events = safeGet<EventMetadata[]>(KEYS.EVENTS, []);
  if (!events || events.length === 0) {
    safeSet(KEYS.EVENTS, SEED_EVENTS);
    return SEED_EVENTS;
  }
  return events;
}

export function saveStoredEvents(events: EventMetadata[]): void {
  safeSet(KEYS.EVENTS, events);
}

// ---------------- PARTICIPANTS ----------------
export function getStoredParticipants(): Participant[] {
  const participants = safeGet<Participant[]>(KEYS.PARTICIPANTS, []);
  if (!participants || participants.length === 0) {
    safeSet(KEYS.PARTICIPANTS, SEED_PARTICIPANTS);
    return SEED_PARTICIPANTS;
  }
  return participants;
}

export function saveStoredParticipants(participants: Participant[]): void {
  safeSet(KEYS.PARTICIPANTS, participants);
}

// ---------------- ANNOUNCEMENTS ----------------
export function getStoredAnnouncements(): Announcement[] {
  const announcements = safeGet<Announcement[]>(KEYS.ANNOUNCEMENTS, []);
  if (!announcements || announcements.length === 0) {
    safeSet(KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);
    return SEED_ANNOUNCEMENTS;
  }
  return announcements;
}

export function saveStoredAnnouncements(announcements: Announcement[]): void {
  safeSet(KEYS.ANNOUNCEMENTS, announcements);
}

export function getStoredReadAnnouncements(email: string): string[] {
  if (!email) return [];
  return safeGet<string[]>(`${KEYS.READ_ANNOUNCEMENTS_PREFIX}${email.toLowerCase()}`, []);
}

export function saveStoredReadAnnouncements(email: string, ids: string[]): void {
  if (!email) return;
  safeSet(`${KEYS.READ_ANNOUNCEMENTS_PREFIX}${email.toLowerCase()}`, ids);
}

export function getDismissedUrgentIds(email: string): string[] {
  if (!email) return [];
  return safeGet<string[]>(`${KEYS.DISMISSED_URGENT_PREFIX}${email.toLowerCase()}`, []);
}

export function saveDismissedUrgentIds(email: string, ids: string[]): void {
  if (!email) return;
  safeSet(`${KEYS.DISMISSED_URGENT_PREFIX}${email.toLowerCase()}`, ids);
}

// ---------------- FEEDBACKS ----------------
export function getStoredFeedbacks(): FeedbackItem[] {
  const feedbacks = safeGet<FeedbackItem[]>(KEYS.FEEDBACKS, []);
  if (!feedbacks || feedbacks.length === 0) {
    safeSet(KEYS.FEEDBACKS, SEED_FEEDBACKS);
    return SEED_FEEDBACKS;
  }
  return feedbacks;
}

export function saveStoredFeedbacks(feedbacks: FeedbackItem[]): void {
  safeSet(KEYS.FEEDBACKS, feedbacks);
}

// ---------------- AGENDA ----------------
export function getStoredAgenda(): AgendaSession[] {
  const agenda = safeGet<AgendaSession[]>(KEYS.AGENDA, []);
  if (!agenda || agenda.length === 0) {
    safeSet(KEYS.AGENDA, SEED_AGENDA);
    return SEED_AGENDA;
  }
  return agenda;
}

export function saveStoredAgenda(agenda: AgendaSession[]): void {
  safeSet(KEYS.AGENDA, agenda);
}

// ---------------- ACTIVE EVENT ID ----------------
export function getStoredActiveEventId(): string | null {
  try {
    return localStorage.getItem(KEYS.ACTIVE_EVENT_ID);
  } catch {
    return null;
  }
}

export function saveStoredActiveEventId(eventId: string | null): void {
  try {
    if (!eventId) {
      localStorage.removeItem(KEYS.ACTIVE_EVENT_ID);
    } else {
      localStorage.setItem(KEYS.ACTIVE_EVENT_ID, eventId);
    }
  } catch (err) {
    console.error('Error saving activeEventId to localStorage:', err);
  }
}

// ---------------- RESET DEMO DATA ----------------
export function resetDemoData(): void {
  try {
    safeSet(KEYS.ACCOUNTS, [SEED_HOST_ACCOUNT, SEED_PARTICIPANT_ACCOUNT]);
    safeSet(KEYS.EVENTS, SEED_EVENTS);
    safeSet(KEYS.PARTICIPANTS, SEED_PARTICIPANTS);
    safeSet(KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);
    safeSet(KEYS.FEEDBACKS, SEED_FEEDBACKS);
    safeSet(KEYS.AGENDA, SEED_AGENDA);
    safeSet(KEYS.ACTIVE_EVENT_ID, SEED_EVENTS[0].id);
  } catch (err) {
    console.error('Error resetting demo data:', err);
  }
}
