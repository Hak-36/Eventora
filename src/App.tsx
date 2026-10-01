/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ActiveView,
  EventMetadata,
  EventStatus,
  Participant,
  Announcement,
  FeedbackItem,
  AgendaSession,
  TicketTier,
  UserAccount,
  EventRegistration,
  RegistrationStatus,
} from './types';
import {
  getStoredSession,
  saveStoredSession,
  getStoredEvents,
  saveStoredEvents,
  getStoredParticipants,
  saveStoredParticipants,
  getStoredAnnouncements,
  saveStoredAnnouncements,
  getStoredFeedbacks,
  saveStoredFeedbacks,
  getStoredAgenda,
  saveStoredAgenda,
  getStoredActiveEventId,
  saveStoredActiveEventId,
  saveUserAccount,
  resetDemoData,
} from './utils/storage';
import {
  submitRegistrationToServer,
  fetchParticipantTickets,
  fetchEventParticipants,
  cancelRegistrationOnServer,
  updateRegistrationStatusOnServer,
} from './utils/api';
import { Sidebar } from './components/Sidebar';
import { HostSetupView } from './components/HostSetupView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ParticipantPortalView } from './components/ParticipantPortalView';
import { EventDetailView } from './components/EventDetailView';
import { DynamicApplicationForm } from './components/DynamicApplicationForm';
import { ReviewApplicationView } from './components/ReviewApplicationView';
import { CinemaTicketView } from './components/CinemaTicketView';
import { MyTicketsView } from './components/MyTicketsView';
import { MyEventsHub } from './components/MyEventsHub';
import { HostProfileModal } from './components/HostProfileModal';
import { QRScannerModal } from './components/QRScannerModal';
import { AuthPortal } from './components/AuthPortal';
import {
  Menu,
  LogOut,
  Plus,
  Ticket,
  Compass,
} from 'lucide-react';

export default function App() {
  // Session starts at null unless already persisted in localStorage
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getStoredSession());

  // Global datasets from storage
  const [events, setEvents] = useState<EventMetadata[]>(() => getStoredEvents());
  const [participants, setParticipants] = useState<Participant[]>(() => getStoredParticipants());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => getStoredAnnouncements());
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => getStoredFeedbacks());
  const [agenda, setAgenda] = useState<AgendaSession[]>(() => getStoredAgenda());

  // Active event ID
  const [activeEventId, setActiveEventId] = useState<string | null>(() => getStoredActiveEventId());

  // Event to edit in HostSetupView
  const [eventToEdit, setEventToEdit] = useState<EventMetadata | null>(null);

  // Welcome message for first-time event creation
  const [welcomeMessage, setWelcomeMessage] = useState<string | undefined>(undefined);

  // View state
  const [activeView, setActiveView] = useState<ActiveView>('my_events');

  // Modals state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Participant flow states
  const [selectedEvent, setSelectedEvent] = useState<EventMetadata | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<EventRegistration | null>(null);
  const [isNewlyRegistered, setIsNewlyRegistered] = useState(false);
  const [applicationData, setApplicationData] = useState<{
    participantName: string;
    participantEmail: string;
    roleTier: string;
    interests: string[];
    phone?: string;
    company?: string;
    answers: Record<string, any>;
  } | null>(null);
  const [registrationServerError, setRegistrationServerError] = useState<string | null>(null);

  // Tickets cache for participants
  const [userTickets, setUserTickets] = useState<EventRegistration[]>(() => {
    try {
      const session = getStoredSession();
      if (session?.email) {
        const cached = localStorage.getItem(`participant_tickets_${session.email.toLowerCase()}`);
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });

  // Pending event if user is redirected to login first
  const [pendingEventAfterLogin, setPendingEventAfterLogin] = useState<EventMetadata | null>(null);

  // Sync state to localStorage whenever modified
  useEffect(() => {
    saveStoredEvents(events);
  }, [events]);

  useEffect(() => {
    saveStoredParticipants(participants);
  }, [participants]);

  useEffect(() => {
    saveStoredAnnouncements(announcements);
  }, [announcements]);

  useEffect(() => {
    saveStoredFeedbacks(feedbacks);
  }, [feedbacks]);

  useEffect(() => {
    saveStoredAgenda(agenda);
  }, [agenda]);

  useEffect(() => {
    saveStoredActiveEventId(activeEventId);
  }, [activeEventId]);

  // Role Routing Guard
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === 'participant') {
      const allowedParticipantViews: ActiveView[] = [
        'participant_portal',
        'event_detail',
        'apply_form',
        'review_application',
        'ticket_view',
        'my_tickets',
      ];
      if (!allowedParticipantViews.includes(activeView)) {
        setActiveView('participant_portal');
      }
    } else if (currentUser.role === 'host') {
      const allowedHostViews: ActiveView[] = [
        'my_events',
        'host_setup',
        'admin_dashboard',
        'edit_host_profile',
      ];
      if (!allowedHostViews.includes(activeView)) {
        setActiveView('my_events');
      }
    }
  }, [currentUser, activeView]);

  // 5-second polling for live status synchronisation between host and attendees
  useEffect(() => {
    let isMounted = true;

    const syncData = async () => {
      // 1. If participant is logged in, refresh ticket statuses from server
      if (currentUser?.role === 'participant' && currentUser.email) {
        try {
          const tickets = await fetchParticipantTickets(currentUser.email);
          if (isMounted && tickets) {
            setUserTickets(tickets);
            try {
              localStorage.setItem(
                `participant_tickets_${currentUser.email.toLowerCase()}`,
                JSON.stringify(tickets)
              );
            } catch {}
          }
        } catch {}
      }

      // 2. If host has an active event open, sync registrations list from server
      if (currentUser?.role === 'host' && activeEventId) {
        try {
          const serverParts = await fetchEventParticipants(activeEventId);
          if (isMounted && serverParts && serverParts.length > 0) {
            setParticipants((prev) => {
              const otherEventsParts = prev.filter((p) => p.eventId !== activeEventId);
              const mappedServerParts: Participant[] = serverParts.map((sp) => ({
                id: sp.ticketId || `p_${sp.ticketCode}`,
                eventId: sp.eventId,
                ticketId: sp.ticketId,
                ticketCode: sp.ticketCode,
                name: sp.participantName,
                email: sp.participantEmail,
                ticketTier: sp.roleTier,
                isCheckedIn: sp.isCheckedIn,
                status: sp.status,
                company: sp.company,
                checkInTimestamp: sp.checkInTimestamp,
                answers: sp.answers,
                registeredAt: sp.registeredAt,
                avatarSeed: sp.participantName.slice(0, 2).toUpperCase(),
              }));
              return [...mappedServerParts, ...otherEventsParts];
            });
          }
        } catch {}
      }
    };

    syncData();
    const interval = setInterval(syncData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser, activeEventId]);

  // Compute host's events
  const hostEvents = currentUser && currentUser.role === 'host'
    ? events.filter((e) => e.hostId === currentUser.id)
    : [];

  // Active event for host (must belong to host)
  const currentHostEvent: EventMetadata | null =
    hostEvents.find((e) => e.id === activeEventId) || hostEvents[0] || null;

  // Published/Live events for participants
  const publishedEvents = events.filter((e) => e.status === 'Published' || e.status === 'Live');

  // ROUTE POST-LOGIN FOR HOST
  const routeHostPostLogin = (user: UserAccount) => {
    const userEvents = events.filter((e) => e.hostId === user.id);
    if (userEvents.length === 0) {
      setEventToEdit(null);
      setWelcomeMessage("Welcome to Eventora! Let's create your first public event.");
      setActiveView('host_setup');
    } else if (userEvents.length === 1) {
      setActiveEventId(userEvents[0].id);
      setActiveView('admin_dashboard');
    } else {
      setActiveEventId(userEvents[0].id);
      setActiveView('my_events');
    }
  };

  // User Login Handler
  const handleUserLogin = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'host') {
      if (user.profileCompleted) {
        routeHostPostLogin(user);
      }
    } else {
      if (pendingEventAfterLogin) {
        setSelectedEvent(pendingEventAfterLogin);
        setPendingEventAfterLogin(null);
        setActiveView('event_detail');
      } else {
        setActiveView('participant_portal');
      }
    }
  };

  // Logout Handler
  const handleLogout = () => {
    saveStoredSession(null);
    setCurrentUser(null);
    setActiveEventId(null);
    setEventToEdit(null);
    setSelectedEvent(null);
    setSelectedTicket(null);
    setPendingEventAfterLogin(null);
    setActiveView('my_events');
  };

  // Save Mandatory / Edited Host Profile
  const handleSaveHostProfile = (updatedUser: UserAccount) => {
    saveUserAccount(updatedUser);
    saveStoredSession(updatedUser);
    setCurrentUser(updatedUser);

    if (activeView === 'edit_host_profile') {
      setActiveView('my_events');
    } else {
      routeHostPostLogin(updatedUser);
    }
  };

  // Switch Event (Host)
  const handleSelectEvent = (eventId: string) => {
    setActiveEventId(eventId);
  };

  // Go to My Events Hub
  const handleGoToMyEvents = () => {
    setEventToEdit(null);
    setActiveView('my_events');
  };

  // Open Create Event Form
  const handleOpenCreateEvent = () => {
    setEventToEdit(null);
    setWelcomeMessage(undefined);
    setActiveView('host_setup');
  };

  // Open Edit Event Form
  const handleOpenEditEvent = (eventId: string) => {
    const evt = events.find((e) => e.id === eventId);
    if (evt && currentUser && evt.hostId === currentUser.id) {
      setEventToEdit(evt);
      setActiveEventId(evt.id);
      setActiveView('host_setup');
    }
  };

  // Open Event Dashboard
  const handleOpenDashboard = (eventId: string) => {
    setActiveEventId(eventId);
    setActiveView('admin_dashboard');
  };

  // Save / Update Event
  const handleSaveEvent = (savedEvent: EventMetadata) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === savedEvent.id);
      if (exists) {
        return prev.map((e) => (e.id === savedEvent.id ? savedEvent : e));
      }
      return [savedEvent, ...prev];
    });

    setActiveEventId(savedEvent.id);
    setEventToEdit(null);
    setActiveView('admin_dashboard');
  };

  // Duplicate Event
  const handleDuplicateEvent = (eventId: string) => {
    const original = events.find((e) => e.id === eventId);
    if (!original || !currentUser) return;

    const copy: EventMetadata = {
      ...original,
      id: `evt_${Date.now()}_copy`,
      hostId: currentUser.id,
      title: `Copy of ${original.title}`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEvents((prev) => [copy, ...prev]);
  };

  // Cancel Event
  const handleCancelEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: 'Cancelled', updatedAt: new Date().toISOString() } : e))
    );
  };

  // Delete Event and its scoped entities
  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setParticipants((prev) => prev.filter((p) => p.eventId !== eventId));
    setAnnouncements((prev) => prev.filter((a) => a.eventId !== eventId));
    setFeedbacks((prev) => prev.filter((f) => f.eventId !== eventId));
    setAgenda((prev) => prev.filter((s) => s.eventId !== eventId));

    if (activeEventId === eventId) {
      const remaining = hostEvents.filter((e) => e.id !== eventId);
      setActiveEventId(remaining[0]?.id || null);
    }
  };

  // Update Event Status
  const handleUpdateStatus = (eventId: string, newStatus: EventStatus) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: newStatus, updatedAt: new Date().toISOString() } : e))
    );
  };

  // Toggle Check-In for attendee (Host action)
  const handleToggleCheckIn = async (participantId: string) => {
    const currentPart = participants.find((p) => p.id === participantId);
    if (!currentPart) return;

    const nextChecked = !currentPart.isCheckedIn;
    const checkInTime = nextChecked
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? {
              ...p,
              isCheckedIn: nextChecked,
              status: nextChecked ? 'Checked in' : (p.status || 'Approved'),
              checkInTimestamp: checkInTime,
            }
          : p
      )
    );

    const ticketId = currentPart.ticketId || currentPart.id;
    try {
      await updateRegistrationStatusOnServer(
        ticketId,
        nextChecked ? 'Checked in' : (currentPart.status || 'Approved'),
        nextChecked
      );
    } catch {}
  };

  // Update Participant Status (Manual Approval/Rejection by Host)
  const handleUpdateParticipantStatus = async (participantId: string, status: RegistrationStatus) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, status } : p))
    );

    const part = participants.find((p) => p.id === participantId);
    if (part) {
      const ticketId = part.ticketId || part.id;
      try {
        await updateRegistrationStatusOnServer(ticketId, status);
      } catch {}
    }
  };

  // Host Add Participant
  const handleAddParticipant = (newParticipantData: Omit<Participant, 'id' | 'eventId'>) => {
    if (!currentHostEvent) return;

    const newParticipant: Participant = {
      ...newParticipantData,
      id: `part_${Date.now()}`,
      eventId: currentHostEvent.id,
      ticketCode: `EVP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'Approved',
      isCheckedIn: false,
    };

    setParticipants((prev) => [newParticipant, ...prev]);
  };

  // Host Broadcast Announcement
  const handleBroadcastAnnouncement = (newAnnouncementData: Omit<Announcement, 'id' | 'eventId'>) => {
    if (!currentHostEvent) return;

    const newAnnouncement: Announcement = {
      ...newAnnouncementData,
      id: `ann_${Date.now()}`,
      eventId: currentHostEvent.id,
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);
  };

  // Participant Discovery -> Open Event Detail
  const handleOpenEventDetail = (event: EventMetadata) => {
    setSelectedEvent(event);
    setActiveView('event_detail');
  };

  // Participant Apply -> Open Dynamic Form
  const handleStartApply = (event: EventMetadata) => {
    setSelectedEvent(event);
    setRegistrationServerError(null);
    setActiveView('apply_form');
  };

  // Participant Proceed from Form to Review Screen
  const handleProceedToReview = (data: {
    participantName: string;
    participantEmail: string;
    roleTier: string;
    interests: string[];
    phone?: string;
    company?: string;
    answers: Record<string, any>;
  }) => {
    setApplicationData(data);
    setRegistrationServerError(null);
    setActiveView('review_application');
  };

  // Participant Edit from Review Screen
  const handleBackToForm = () => {
    setActiveView('apply_form');
  };

  // Participant Confirm Registration -> Submit to Server
  const handleConfirmRegistration = async () => {
    if (!selectedEvent || !applicationData) return;
    setRegistrationServerError(null);

    const newTicket = await submitRegistrationToServer(selectedEvent.id, {
      name: applicationData.participantName,
      email: applicationData.participantEmail,
      roleTier: applicationData.roleTier,
      interests: applicationData.interests,
      phone: applicationData.phone,
      company: applicationData.company,
      answers: applicationData.answers,
    });

    // Update tickets list and cache
    setUserTickets((prev) => [newTicket, ...prev.filter((t) => t.ticketId !== newTicket.ticketId)]);
    try {
      const updatedList = [newTicket, ...userTickets.filter((t) => t.ticketId !== newTicket.ticketId)];
      localStorage.setItem(`participant_tickets_${currentUser!.email.toLowerCase()}`, JSON.stringify(updatedList));
      localStorage.removeItem(`draft_answers_${selectedEvent.id}_${currentUser!.email.toLowerCase()}`);
    } catch {}

    // Add to participants list for immediate UI reactivity
    const newParticipantItem: Participant = {
      id: newTicket.ticketId,
      ticketId: newTicket.ticketId,
      ticketCode: newTicket.ticketCode,
      eventId: selectedEvent.id,
      name: newTicket.participantName,
      email: newTicket.participantEmail,
      ticketTier: newTicket.roleTier,
      isCheckedIn: false,
      status: newTicket.status,
      company: newTicket.company,
      answers: newTicket.answers,
      registeredAt: newTicket.registeredAt,
      avatarSeed: newTicket.participantName.slice(0, 2).toUpperCase(),
    };
    setParticipants((prev) => [newParticipantItem, ...prev]);

    setSelectedTicket(newTicket);
    setIsNewlyRegistered(true);
    setActiveView('ticket_view');
  };

  // View Ticket (from detail, confirmation, or my_tickets)
  const handleViewTicket = (ticket: EventRegistration) => {
    setSelectedTicket(ticket);
    const evt = events.find((e) => e.id === ticket.eventId) || null;
    if (evt) setSelectedEvent(evt);
    setIsNewlyRegistered(false);
    setActiveView('ticket_view');
  };

  // Open My Tickets Hub
  const handleOpenMyTickets = () => {
    setActiveView('my_tickets');
  };

  // Edit Ticket Answers (before deadline and before check-in)
  const handleEditTicketDetails = (ticket: EventRegistration) => {
    const evt = events.find((e) => e.id === ticket.eventId) || null;
    if (evt) setSelectedEvent(evt);
    setSelectedTicket(ticket);
    setApplicationData({
      participantName: ticket.participantName,
      participantEmail: ticket.participantEmail,
      roleTier: ticket.roleTier,
      interests: ticket.interests,
      phone: ticket.phone,
      company: ticket.company,
      answers: ticket.answers,
    });
    setActiveView('apply_form');
  };

  // Cancel Registration
  const handleCancelRegistration = async (ticketId: string) => {
    await cancelRegistrationOnServer(ticketId);
    setUserTickets((prev) => prev.filter((t) => t.ticketId !== ticketId));
    setParticipants((prev) => prev.filter((p) => p.ticketId !== ticketId && p.id !== ticketId));
    if (selectedTicket?.ticketId === ticketId) {
      setSelectedTicket(null);
    }
  };

  // Require Login handler for unauthenticated participants
  const handleRequireLogin = () => {
    if (selectedEvent) {
      setPendingEventAfterLogin(selectedEvent);
    }
    setCurrentUser(null);
  };

  // Reset Demo Data
  const handleResetDemo = () => {
    resetDemoData();
    setEvents(getStoredEvents());
    setParticipants(getStoredParticipants());
    setAnnouncements(getStoredAnnouncements());
    setFeedbacks(getStoredFeedbacks());
    setAgenda(getStoredAgenda());
    const resetEvents = getStoredEvents();
    setActiveEventId(resetEvents[0]?.id || null);
  };

  // 1. If not logged in, render AuthPortal
  if (!currentUser) {
    return <AuthPortal onLogin={handleUserLogin} />;
  }

  // 2. Mandatory Host Profile check
  if (currentUser.role === 'host' && !currentUser.profileCompleted) {
    return (
      <HostProfileModal
        isMandatory={true}
        currentUser={currentUser}
        onSave={handleSaveHostProfile}
      />
    );
  }

  const isHost = currentUser.role === 'host';
  const activeUserTickets = userTickets.filter((t) => t.status !== 'Cancelled');

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col antialiased selection:bg-neutral-800 selection:text-white">
      {/* Top Universal App Navigation Bar */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-neutral-800 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Left: Menu Drawer & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 text-neutral-300" />
              <span className="text-xs font-semibold hidden sm:inline">Menu</span>
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white font-extrabold tracking-wider text-sm">Eventora</span>
              <span className="text-neutral-600">/</span>

              {isHost ? (
                <>
                  <span className="text-neutral-400 hidden sm:inline">
                    {activeView === 'my_events'
                      ? 'My Events'
                      : activeView === 'host_setup'
                      ? 'Event Setup'
                      : 'Dashboard'}
                  </span>
                  {currentHostEvent && activeView === 'admin_dashboard' && (
                    <>
                      <span className="text-neutral-600 hidden sm:inline">/</span>
                      <span className="text-neutral-300 font-semibold truncate max-w-[120px] sm:max-w-xs">
                        {currentHostEvent.title}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveView('participant_portal')}
                    className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
                  >
                    Discover
                  </button>
                  {selectedEvent && activeView !== 'participant_portal' && (
                    <>
                      <span className="text-neutral-600">/</span>
                      <span className="text-neutral-300 font-semibold truncate max-w-[120px] sm:max-w-xs">
                        {selectedEvent.title}
                      </span>
                    </>
                  )}
                  {activeView === 'my_tickets' && (
                    <>
                      <span className="text-neutral-600">/</span>
                      <span className="text-emerald-400 font-medium">My Tickets</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Top Center: View Tabs / Mode Navigation */}
          <div className="flex items-center gap-2">
            {isHost ? (
              <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
                <button
                  onClick={handleGoToMyEvents}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeView === 'my_events'
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  My Events ({hostEvents.length})
                </button>

                {currentHostEvent && (
                  <button
                    onClick={() => setActiveView('admin_dashboard')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      activeView === 'admin_dashboard'
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Dashboard
                  </button>
                )}

                <button
                  onClick={handleOpenCreateEvent}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    activeView === 'host_setup' && !eventToEdit
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden md:inline">Create Event</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
                <button
                  onClick={() => setActiveView('participant_portal')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'participant_portal' || activeView === 'event_detail' || activeView === 'apply_form' || activeView === 'review_application'
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Compass className="w-3 h-3" />
                  <span>Discover Assemblies</span>
                </button>

                <button
                  onClick={handleOpenMyTickets}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'my_tickets' || activeView === 'ticket_view'
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Ticket className="w-3 h-3" />
                  <span>My Tickets</span>
                  {activeUserTickets.length > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        activeView === 'my_tickets' || activeView === 'ticket_view'
                          ? 'bg-black text-white'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {activeUserTickets.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Top Right: User Profile & Logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
              <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white">
                {currentUser.avatarSeed || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-neutral-300 font-medium hidden sm:inline truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                [{currentUser.role}]
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {/* HOST VIEWS */}
        {isHost && activeView === 'my_events' && (
          <MyEventsHub
            currentUser={currentUser}
            events={hostEvents}
            participants={participants}
            onOpenDashboard={handleOpenDashboard}
            onEditEvent={handleOpenEditEvent}
            onCreateEvent={handleOpenCreateEvent}
            onDuplicateEvent={handleDuplicateEvent}
            onCancelEvent={handleCancelEvent}
            onDeleteEvent={handleDeleteEvent}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {isHost && activeView === 'host_setup' && (
          <HostSetupView
            currentUser={currentUser}
            eventToEdit={eventToEdit}
            onSaveEvent={handleSaveEvent}
            onCancel={handleGoToMyEvents}
            welcomeMessage={welcomeMessage}
          />
        )}

        {isHost && activeView === 'admin_dashboard' && currentHostEvent && (
          <AdminDashboardView
            currentEvent={currentHostEvent}
            hostEvents={hostEvents}
            participants={participants.filter((p) => p.eventId === currentHostEvent.id)}
            announcements={announcements.filter((a) => a.eventId === currentHostEvent.id)}
            feedbacks={feedbacks.filter((f) => f.eventId === currentHostEvent.id)}
            onSelectEvent={handleSelectEvent}
            onGoToMyEvents={handleGoToMyEvents}
            onOpenCreateEvent={handleOpenCreateEvent}
            onUpdateStatus={handleUpdateStatus}
            onToggleCheckIn={handleToggleCheckIn}
            onUpdateParticipantStatus={handleUpdateParticipantStatus}
            onAddParticipant={handleAddParticipant}
            onBroadcastAnnouncement={handleBroadcastAnnouncement}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
          />
        )}

        {isHost && activeView === 'edit_host_profile' && (
          <HostProfileModal
            isMandatory={false}
            currentUser={currentUser}
            onSave={handleSaveHostProfile}
            onCancel={handleGoToMyEvents}
          />
        )}

        {/* PARTICIPANT FLOW VIEWS */}
        {!isHost && activeView === 'participant_portal' && (
          <ParticipantPortalView
            currentUser={currentUser}
            publishedEvents={publishedEvents}
            userTickets={userTickets}
            onOpenEventDetail={handleOpenEventDetail}
            onOpenMyTickets={handleOpenMyTickets}
            onViewTicket={handleViewTicket}
          />
        )}

        {!isHost && activeView === 'event_detail' && selectedEvent && (
          <EventDetailView
            event={selectedEvent}
            currentUser={currentUser}
            userRegistration={userTickets.find((t) => t.eventId === selectedEvent.id && t.status !== 'Cancelled') || null}
            agenda={agenda.filter((s) => s.eventId === selectedEvent.id)}
            registeredCount={participants.filter((p) => p.eventId === selectedEvent.id && p.status !== 'Cancelled').length}
            onBack={() => setActiveView('participant_portal')}
            onApply={() => handleStartApply(selectedEvent)}
            onViewTicket={() => {
              const userTicket = userTickets.find((t) => t.eventId === selectedEvent.id && t.status !== 'Cancelled');
              if (userTicket) handleViewTicket(userTicket);
            }}
            onRequireLogin={handleRequireLogin}
          />
        )}

        {!isHost && activeView === 'apply_form' && selectedEvent && (
          <DynamicApplicationForm
            event={selectedEvent}
            currentUser={currentUser}
            initialAnswers={applicationData?.answers}
            onCancel={() => setActiveView('event_detail')}
            onProceedToReview={handleProceedToReview}
          />
        )}

        {!isHost && activeView === 'review_application' && selectedEvent && applicationData && (
          <ReviewApplicationView
            event={selectedEvent}
            applicationData={applicationData}
            onEdit={handleBackToForm}
            onConfirm={handleConfirmRegistration}
            serverError={registrationServerError}
          />
        )}

        {!isHost && activeView === 'ticket_view' && selectedTicket && selectedEvent && (
          <CinemaTicketView
            registration={selectedTicket}
            event={selectedEvent}
            onBackToMyTickets={handleOpenMyTickets}
            onBackToDiscovery={() => setActiveView('participant_portal')}
            isNewlyRegistered={isNewlyRegistered}
          />
        )}

        {!isHost && activeView === 'my_tickets' && (
          <MyTicketsView
            currentUser={currentUser}
            tickets={userTickets}
            allEvents={events}
            onViewTicket={handleViewTicket}
            onEditDetails={handleEditTicketDetails}
            onCancelRegistration={handleCancelRegistration}
            onOpenEventDetail={(eventId) => {
              const evt = events.find((e) => e.id === eventId);
              if (evt) handleOpenEventDetail(evt);
            }}
            onDiscoverEvents={() => setActiveView('participant_portal')}
          />
        )}
      </main>

      {/* Slide-out Navigation Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={activeView}
        setActiveView={setActiveView}
        currentEvent={currentHostEvent}
        hostEvents={hostEvents}
        currentUser={currentUser}
        onSelectEvent={handleSelectEvent}
        onLogout={handleLogout}
        onResetDemo={handleResetDemo}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
      />

      {/* QR Scanner Modal for Host */}
      {currentHostEvent && (
        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          participants={participants.filter((p) => p.eventId === currentHostEvent.id)}
          onCheckIn={handleToggleCheckIn}
        />
      )}
    </div>
  );
}
