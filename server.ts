import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { SEED_EVENTS, SEED_PARTICIPANTS, SEED_ANNOUNCEMENTS } from './src/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, 'data');
const dbFile = path.resolve(dataDir, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Generate guaranteed-unique 5-char ticket code (excluding confusing chars 0, O, 1, I)
function generateUniqueTicketCode(existingCodes: Set<string>): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  do {
    let part = '';
    for (let i = 0; i < 5; i++) {
      part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `EVP-${part}`;
  } while (existingCodes.has(code));
  return code;
}

interface DBStructure {
  events: any[];
  registrations: any[];
  announcements: any[];
  readState: Record<string, string[]>;
}

function loadDB(): DBStructure {
  try {
    if (!fs.existsSync(dbFile)) {
      const initial: DBStructure = {
        events: SEED_EVENTS,
        registrations: SEED_PARTICIPANTS.map((p) => ({
          ticketId: p.ticketId || `tkt_${p.id}`,
          ticketCode: p.ticketCode || `EVP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          eventId: p.eventId,
          participantEmail: p.email,
          participantName: p.name,
          roleTier: p.ticketTier,
          interests: ['Community & Policy'],
          phone: '4155551234',
          company: p.company || 'Community Member',
          answers: p.answers || {},
          status: p.isCheckedIn ? 'Checked in' : (p.status || 'Approved'),
          isCheckedIn: p.isCheckedIn || false,
          checkInTimestamp: p.checkInTimestamp,
          registeredAt: p.registeredAt || new Date().toISOString(),
        })),
        announcements: SEED_ANNOUNCEMENTS,
        readState: {},
      };
      fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(dbFile, 'utf-8');
    const parsed = JSON.parse(data) as DBStructure;
    if (!parsed.announcements || !Array.isArray(parsed.announcements)) {
      parsed.announcements = SEED_ANNOUNCEMENTS;
    }
    if (!parsed.readState) {
      parsed.readState = {};
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { events: SEED_EVENTS, registrations: [], announcements: SEED_ANNOUNCEMENTS, readState: {} };
  }
}

function saveDB(data: DBStructure): void {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // 1. GET /api/events
  app.get('/api/events', (req, res) => {
    const db = loadDB();
    res.json(db.events);
  });

  // 2. GET /api/events/:eventId
  app.get('/api/events/:eventId', (req, res) => {
    const db = loadDB();
    const event = db.events.find((e) => e.id === req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  });

  // 3. POST /api/registrations (re-checks duplicates, deadline and capacity on the SERVER)
  app.post('/api/registrations', (req, res) => {
    const { eventId, participant } = req.body;
    if (!eventId || !participant || !participant.email || !participant.name) {
      return res.status(400).json({ error: 'Missing required registration parameters' });
    }

    const db = loadDB();
    const event = db.events.find((e) => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: 'Selected event not found' });
    }

    // Server-side check: event status
    if (event.status === 'Completed' || event.status === 'Cancelled') {
      return res.status(400).json({ error: 'This event is not accepting registrations.' });
    }

    // Server-side check: deadline passed
    if (event.registrationDeadline) {
      const deadlineTime = new Date(event.registrationDeadline).getTime();
      if (!isNaN(deadlineTime) && Date.now() > deadlineTime) {
        return res.status(400).json({ error: 'Registration has closed for this event.' });
      }
    }

    const cleanEmail = participant.email.trim().toLowerCase();

    // Server-side check: duplicate registration
    const existing = db.registrations.find(
      (r) => r.eventId === eventId && r.participantEmail.toLowerCase() === cleanEmail && r.status !== 'Cancelled'
    );
    if (existing) {
      return res.status(400).json({
        error: 'You are already registered for this event, view your ticket',
        ticketId: existing.ticketId,
        ticketCode: existing.ticketCode,
      });
    }

    // Server-side check: capacity
    const activeCount = db.registrations.filter(
      (r) => r.eventId === eventId && r.status !== 'Cancelled' && r.status !== 'Rejected'
    ).length;

    if (event.capacity && activeCount >= event.capacity) {
      return res.status(400).json({ error: 'This event is sold out.' });
    }

    // Generate unique ticket code
    const existingCodes = new Set<string>(db.registrations.map((r) => r.ticketCode));
    const ticketCode = generateUniqueTicketCode(existingCodes);
    const ticketId = crypto.randomUUID();

    const approvalStatus = event.approvalMode === 'Manual' ? 'Pending' : 'Approved';

    const newRegistration = {
      ticketId,
      ticketCode,
      eventId,
      participantEmail: cleanEmail,
      participantName: participant.name.trim(),
      roleTier: participant.roleTier || participant.ticketTier || 'General',
      interests: participant.interests || [],
      phone: participant.phone || '',
      company: participant.company || '',
      answers: participant.answers || {},
      status: approvalStatus,
      isCheckedIn: false,
      registeredAt: new Date().toISOString(),
    };

    db.registrations.push(newRegistration);
    saveDB(db);

    res.status(201).json(newRegistration);
  });

  // 4. GET /api/participants/:participantEmail/tickets
  app.get('/api/participants/:participantEmail/tickets', (req, res) => {
    const cleanEmail = req.params.participantEmail.trim().toLowerCase();
    const db = loadDB();
    const tickets = db.registrations.filter(
      (r) => r.participantEmail.toLowerCase() === cleanEmail
    );
    res.json(tickets);
  });

  // 5. GET /api/events/:eventId/participants
  app.get('/api/events/:eventId/participants', (req, res) => {
    const db = loadDB();
    const list = db.registrations.filter((r) => r.eventId === req.params.eventId);
    res.json(list);
  });

  // 6. PATCH /api/registrations/:ticketId (participant edits answers until deadline)
  app.patch('/api/registrations/:ticketId', (req, res) => {
    const { ticketId } = req.params;
    const { answers, participantName, roleTier, interests, phone, company } = req.body;

    const db = loadDB();
    const regIndex = db.registrations.findIndex((r) => r.ticketId === ticketId);
    if (regIndex === -1) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const reg = db.registrations[regIndex];
    const event = db.events.find((e) => e.id === reg.eventId);

    if (event?.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline).getTime();
      if (!isNaN(deadline) && Date.now() > deadline) {
        return res.status(400).json({ error: 'Cannot edit details after the registration deadline' });
      }
    }

    if (reg.isCheckedIn) {
      return res.status(400).json({ error: 'Cannot edit details after checking in' });
    }

    db.registrations[regIndex] = {
      ...reg,
      participantName: participantName || reg.participantName,
      roleTier: roleTier || reg.roleTier,
      interests: interests || reg.interests,
      phone: phone !== undefined ? phone : reg.phone,
      company: company !== undefined ? company : reg.company,
      answers: answers ? { ...reg.answers, ...answers } : reg.answers,
      updatedAt: new Date().toISOString(),
    };

    saveDB(db);
    res.json(db.registrations[regIndex]);
  });

  // 7. DELETE /api/registrations/:ticketId (participant cancels registration, frees seat)
  app.delete('/api/registrations/:ticketId', (req, res) => {
    const { ticketId } = req.params;
    const db = loadDB();
    const reg = db.registrations.find((r) => r.ticketId === ticketId);
    if (!reg) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (reg.isCheckedIn) {
      return res.status(400).json({ error: 'Cannot cancel after checking in at the gate' });
    }

    const event = db.events.find((e) => e.id === reg.eventId);
    if (event && new Date() > new Date(event.startDateTime)) {
      return res.status(400).json({ error: 'Cannot cancel after the event has started' });
    }

    db.registrations = db.registrations.filter((r) => r.ticketId !== ticketId);
    saveDB(db);

    res.json({ success: true, message: 'Registration cancelled and seat freed' });
  });

  // 8. PATCH /api/registrations/:ticketId/status (host approves, rejects, or manual check-in)
  app.patch('/api/registrations/:ticketId/status', (req, res) => {
    const { ticketId } = req.params;
    const { status, isCheckedIn } = req.body;

    const db = loadDB();
    const regIndex = db.registrations.findIndex((r) => r.ticketId === ticketId);
    if (regIndex === -1) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const current = db.registrations[regIndex];
    const updated = {
      ...current,
      status: status || current.status,
      isCheckedIn: isCheckedIn !== undefined ? isCheckedIn : (status === 'Checked in' ? true : current.isCheckedIn),
      checkInTimestamp: isCheckedIn || status === 'Checked in'
        ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : current.checkInTimestamp,
      updatedAt: new Date().toISOString(),
    };

    db.registrations[regIndex] = updated;
    saveDB(db);

    res.json(updated);
  });

  // 9. POST /api/ai/suggest-interests
  app.post('/api/ai/suggest-interests', (req, res) => {
    const { text, categories } = req.body;
    if (!text || typeof text !== 'string') {
      return res.json({ interests: ['Community & Collaboration', 'Interactive Learning', 'Keynotes'] });
    }

    const lower = text.toLowerCase();
    const candidates = [
      { tag: 'Urban Transit & Infrastructure', kw: ['transit', 'bus', 'train', 'metro', 'subway', 'bike', 'cycling', 'traffic', 'urban'] },
      { tag: 'Clean Energy & Sustainability', kw: ['green', 'climate', 'energy', 'solar', 'carbon', 'sustainable', 'environment', 'planet'] },
      { tag: 'Zoning & Housing Policy', kw: ['housing', 'zoning', 'rent', 'tenant', 'development', 'policy', 'civic', 'council'] },
      { tag: 'Yoga & Holistic Movement', kw: ['yoga', 'stretch', 'posture', 'vinyasa', 'breath', 'movement', 'body', 'flexibility'] },
      { tag: 'Mindfulness & Sound Baths', kw: ['meditation', 'sound', 'calm', 'peace', 'mind', 'stress', 'mental', 'relaxation'] },
      { tag: 'Plant-Based Nutrition', kw: ['food', 'nutrition', 'diet', 'vegan', 'plant', 'cook', 'meal', 'wellness'] },
      { tag: 'Long Distance Running & 10K', kw: ['run', 'runner', 'running', 'marathon', 'pace', 'stride', 'athletics', 'cardio'] },
      { tag: 'CrossFit & Functional Fitness', kw: ['lift', 'strength', 'crossfit', 'gym', 'workout', 'muscle', 'endurance'] },
      { tag: 'Youth Sports & Athletic Mentorship', kw: ['youth', 'kids', 'coach', 'coaching', 'student', 'team', 'league'] },
      { tag: 'Food Bank Aid & Hunger Relief', kw: ['volunteer', 'food', 'charity', 'hunger', 'pantry', 'homeless', 'aid', 'donate'] },
      { tag: 'Park Beautification & Cleanups', kw: ['cleanup', 'trash', 'park', 'greenway', 'trees', 'nature', 'community', 'service'] },
      { tag: 'Venture Capital & Seed Funding', kw: ['invest', 'investor', 'capital', 'seed', 'series', 'founder', 'startup', 'equity', 'venture'] },
      { tag: 'SME Scale-Up & Operations', kw: ['business', 'growth', 'sales', 'commerce', 'marketing', 'sme', 'enterprise'] },
      { tag: 'Astronomy & Planetary Science', kw: ['space', 'telescope', 'stars', 'galaxy', 'planet', 'astronomy', 'cosmos', 'nasa'] },
      { tag: 'Robotics & Hardware Prototyping', kw: ['robot', 'robotics', 'code', 'ai', 'hardware', 'arduino', 'tech', 'software'] },
      { tag: 'Live Acoustic Sets & Songwriting', kw: ['music', 'song', 'guitar', 'sing', 'acoustic', 'band', 'concert', 'sound'] },
      { tag: 'Improv Comedy & Performing Arts', kw: ['theatre', 'theater', 'comedy', 'acting', 'drama', 'improv', 'stage', 'performance'] },
      { tag: 'Interfaith Harmony & Sacred Texts', kw: ['faith', 'prayer', 'religion', 'sacred', 'harmony', 'peace', 'spiritual'] },
    ];

    const matched: string[] = [];
    for (const c of candidates) {
      if (c.kw.some((k) => lower.includes(k))) {
        matched.push(c.tag);
      }
    }

    if (matched.length === 0) {
      matched.push('General Program Sessions', 'Networking & Peer Circles', 'Interactive Workshops');
    }

    res.json({ interests: matched.slice(0, 5) });
  });

  // 10. GET /api/participants/:email/announcements?since=<timestamp>
  app.get('/api/participants/:email/announcements', (req, res) => {
    try {
      const email = req.params.email ? req.params.email.trim().toLowerCase() : '';
      const since = req.query.since ? Number(req.query.since) : 0;
      const db = loadDB();

      // Find user registrations that are active (Approved, Pending, or Checked in)
      const validRegistrations = db.registrations.filter((r) => {
        const matchesEmail = (r.participantEmail || '').toLowerCase() === email;
        const isNotCancelled = r.status !== 'Cancelled' && r.status !== 'Rejected';
        return matchesEmail && isNotCancelled;
      });

      if (validRegistrations.length === 0) {
        return res.json([]);
      }

      // Map of eventId -> array of registrations (for tier and checkin verification)
      const eventRegs = new Map<string, { roleTier: string; isCheckedIn: boolean }[]>();
      for (const reg of validRegistrations) {
        const list = eventRegs.get(reg.eventId) || [];
        list.push({
          roleTier: (reg.roleTier || 'General').toLowerCase(),
          isCheckedIn: Boolean(reg.isCheckedIn),
        });
        eventRegs.set(reg.eventId, list);
      }

      const eventsMap = new Map<string, any>(db.events.map((e) => [e.id, e]));
      const userReadIds = new Set<string>(db.readState[email] || []);

      const allowedAnnouncements = (db.announcements || [])
        .filter((ann) => {
          // Must belong to an event participant is registered for
          const regsForEvent = eventRegs.get(ann.eventId);
          if (!regsForEvent || regsForEvent.length === 0) return false;

          // Scheduled check: stay hidden until scheduledFor time
          if (ann.scheduledFor) {
            const schedTime = new Date(ann.scheduledFor).getTime();
            if (!isNaN(schedTime) && schedTime > Date.now()) {
              return false;
            }
          }

          // Since filter (optional)
          if (since && since > 0) {
            const itemTime = new Date(ann.updatedAt || ann.createdAt).getTime();
            if (!isNaN(itemTime) && itemTime <= since) {
              return false;
            }
          }

          // Audience check
          const target = (ann.targetAudience || 'All Attendees').trim();
          if (
            target === 'All' ||
            target === 'All Attendees' ||
            target === 'General Public' ||
            !target
          ) {
            return true;
          }

          if (target === 'Checked-in only') {
            return regsForEvent.some((r) => r.isCheckedIn);
          }

          if (target === 'Not yet checked-in' || target === 'Not checked-in') {
            return regsForEvent.some((r) => !r.isCheckedIn);
          }

          // Specific tier check (e.g. VIP, Speaker, Volunteers, Delegate)
          const targetLower = target.toLowerCase().replace(/ only| attendees/gi, '').trim();
          return regsForEvent.some((r) => r.roleTier.includes(targetLower) || targetLower.includes(r.roleTier));
        })
        .map((ann) => {
          const event = eventsMap.get(ann.eventId);
          const isRead = userReadIds.has(ann.id) || (Array.isArray(ann.readBy) && ann.readBy.includes(email));
          return {
            ...ann,
            eventTitle: ann.eventTitle || event?.title || 'Community Event',
            eventCategory: ann.eventCategory || event?.category || 'Civic & Government',
            eventBannerUrl: ann.eventBannerUrl || event?.bannerUrl,
            organizerName: ann.organizerName || event?.organizerName || 'Event Host',
            isRead,
          };
        })
        .sort((a, b) => {
          // Pinned first, then Urgent first, then newest createdAt desc
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if (a.type === 'Urgent' && b.type !== 'Urgent') return -1;
          if (a.type !== 'Urgent' && b.type === 'Urgent') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      res.json(allowedAnnouncements);
    } catch (err) {
      console.error('Error fetching participant announcements:', err);
      res.status(500).json({ error: 'Failed to retrieve announcements' });
    }
  });

  // 11. POST /api/events/:eventId/announcements (host creates announcement)
  app.post('/api/events/:eventId/announcements', (req, res) => {
    try {
      const { eventId } = req.params;
      const {
        title,
        message,
        rawText,
        polishedText,
        type = 'General',
        tone = 'Civic & Official',
        targetAudience = 'All Attendees',
        isPinned = false,
        scheduledFor = null,
        organizerName,
      } = req.body;

      if (!message && !polishedText && !rawText) {
        return res.status(400).json({ error: 'Announcement message content is required' });
      }

      const db = loadDB();
      const event = db.events.find((e) => e.id === eventId);
      const now = new Date();

      const finalMessage = polishedText || message || rawText;
      const finalTitle = title || (rawText ? rawText.slice(0, 40) + '...' : 'Event Update');

      const newAnnouncement = {
        id: `ann_${crypto.randomUUID()}`,
        eventId,
        eventTitle: event?.title || 'Event Assembly',
        eventCategory: event?.category || 'Civic & Government',
        title: finalTitle,
        message: finalMessage,
        rawText: rawText || finalMessage,
        polishedText: finalMessage,
        type,
        tone,
        targetAudience,
        isPinned: Boolean(isPinned),
        scheduledFor: scheduledFor || null,
        organizerName: organizerName || event?.organizerName || 'Event Host',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDelivered: true,
        readBy: [],
      };

      if (!db.announcements) db.announcements = [];
      db.announcements.unshift(newAnnouncement);
      saveDB(db);

      res.status(201).json(newAnnouncement);
    } catch (err) {
      console.error('Error creating announcement:', err);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  // 12. PATCH /api/announcements/:id (host edits announcement)
  app.patch('/api/announcements/:id', (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        message,
        polishedText,
        type,
        tone,
        targetAudience,
        isPinned,
        scheduledFor,
      } = req.body;

      const db = loadDB();
      const index = (db.announcements || []).findIndex((a) => a.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      const current = db.announcements[index];
      const updated = {
        ...current,
        title: title !== undefined ? title : current.title,
        message: message !== undefined ? message : (polishedText !== undefined ? polishedText : current.message),
        polishedText: polishedText !== undefined ? polishedText : (message !== undefined ? message : current.polishedText),
        type: type !== undefined ? type : current.type,
        tone: tone !== undefined ? tone : current.tone,
        targetAudience: targetAudience !== undefined ? targetAudience : current.targetAudience,
        isPinned: isPinned !== undefined ? Boolean(isPinned) : current.isPinned,
        scheduledFor: scheduledFor !== undefined ? scheduledFor : current.scheduledFor,
        isEdited: true,
        updatedAt: new Date().toISOString(),
      };

      db.announcements[index] = updated;
      saveDB(db);

      res.json(updated);
    } catch (err) {
      console.error('Error updating announcement:', err);
      res.status(500).json({ error: 'Failed to update announcement' });
    }
  });

  // 13. DELETE /api/announcements/:id (host deletes announcement)
  app.delete('/api/announcements/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDB();
      const initialLength = (db.announcements || []).length;
      db.announcements = (db.announcements || []).filter((a) => a.id !== id);

      if (db.announcements.length === initialLength) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      // Also clean up from read states
      if (db.readState) {
        for (const email of Object.keys(db.readState)) {
          db.readState[email] = db.readState[email].filter((readId) => readId !== id);
        }
      }

      saveDB(db);
      res.json({ success: true, message: 'Announcement deleted' });
    } catch (err) {
      console.error('Error deleting announcement:', err);
      res.status(500).json({ error: 'Failed to delete announcement' });
    }
  });

  // 14. POST /api/participants/:email/announcements/:id/read (mark single read)
  app.post('/api/participants/:email/announcements/:id/read', (req, res) => {
    try {
      const email = req.params.email.trim().toLowerCase();
      const { id } = req.params;
      const db = loadDB();

      if (!db.readState) db.readState = {};
      if (!db.readState[email]) db.readState[email] = [];

      if (!db.readState[email].includes(id)) {
        db.readState[email].push(id);
      }

      // Also record in announcement's readBy
      const ann = (db.announcements || []).find((a) => a.id === id);
      if (ann) {
        if (!Array.isArray(ann.readBy)) ann.readBy = [];
        if (!ann.readBy.includes(email)) ann.readBy.push(email);
      }

      saveDB(db);
      res.json({ success: true, readAnnouncementIds: db.readState[email] });
    } catch (err) {
      console.error('Error marking announcement as read:', err);
      res.status(500).json({ error: 'Failed to mark announcement as read' });
    }
  });

  // 15. POST /api/participants/:email/announcements/read-all (mark all read)
  app.post('/api/participants/:email/announcements/read-all', (req, res) => {
    try {
      const email = req.params.email.trim().toLowerCase();
      const db = loadDB();

      if (!db.readState) db.readState = {};
      if (!db.readState[email]) db.readState[email] = [];

      // Find all announcements matching this user
      const validRegs = db.registrations.filter((r) => {
        return (r.participantEmail || '').toLowerCase() === email && r.status !== 'Cancelled' && r.status !== 'Rejected';
      });
      const registeredEventIds = new Set(validRegs.map((r) => r.eventId));

      for (const ann of db.announcements || []) {
        if (registeredEventIds.has(ann.eventId)) {
          if (!db.readState[email].includes(ann.id)) {
            db.readState[email].push(ann.id);
          }
          if (!Array.isArray(ann.readBy)) ann.readBy = [];
          if (!ann.readBy.includes(email)) ann.readBy.push(email);
        }
      }

      saveDB(db);
      res.json({ success: true, readAnnouncementIds: db.readState[email] });
    } catch (err) {
      console.error('Error marking all as read:', err);
      res.status(500).json({ error: 'Failed to mark all announcements as read' });
    }
  });

  // 16. GET /api/events/:eventId/announcements
  app.get('/api/events/:eventId/announcements', (req, res) => {
    try {
      const { eventId } = req.params;
      const db = loadDB();
      const event = db.events.find((e) => e.id === eventId);
      const list = (db.announcements || [])
        .filter((a) => a.eventId === eventId)
        .map((a) => ({
          ...a,
          eventTitle: a.eventTitle || event?.title,
          eventCategory: a.eventCategory || event?.category,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch event announcements' });
    }
  });

  // Mount Vite middleware in development mode
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eventora Server active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
