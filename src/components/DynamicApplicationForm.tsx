import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  Mail,
  Phone,
  Tag,
  HelpCircle,
  Building
} from 'lucide-react';
import { EventMetadata, FormField, UserAccount } from '../types';
import { getDefaultRegistrationForm } from '../utils/formDefaults';
import { getSuggestedInterests } from '../utils/api';

interface DynamicApplicationFormProps {
  event: EventMetadata;
  currentUser: UserAccount;
  initialAnswers?: Record<string, any>;
  onCancel: () => void;
  onProceedToReview: (payload: {
    participantName: string;
    participantEmail: string;
    roleTier: string;
    interests: string[];
    phone?: string;
    company?: string;
    answers: Record<string, any>;
  }) => void;
}

export const DynamicApplicationForm: React.FC<DynamicApplicationFormProps> = ({
  event,
  currentUser,
  initialAnswers,
  onCancel,
  onProceedToReview,
}) => {
  const formKey = `draft_answers_${event.id}_${currentUser.email.toLowerCase()}`;

  // Form fields list (from event or defaults)
  const fields: FormField[] = useMemo(() => {
    if (event.registrationForm && event.registrationForm.length > 0) {
      return event.registrationForm.filter((f) => f.enabled);
    }
    return getDefaultRegistrationForm(event);
  }, [event]);

  // Load draft from localStorage if initialAnswers not explicitly provided
  const savedDraft = useMemo(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      return initialAnswers;
    }
    try {
      const stored = localStorage.getItem(formKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {};
  }, [formKey, initialAnswers]);

  // Locked values
  const [fullName, setFullName] = useState<string>(
    savedDraft.full_name || currentUser.name || ''
  );
  const [email, setEmail] = useState<string>(
    savedDraft.email || currentUser.email || ''
  );
  const [roleTier, setRoleTier] = useState<string>(
    savedDraft.ticket_tier || (event.ticketTiers && event.ticketTiers[0]) || 'General Delegate'
  );
  const [interests, setInterests] = useState<string[]>(
    savedDraft.interests || []
  );
  const [customInterest, setCustomInterest] = useState('');

  // Suggest Interests state
  const [suggestPrompt, setSuggestPrompt] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Generic dynamic answers map
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = { ...savedDraft };
    fields.forEach((f) => {
      if (initial[f.id] === undefined) {
        if (f.type === 'checkbox') initial[f.id] = false;
        else if (f.type === 'multiselect') initial[f.id] = [];
        else initial[f.id] = '';
      }
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-save draft to localStorage on any modification
  useEffect(() => {
    const draftPayload = {
      ...answers,
      full_name: fullName,
      email: email,
      ticket_tier: roleTier,
      interests: interests,
    };
    try {
      localStorage.setItem(formKey, JSON.stringify(draftPayload));
    } catch {
      // ignore
    }
  }, [answers, fullName, email, roleTier, interests, formKey]);

  // Custom Interest Add
  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = customInterest.trim();
    if (!tag) return;
    if (!interests.includes(tag)) {
      setInterests([...interests, tag]);
    }
    setCustomInterest('');
  };

  const handleToggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((i) => i !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  // Suggest Interests via AI
  const handleSuggestInterests = async () => {
    if (!suggestPrompt.trim()) return;
    setIsSuggesting(true);
    try {
      const tags = await getSuggestedInterests(suggestPrompt, [event.category]);
      setSuggestedTags(tags);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAcceptSuggestedTag = (tag: string) => {
    if (!interests.includes(tag)) {
      setInterests([...interests, tag]);
    }
    setSuggestedTags(suggestedTags.filter((t) => t !== tag));
  };

  // Generic answer changer
  const handleAnswerChange = (fieldId: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // File upload handler (PDF only, max 1MB, Data URL)
  const handleFileUpload = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, [fieldId]: 'Only PDF documents are allowed' }));
      return;
    }

    if (file.size > 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [fieldId]: 'File size must be 1MB or less' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleAnswerChange(fieldId, {
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // Validation
  const validateForm = (scrollToError = false): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate locked fields
    if (!fullName.trim()) newErrors.full_name = 'Full name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!roleTier) newErrors.ticket_tier = 'Please select a ticket tier';

    if (!interests || interests.length === 0) {
      newErrors.interests = 'Please select or add at least one interest topic';
    }

    // Validate dynamic fields
    fields.forEach((field) => {
      if (field.locked) return; // already checked above

      const val = answers[field.id];

      if (field.required) {
        if (field.type === 'checkbox' && !val) {
          newErrors[field.id] = 'You must accept to proceed';
        } else if (field.type === 'file' && (!val || !val.dataUrl)) {
          newErrors[field.id] = `${field.label} is required (PDF under 1MB)`;
        } else if (field.type === 'multiselect' && (!Array.isArray(val) || val.length === 0)) {
          newErrors[field.id] = `Please select at least one option`;
        } else if (val === undefined || val === null || String(val).trim() === '') {
          newErrors[field.id] = `${field.label} is required`;
        }
      }

      // Format-specific checks
      if (val && typeof val === 'string' && val.trim().length > 0) {
        if (field.type === 'phone') {
          const digits = val.replace(/\D/g, '');
          if (digits.length !== 10) {
            newErrors[field.id] = 'Enter a valid 10-digit mobile number';
          }
        } else if (field.type === 'url') {
          try {
            new URL(val.startsWith('http') ? val : `https://${val}`);
          } catch {
            newErrors[field.id] = 'Enter a valid website URL';
          }
        }
      }
    });

    setErrors(newErrors);

    if (scrollToError && Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`field_${firstErrorKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  // Progress hint calculation
  const progressHint = useMemo(() => {
    let requiredCount = 4; // fullName, email, roleTier, interests
    let filledCount = 0;

    if (fullName.trim()) filledCount++;
    if (email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) filledCount++;
    if (roleTier) filledCount++;
    if (interests.length > 0) filledCount++;

    fields.forEach((f) => {
      if (f.locked) return;
      if (f.required) {
        requiredCount++;
        const val = answers[f.id];
        if (f.type === 'checkbox' && val === true) filledCount++;
        else if (f.type === 'file' && val?.dataUrl) filledCount++;
        else if (f.type === 'phone' && String(val).replace(/\D/g, '').length === 10) filledCount++;
        else if (val && String(val).trim().length > 0) filledCount++;
      }
    });

    const isComplete = filledCount >= requiredCount;
    return { filledCount, requiredCount, isComplete };
  }, [fullName, email, roleTier, interests, answers, fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    onProceedToReview({
      participantName: fullName.trim(),
      participantEmail: email.trim().toLowerCase(),
      roleTier,
      interests,
      phone: answers.phone || '',
      company: answers.organization || '',
      answers: {
        ...answers,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        ticket_tier: roleTier,
        interests,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Details</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              progressHint.isComplete
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {progressHint.filledCount} of {progressHint.requiredCount} required fields completed
          </span>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs">
        <div>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">
            Official Registration
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Application for {event.title}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Fill in your details below. Answers auto-save automatically as you type.
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: LOCKED MANDATORY FIELDS */}
          <div className="p-4 sm:p-5 bg-black border border-neutral-800/90 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Identity & Admission Tier (Locked Fields)</span>
            </h3>

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div id="field_full_name">
                <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.full_name) setErrors({ ...errors, full_name: '' });
                  }}
                  className={`w-full px-3 py-2 bg-neutral-900 border rounded-xl text-neutral-100 focus:outline-none ${
                    errors.full_name ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                  }`}
                  placeholder="Enter full name"
                />
                <p className="text-[10px] text-neutral-500 mt-1">Printed on gate pass</p>
                {errors.full_name && <p className="text-[11px] text-rose-400 mt-0.5">{errors.full_name}</p>}
              </div>

              <div id="field_email">
                <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`w-full px-3 py-2 bg-neutral-900 border rounded-xl text-neutral-100 focus:outline-none ${
                    errors.email ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                  }`}
                  placeholder="name@example.com"
                />
                <p className="text-[10px] text-neutral-500 mt-1">Your ticket will be delivered here</p>
                {errors.email && <p className="text-[11px] text-rose-400 mt-0.5">{errors.email}</p>}
              </div>
            </div>

            {/* Role / Ticket Tier */}
            <div id="field_ticket_tier">
              <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-1">
                Role / Admission Tier <span className="text-rose-400">*</span>
              </label>
              <select
                value={roleTier}
                onChange={(e) => {
                  setRoleTier(e.target.value);
                  if (errors.ticket_tier) setErrors({ ...errors, ticket_tier: '' });
                }}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none cursor-pointer"
              >
                {(event.ticketTiers || ['General Delegate', 'Volunteer', 'VIP Guest', 'Speaker / Presenter']).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-500 mt-1">Designates your access permissions</p>
              {errors.ticket_tier && <p className="text-[11px] text-rose-400 mt-0.5">{errors.ticket_tier}</p>}
            </div>

            {/* Interests & Topics (Chips + Suggest feature) */}
            <div id="field_interests" className="space-y-3 pt-2 border-t border-neutral-800/80">
              <div className="flex items-center justify-between">
                <label className="font-bold text-neutral-300 uppercase tracking-wider">
                  Interests & Discussion Topics <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-neutral-500">
                  {interests.length} selected
                </span>
              </div>

              {/* Selected Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl">
                {interests.length === 0 ? (
                  <span className="text-[11px] text-neutral-500 italic">
                    No interests chosen yet. Click tags below or use AI suggestion.
                  </span>
                ) : (
                  interests.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-white text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleInterest(tag)}
                        className="hover:text-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              {errors.interests && <p className="text-[11px] text-rose-400">{errors.interests}</p>}

              {/* Add Custom Tag Form */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  placeholder="Type a custom interest tag (e.g. Autonomous Shuttles)..."
                  className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomInterest(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomInterest}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              </div>

              {/* "Suggest my interests" AI box */}
              <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Interest Suggester</span>
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={suggestPrompt}
                  onChange={(e) => setSuggestPrompt(e.target.value)}
                  placeholder="Describe your background or goals (e.g. 'I am a municipal engineer passionate about cycling networks and solar power')..."
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 text-xs focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSuggestInterests}
                    disabled={isSuggesting || !suggestPrompt.trim()}
                    className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSuggesting ? 'Analyzing...' : 'Suggest My Interests'}</span>
                  </button>

                  {suggestedTags.length > 0 && (
                    <span className="text-[10px] text-neutral-500">
                      Click tags to accept:
                    </span>
                  )}
                </div>

                {suggestedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAcceptSuggestedTag(tag)}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-amber-400" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: DYNAMIC ADDITIONAL FIELDS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Event Details & Questionnaire</span>
            </h3>

            {fields
              .filter((f) => !f.locked)
              .map((field) => {
                const val = answers[field.id];
                const error = errors[field.id];

                return (
                  <div key={field.id} id={`field_${field.id}`} className="space-y-1">
                    <label className="block font-bold text-neutral-300 uppercase tracking-wider">
                      {field.label} {field.required && <span className="text-rose-400">*</span>}
                    </label>

                    {/* text, email, phone, number, url, date */}
                    {(field.type === 'text' ||
                      field.type === 'email' ||
                      field.type === 'phone' ||
                      field.type === 'number' ||
                      field.type === 'url' ||
                      field.type === 'date') && (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none ${
                          error ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                        }`}
                      />
                    )}

                    {/* textarea */}
                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none ${
                          error ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                        }`}
                      />
                    )}

                    {/* dropdown */}
                    {field.type === 'dropdown' && (
                      <select
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Choose an option --</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* radio */}
                    {field.type === 'radio' && (
                      <div className="space-y-1.5 pt-1">
                        {(field.options || []).map((opt) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer text-neutral-300">
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              checked={val === opt}
                              onChange={() => handleAnswerChange(field.id, opt)}
                              className="text-white focus:ring-0"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* checkbox */}
                    {field.type === 'checkbox' && (
                      <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => handleAnswerChange(field.id, e.target.checked)}
                          className="mt-0.5 rounded border-neutral-700 text-white focus:ring-0"
                        />
                        <span className="text-neutral-300 text-xs leading-snug">
                          {field.placeholder || field.helpText || 'I agree to the stated terms'}
                        </span>
                      </label>
                    )}

                    {/* multiselect */}
                    {field.type === 'multiselect' && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(field.options || []).map((opt) => {
                          const currentArr: string[] = Array.isArray(val) ? val : [];
                          const isSel = currentArr.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const next = isSel
                                  ? currentArr.filter((x) => x !== opt)
                                  : [...currentArr, opt];
                                handleAnswerChange(field.id, next);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                isSel
                                  ? 'bg-white text-black border-white font-bold'
                                  : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* file upload (PDF only, max 1MB) */}
                    {field.type === 'file' && (
                      <div className="p-3 bg-black border border-neutral-800 rounded-xl space-y-2">
                        <div className="flex items-center gap-3">
                          <label className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload PDF</span>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => handleFileUpload(field.id, e)}
                              className="hidden"
                            />
                          </label>
                          {val?.name ? (
                            <div className="flex items-center gap-2 text-emerald-400 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="truncate max-w-xs">{val.name} ({Math.round(val.size / 1024)} KB)</span>
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-[11px]">Max 1MB, PDF only</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Host help text */}
                    {field.helpText && field.type !== 'checkbox' && (
                      <p className="text-[10px] text-neutral-500 mt-0.5">{field.helpText}</p>
                    )}

                    {/* Error message */}
                    {error && (
                      <p className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {error}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!progressHint.isComplete}
              className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <span>Review Application</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
