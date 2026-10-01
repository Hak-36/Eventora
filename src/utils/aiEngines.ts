import { CommunicationTone, SentimentType, Participant } from '../types';

function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Intelligent Announcement Polisher for Public Events
 * Formats broadcast notes according to the public event tone.
 */
export function polishAnnouncement(rawText: string, tone: CommunicationTone, eventTitle: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return 'Please enter raw notes to generate a broadcast dispatch.';
  }

  const lower = trimmed.toLowerCase();
  const isDelay = lower.includes('delay') || lower.includes('late') || lower.includes('postpone') || lower.includes('push back') || lower.includes('min');
  const isRoomChange = lower.includes('room') || lower.includes('stage') || lower.includes('hall') || lower.includes('pavilion') || lower.includes('tent') || lower.includes('gate');
  const isLunchOrFood = lower.includes('lunch') || lower.includes('food') || lower.includes('refreshment') || lower.includes('water') || lower.includes('meal');
  const isStart = lower.includes('start') || lower.includes('begin') || lower.includes('opening') || lower.includes('keynote') || lower.includes('commence');

  if (tone === 'Civic & Official') {
    if (isDelay && isRoomChange) {
      return `Official Advisory: Proceedings are temporarily rescheduled by 20 minutes to accommodate citizen registrations. The session will reconvene in Assembly Hall C. We appreciate the public's patience as we ensure orderly deliberation.`;
    }
    if (isStart) {
      return `Formal Notice: The scheduled plenary session for "${eventTitle}" will commence shortly. All delegates, registered speakers, and observers are kindly requested to take their assigned seats.`;
    }
    return `Official Bulletin: ${capitalizeFirstLetter(trimmed)}. Attendees and citizens are advised to note this operational guidance for today's assembly.`;
  }

  if (tone === 'Warm & Community-First') {
    if (isLunchOrFood) {
      return `Community Update: Complimentary refreshments and care packages are now ready at the distribution tent! Please take a moment to nourish yourselves and meet fellow neighbors. Thank you for your service!`;
    }
    if (isDelay) {
      return `Heads Up, Everyone: We are extending our current activity by 15-20 minutes so everyone can participate comfortably. Take your time, stay hydrated, and enjoy connecting with each other!`;
    }
    return `Warm Community Dispatch: ${capitalizeFirstLetter(trimmed)}. We are deeply grateful for your presence, care, and active participation in our gathering today!`;
  }

  if (tone === 'High-Energy & Inspiring') {
    if (isStart) {
      return `⚡ ATTENTION ATHLETES & PARTICIPANTS! 🚀 The countdown is on! Line up at the start gates and bring your maximum energy! Let's make today unforgettable! 🔥`;
    }
    if (isDelay || isRoomChange) {
      return `⚡ Quick Field Update! We're giving everyone 15 bonus minutes to stretch, hydrate, and get primed for the next heat! Head over to Arena C—let's keep the energy soaring! 🏆`;
    }
    return `🔥 LIVE PULSE DISPATCH! ${capitalizeFirstLetter(trimmed)}! Keep the momentum high, support your teammates, and let's conquer today's goals together! ⚡`;
  }

  if (tone === 'Educational & Informative') {
    if (isStart) {
      return `Academic Advisory: The featured masterclass and lecture track will begin in 10 minutes. Attendees are encouraged to have materials and questions prepared for the open inquiry portion.`;
    }
    if (isDelay || isRoomChange) {
      return `Curriculum Update: To allow thorough Q&A discussions, the upcoming workshop has been shifted by 20 minutes to Lecture Hall B. Session materials remain accessible on your portal pass.`;
    }
    return `Educational Notice: ${capitalizeFirstLetter(trimmed)}. Please refer to your digital course schedule for detailed workshop room allocations.`;
  }

  if (tone === 'Celebratory & Festive') {
    if (isStart) {
      return `🎉 The Celebration Begins! Our headline performance and cultural showcase is taking the Main Stage right now! Gather your family and friends for music, dance, and festivity! 🎶✨`;
    }
    return `✨ Festival Dispatch! ${capitalizeFirstLetter(trimmed)}! Savor the global flavors, support our local artisans, and celebrate cultural harmony together! 🎊`;
  }

  // Reverent & Heritage-Focused
  return `Heritage & Peace Notice: ${capitalizeFirstLetter(trimmed)}. We invite all attendees to join us in reflective remembrance and harmonious community celebration.`;
}

/**
 * Sentiment & Feedback Analyzer
 */
export function analyzeFeedbackSentiment(comment: string): {
  sentiment: SentimentType;
  score: number;
  summary: string;
} {
  const lower = comment.toLowerCase();

  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'loved', 'fantastic', 'wonderful', 'smooth', 'helpful', 'good', 'inspiring', 'clean', 'transparent'];
  const negativeWords = ['bad', 'poor', 'terrible', 'late', 'delayed', 'noisy', 'cold', 'hot', 'crowded', 'confusing', 'disappointed', 'slow', 'lost'];

  let posCount = 0;
  let negCount = 0;

  positiveWords.forEach((w) => {
    if (lower.includes(w)) posCount++;
  });

  negativeWords.forEach((w) => {
    if (lower.includes(w)) negCount++;
  });

  if (posCount > negCount) {
    return {
      sentiment: 'Positive',
      score: Math.min(0.99, 0.75 + posCount * 0.08),
      summary: 'Attendee expressed strong satisfaction with the event program and experience.',
    };
  } else if (negCount > posCount) {
    return {
      sentiment: 'Negative',
      score: Math.max(0.15, 0.45 - negCount * 0.1),
      summary: 'Attendee identified logistical or schedule concerns requiring attention.',
    };
  }

  return {
    sentiment: 'Neutral',
    score: 0.55,
    summary: 'Balanced constructive feedback and observations regarding event logistics.',
  };
}

/**
 * Calculate Event Intelligence Metrics
 */
export function calculateHostInsights(participants: Participant[], capacity: number) {
  const total = participants.length;
  const checkedIn = participants.filter((p) => p.isCheckedIn).length;
  const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
  const capacityFillRate = capacity > 0 ? Math.round((total / capacity) * 100) : 0;

  return {
    total,
    checkedIn,
    pending: total - checkedIn,
    checkInRate,
    capacityFillRate,
  };
}
