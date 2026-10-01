import { FormField, EventMetadata } from '../types';

export function getDefaultRegistrationForm(event: Partial<EventMetadata>): FormField[] {
  const tiers = event.ticketTiers && event.ticketTiers.length > 0
    ? event.ticketTiers
    : ['General Delegate', 'Volunteer', 'VIP Guest', 'Speaker / Presenter'];

  const categoryInterests: Record<string, string[]> = {
    'Civic & Government': ['Urban Transit', 'Clean Energy', 'Zoning Policy', 'Public Health', 'Civic Tech', 'Bicycle Lanes'],
    'Health & Wellness': ['Yoga & Mindfulness', 'Holistic Nutrition', 'Mental Health', 'Sound Healing', 'Preventive Care', 'Outdoor Fitness'],
    'Education & Career': ['Career Mentorship', 'Resume Building', 'Higher Ed Admissions', 'Tech Apprenticeships', 'Vocational Skills'],
    'Cultural & Festival': ['Folk Music', 'Culinary Tasting', 'Traditional Dance', 'Artisan Crafts', 'Indigenous Heritage'],
    'Sports & Fitness': ['Long Distance Running', 'Marathon Pacing', 'CrossFit & Conditioning', 'Youth Athletics', 'Sports Nutrition'],
    'Community & Social Service': ['Food Bank Logistics', 'Neighborhood Cleanup', 'Disaster Relief', 'Tree Planting', 'Elderly Support'],
    'Business & Startup': ['Seed Funding', 'SME Growth', 'Venture Capital', 'Product-Market Fit', 'B2B Sales', 'Pitch Practice'],
    'Science & Tech Outreach': ['Astronomy & Telescopes', 'Robotics & Automation', 'STEM Education', 'Physics Demos', 'Space Science'],
    'Religious & Heritage': ['Interfaith Dialogue', 'Historic Preservation', 'Sacred Music', 'Choral Traditions', 'Heritage Architecture'],
    'Entertainment': ['Indie Acoustic', 'Improv Comedy', 'Cinematography', 'Live Stage Theatre', 'Audio Production'],
  };

  const defaultInterests = (event.category && categoryInterests[event.category]) || [
    'Community Engagement',
    'Interactive Workshops',
    'Keynote Speeches',
    'Networking & Mentorship',
    'Panels & Q&A',
  ];

  return [
    {
      id: 'full_name',
      label: 'Full Name',
      type: 'text',
      required: true,
      enabled: true,
      locked: true,
      placeholder: 'Enter your legal or preferred full name',
      helpText: 'Printed on your badge and digital fastpass.',
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      enabled: true,
      locked: true,
      placeholder: 'name@example.com',
      helpText: 'Your unique ticket QR code and dispatches will be sent here.',
    },
    {
      id: 'ticket_tier',
      label: 'Role / Ticket Type',
      type: 'dropdown',
      required: true,
      enabled: true,
      locked: true,
      options: tiers,
      placeholder: 'Select your admission tier',
      helpText: 'Select the tier appropriate for your role at the event.',
    },
    {
      id: 'interests',
      label: 'Interests & Discussion Topics',
      type: 'multiselect',
      required: true,
      enabled: true,
      locked: true,
      options: defaultInterests,
      placeholder: 'Select or add interest tags',
      helpText: 'Select at least one interest to personalize your schedule and peer networking.',
    },
    {
      id: 'phone',
      label: 'Mobile Phone Number',
      type: 'phone',
      required: true,
      enabled: true,
      placeholder: '10-digit mobile number (e.g. 4155552671)',
      helpText: 'Used exclusively for critical on-site schedule and gate alerts.',
    },
    {
      id: 'organization',
      label: 'College, Company, or Affiliation',
      type: 'text',
      required: true,
      enabled: true,
      placeholder: 'e.g. University of California, Local League, or Independent',
      helpText: 'Your current academic, community, or professional affiliation.',
    },
    {
      id: 'terms_consent',
      label: 'Code of Conduct & Safety Consent',
      type: 'checkbox',
      required: true,
      enabled: true,
      helpText: 'I confirm compliance with venue safety policies and organizer event rules.',
    },
  ];
}

/**
 * Keyword-matching interest suggestion generator
 * Isolated so it can be seamlessly delegated to Gemini or server routes
 */
export function suggestInterests(text: string, categories: string[] = []): string[] {
  if (!text || text.trim().length === 0) {
    return ['Community & Collaboration', 'Interactive Learning', 'Keynotes'];
  }

  const lower = text.toLowerCase();
  const candidates: { tag: string; keywords: string[] }[] = [
    { tag: 'Urban Transit & Infrastructure', keywords: ['transit', 'bus', 'train', 'metro', 'subway', 'bike', 'cycling', 'traffic', 'urban'] },
    { tag: 'Clean Energy & Sustainability', keywords: ['green', 'climate', 'energy', 'solar', 'carbon', 'sustainable', 'environment', 'planet'] },
    { tag: 'Zoning & Housing Policy', keywords: ['housing', 'zoning', 'rent', 'tenant', 'development', 'policy', 'civic', 'council'] },
    { tag: 'Yoga & Holistic Movement', keywords: ['yoga', 'stretch', 'posture', 'vinyasa', 'breath', 'movement', 'body', 'flexibility'] },
    { tag: 'Mindfulness & Sound Baths', keywords: ['meditation', 'sound', 'calm', 'peace', 'mind', 'stress', 'mental', 'relaxation'] },
    { tag: 'Plant-Based Nutrition', keywords: ['food', 'nutrition', 'diet', 'vegan', 'plant', 'cook', 'meal', 'wellness'] },
    { tag: 'Long Distance Running & 10K', keywords: ['run', 'runner', 'running', 'marathon', 'pace', 'stride', 'athletics', 'cardio'] },
    { tag: 'CrossFit & Functional Fitness', keywords: ['lift', 'strength', 'crossfit', 'gym', 'workout', 'muscle', 'endurance'] },
    { tag: 'Youth Sports & Athletic Mentorship', keywords: ['youth', 'kids', 'coach', 'coaching', 'student', 'team', 'league'] },
    { tag: 'Food Bank Aid & Hunger Relief', keywords: ['volunteer', 'food', 'charity', 'hunger', 'pantry', 'homeless', 'aid', 'donate'] },
    { tag: 'Park Beautification & Cleanups', keywords: ['cleanup', 'trash', 'park', 'greenway', 'trees', 'nature', 'community', 'service'] },
    { tag: 'Venture Capital & Seed Funding', keywords: ['invest', 'investor', 'capital', 'seed', 'series', 'founder', 'startup', 'equity', 'venture'] },
    { tag: 'SME Scale-Up & Operations', keywords: ['business', 'growth', 'sales', 'commerce', 'marketing', 'sme', 'enterprise'] },
    { tag: 'Astronomy & Planetary Science', keywords: ['space', 'telescope', 'stars', 'galaxy', 'planet', 'astronomy', 'cosmos', 'nasa'] },
    { tag: 'Robotics & Hardware Prototyping', keywords: ['robot', 'robotics', 'code', 'ai', 'hardware', 'arduino', 'tech', 'software'] },
    { tag: 'Live Acoustic Sets & Songwriting', keywords: ['music', 'song', 'guitar', 'sing', 'acoustic', 'band', 'concert', 'sound'] },
    { tag: 'Improv Comedy & Performing Arts', keywords: ['theatre', 'theater', 'comedy', 'acting', 'drama', 'improv', 'stage', 'performance'] },
    { tag: 'Interfaith Harmony & Sacred Texts', keywords: ['faith', 'prayer', 'religion', 'sacred', 'harmony', 'peace', 'spiritual'] },
  ];

  const matched: string[] = [];

  for (const item of candidates) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      matched.push(item.tag);
    }
  }

  // If few matches, pull relevant tags from categories
  if (matched.length === 0) {
    matched.push('General Exploration', 'Networking & Peer Circles', 'Program Keynotes');
  }

  return matched.slice(0, 5);
}
