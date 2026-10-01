import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Calendar,
  MapPin,
  Clock,
  User,
  Mail,
  Tag,
  Building,
  ShieldCheck
} from 'lucide-react';
import { EventMetadata } from '../types';

interface ReviewApplicationViewProps {
  event: EventMetadata;
  applicationData: {
    participantName: string;
    participantEmail: string;
    roleTier: string;
    interests: string[];
    phone?: string;
    company?: string;
    answers: Record<string, any>;
  };
  onEdit: () => void;
  onConfirm: () => Promise<void>;
  serverError?: string | null;
}

export const ReviewApplicationView: React.FC<ReviewApplicationViewProps> = ({
  event,
  applicationData,
  onEdit,
  onConfirm,
  serverError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(serverError || null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <button
          onClick={onEdit}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Edit Form</span>
        </button>

        <span className="text-xs text-neutral-400">Step 2 of 2: Review & Confirm</span>
      </div>

      {/* Review Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs">
        <div>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">
            Verification Review
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Review Your Registration Answers
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Please confirm your application details for <strong className="text-neutral-200">{event.title}</strong> before ticket generation.
          </p>
        </div>

        {/* Error Notification */}
        {localError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Submission Error</span>
              <span>{localError}</span>
            </div>
          </div>
        )}

        {/* Event Quick Summary */}
        <div className="p-4 bg-black border border-neutral-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded text-[10px] font-bold uppercase">
              {event.category}
            </span>
            <span className="text-[11px] text-neutral-400 font-semibold">{event.entryType}</span>
          </div>
          <h3 className="text-sm font-bold text-white">{event.title}</h3>
          <div className="flex flex-wrap items-center gap-4 text-neutral-400 text-xs pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              {new Date(event.startDateTime).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-500" />
              {event.venue}, {event.city}
            </span>
          </div>
        </div>

        {/* Review Answers List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="font-bold text-white uppercase text-xs tracking-wider">
              Applicant Answers
            </span>
            <button
              onClick={onEdit}
              disabled={isSubmitting}
              className="text-neutral-400 hover:text-white flex items-center gap-1 font-semibold text-xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Full Name</span>
              <span className="font-bold text-white text-xs">{applicationData.participantName}</span>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Email Address</span>
              <span className="font-bold text-white text-xs">{applicationData.participantEmail}</span>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Admission Tier</span>
              <span className="font-bold text-emerald-400 text-xs">{applicationData.roleTier}</span>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Contact Phone</span>
              <span className="text-neutral-200 text-xs">{applicationData.phone || 'None provided'}</span>
            </div>

            {applicationData.company && (
              <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Affiliation</span>
                <span className="text-neutral-200 text-xs">{applicationData.company}</span>
              </div>
            )}
          </div>

          {/* Interests */}
          {applicationData.interests && applicationData.interests.length > 0 && (
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1.5">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Selected Discussion & Workshop Interests
              </span>
              <div className="flex flex-wrap gap-1.5">
                {applicationData.interests.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[11px]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Questionnaire Answers */}
          {Object.entries(applicationData.answers).filter(
            ([key]) =>
              key !== 'full_name' &&
              key !== 'email' &&
              key !== 'ticket_tier' &&
              key !== 'interests' &&
              key !== 'phone' &&
              key !== 'organization'
          ).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-800/60">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Additional Questionnaire Answers
              </span>
              <div className="space-y-2">
                {Object.entries(applicationData.answers)
                  .filter(
                    ([key]) =>
                      key !== 'full_name' &&
                      key !== 'email' &&
                      key !== 'ticket_tier' &&
                      key !== 'interests' &&
                      key !== 'phone' &&
                      key !== 'organization'
                  )
                  .map(([key, val]) => (
                    <div key={key} className="p-2.5 bg-black border border-neutral-800/60 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-neutral-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-semibold text-neutral-200">
                        {typeof val === 'boolean'
                          ? val
                            ? 'Accepted'
                            : 'Declined'
                          : typeof val === 'object' && val?.name
                          ? `${val.name} (File)`
                          : String(val)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onEdit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Edit Answers
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-40 font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <span>{isSubmitting ? 'Submitting Registration...' : 'Confirm Registration'}</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
