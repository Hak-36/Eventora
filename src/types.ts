export type ActiveView =
  | 'my_events'
  | 'host_setup'
  | 'admin_dashboard'
  | 'edit_host_profile'
  | 'participant_portal'
  | 'participant_announcements'
  | 'event_detail'
  | 'apply_form'
  | 'review_application'
  | 'ticket_view'
  | 'my_tickets';

export type UserRole = 'host' | 'participant';

export type EventStatus = 'Draft' | 'Published' | 'Live' | 'Completed' | 'Cancelled';

export type EventMode = 'In-Person' | 'Online' | 'Hybrid';

export type ApprovalMode = 'Automatic' | 'Manual';

export type PriceType = 'Free' | 'Paid';

export type RegistrationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Checked in' | 'Cancelled';

export type PublicEventCategory =
  | 'Civic & Government'
  | 'Health & Wellness'
  | 'Education & Career'
  | 'Cultural & Festival'
  | 'Sports & Fitness'
  | 'Community & Social Service'
  | 'Business & Startup'
  | 'Science & Tech Outreach'
  | 'Religious & Heritage'
  | 'Entertainment';

export type CommunicationTone =
  | 'Civic & Official'
  | 'Warm & Community-First'
  | 'High-Energy & Inspiring'
  | 'Educational & Informative'
  | 'Celebratory & Festive'
  | 'Reverent & Heritage-Focused';

export type TicketTier =
  | 'VIP'
  | 'Speaker'
  | 'General'
  | 'Delegate'
  | 'Volunteer'
  | 'Athlete'
  | 'Performer'
  | 'Exhibitor'
  | string;

export type SentimentType = 'Positive' | 'Neutral' | 'Negative';

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'multiselect'
  | 'url'
  | 'date'
  | 'file';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  enabled: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  locked?: boolean;
}

export interface HostProfile {
  fullName: string;
  organization: string;
  hostType: 'Individual' | 'College' | 'Company' | 'NGO' | 'Government';
  designation: string;
  officialEmail: string;
  phone: string;
  city: string;
  state: string;
  bio: string;
  website?: string;
  avatarUrl?: string;
  isAuthorized: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  profileCompleted?: boolean;
  hostProfile?: HostProfile;
  company?: string;
  ticketTier?: TicketTier;
  avatarSeed?: string;
  registeredEventIds?: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface EventMetadata {
  id: string;
  hostId: string;
  title: string;
  category: PublicEventCategory;
  startDateTime: string;
  endDateTime: string;
  registrationDeadline?: string;
  venue: string;
  city: string;
  state: string;
  mode?: EventMode;
  meetingLink?: string;
  capacity: number;
  description: string;
  tone: CommunicationTone;
  organizerContact: string;
  organizerName: string;
  entryType: 'Free Public Entry' | 'Ticketed RSVP' | 'Registration Required' | 'Donation / Open Pass';
  priceType?: PriceType;
  price?: number;
  approvalMode?: ApprovalMode;
  ticketTiers?: string[];
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  bannerUrl?: string;
  faqs?: FAQItem[];
  registrationForm?: FormField[];
}

export type PublicEvent = EventMetadata;

export interface EventRegistration {
  ticketId: string;
  ticketCode: string;
  eventId: string;
  participantEmail: string;
  participantName: string;
  roleTier: string;
  interests: string[];
  phone?: string;
  company?: string;
  answers: Record<string, any>;
  status: RegistrationStatus;
  isCheckedIn: boolean;
  checkInTimestamp?: string;
  registeredAt: string;
  updatedAt?: string;
}

// Participant representation for hosts and attendee roster
export interface Participant {
  id: string;
  eventId: string;
  ticketId?: string;
  ticketCode?: string;
  name: string;
  email: string;
  ticketTier: TicketTier;
  isCheckedIn: boolean;
  status?: RegistrationStatus;
  company?: string;
  role?: string;
  avatarSeed?: string;
  checkInTimestamp?: string;
  categoryRole?: string;
  answers?: Record<string, any>;
  registeredAt?: string;
}

export type AnnouncementType = 'General' | 'Schedule change' | 'Reminder' | 'Urgent';

export interface Announcement {
  id: string;
  eventId: string;
  eventTitle?: string;
  eventCategory?: string;
  eventBannerUrl?: string;
  title: string;
  message: string;
  rawText?: string;
  polishedText?: string;
  type: AnnouncementType;
  tone?: CommunicationTone;
  timestamp: string;
  targetAudience: string;
  isDelivered?: boolean;
  isPinned?: boolean;
  scheduledFor?: string | null;
  organizerName?: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  readBy?: string[];
  isRead?: boolean;
}

export interface MatchProfile {
  id: string;
  eventId: string;
  name: string;
  role: string;
  company: string;
  matchScore: number;
  aiPitch: string;
  sharedInterests: string[];
  location: string;
  hasConnected?: boolean;
}

export interface FeedbackItem {
  id: string;
  eventId: string;
  authorName: string;
  ticketTier: TicketTier;
  ratings: {
    contentQuality: number;
    logisticsVenue: number;
    overallVibe: number;
  };
  comment: string;
  sentiment: SentimentType;
  sentimentScore: number;
  aiSummary: string;
  timestamp: string;
}

export interface AgendaSession {
  id: string;
  eventId: string;
  title: string;
  timeSlot: string;
  room: string;
  speaker: string;
  speakerRole: string;
  category: string;
  isBookmarked: boolean;
  isLive?: boolean;
}
