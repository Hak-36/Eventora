import React, { useState } from 'react';
import {
  Shield,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X
} from 'lucide-react';
import { UserAccount, HostProfile } from '../types';

interface HostProfileModalProps {
  currentUser: UserAccount;
  onSave: (updatedUser: UserAccount) => void;
  onCancel?: () => void;
  isMandatory?: boolean;
}

export const HostProfileModal: React.FC<HostProfileModalProps> = ({
  currentUser,
  onSave,
  onCancel,
  isMandatory = true,
}) => {
  const existing = currentUser.hostProfile;

  // Form states - prefilled with account name and email, all other fields manual
  const [fullName, setFullName] = useState(existing?.fullName || currentUser.name || '');
  const [organization, setOrganization] = useState(existing?.organization || '');
  const [hostType, setHostType] = useState<HostProfile['hostType']>(existing?.hostType || 'Company');
  const [designation, setDesignation] = useState(existing?.designation || '');
  const [officialEmail, setOfficialEmail] = useState(existing?.officialEmail || currentUser.email || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [city, setCity] = useState(existing?.city || '');
  const [state, setState] = useState(existing?.state || '');
  const [bio, setBio] = useState(existing?.bio || '');
  const [website, setWebsite] = useState(existing?.website || '');
  const [avatarUrl, setAvatarUrl] = useState(existing?.avatarUrl || '');
  const [isAuthorized, setIsAuthorized] = useState(existing?.isAuthorized || false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Image Upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, avatarUrl: 'Image must be under 2MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        setErrors((prev) => ({ ...prev, avatarUrl: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!organization.trim()) newErrors.organization = 'Organization, College, or Company name is required';
    if (!designation.trim()) newErrors.designation = 'Role or designation is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!officialEmail.trim()) {
      newErrors.officialEmail = 'Official email is required';
    } else if (!emailRegex.test(officialEmail.trim())) {
      newErrors.officialEmail = 'Enter a valid official email address';
    }

    // Phone validation: strip non-digits, must be exactly 10 digits
    const digits = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (digits.length !== 10) {
      newErrors.phone = 'Enter a valid 10-digit phone number (e.g. 4155552671)';
    }

    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State / Province is required';

    if (!bio.trim()) {
      newErrors.bio = 'Organization bio / about is required';
    } else if (bio.trim().length < 15) {
      newErrors.bio = 'Bio must be at least 15 characters describing your organizing entity';
    }

    if (!isAuthorized) {
      newErrors.isAuthorized = 'You must confirm you are authorized to organize events';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const profile: HostProfile = {
      fullName: fullName.trim(),
      organization: organization.trim(),
      hostType,
      designation: designation.trim(),
      officialEmail: officialEmail.trim(),
      phone: phone.replace(/\D/g, ''),
      city: city.trim(),
      state: state.trim(),
      bio: bio.trim(),
      website: website.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      isAuthorized,
    };

    const updatedUser: UserAccount = {
      ...currentUser,
      name: fullName.trim(),
      email: officialEmail.trim(),
      profileCompleted: true,
      hostProfile: profile,
    };

    onSave(updatedUser);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Organizer Credentials // Verification</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isMandatory ? 'Complete Your Host Profile' : 'Edit Organizer Profile'}
            </h2>
            <p className="text-xs text-neutral-400">
              {isMandatory
                ? 'Mandatory setup: Provide official organizer information before creating or managing public events.'
                : 'Update your official organization information, contact details, and credentials.'}
            </p>
          </div>

          {!isMandatory && onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 border border-transparent hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Logo or Profile Photo with Preview */}
          <div className="p-4 bg-black border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building className="w-7 h-7 text-neutral-500" />
              )}
            </div>
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <label className="text-xs font-bold text-neutral-300 block">
                Organization Logo or Profile Photo (Optional)
              </label>
              <p className="text-[11px] text-neutral-500">
                Upload PNG/JPG logo (Max 2MB). Shown on event passes and dispatch notices.
              </p>
              <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                <label className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="px-2.5 py-1 text-rose-400 hover:text-rose-300 text-[11px]"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 1: Full Name & Host Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
                Organizer Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                  }}
                  placeholder="e.g. Eleanor Vance"
                  className={`w-full pl-9 pr-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none ${
                    errors.fullName ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                  }`}
                />
              </div>
              {errors.fullName && <p className="text-[11px] text-rose-400 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
                Host Entity Type <span className="text-rose-400">*</span>
              </label>
              <select
                value={hostType}
                onChange={(e) => setHostType(e.target.value as HostProfile['hostType'])}
                className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none cursor-pointer"
              >
                <option value="Company">Company / Corporate Entity</option>
                <option value="College">College / University / School</option>
                <option value="NGO">NGO / Non-Profit Foundation</option>
                <option value="Government">Government / Municipal Agency</option>
                <option value="Individual">Individual Community Organizer</option>
              </select>
            </div>
          </div>

          {/* Row 2: Organization Name & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
                Organization / College / Company <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => {
                    setOrganization(e.target.value);
                    if (errors.organization) setErrors({ ...errors, organization: '' });
                  }}
                  placeholder="e.g. Metropolitan Civic & Cultural Board"
                  className={`w-full pl-9 pr-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none ${
                    errors.organization ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                  }`}
                />
              </div>
              {errors.organization && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.organization}</p>
              )}
            </div>

            <div>
              <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
                Your Designation / Role <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => {
                  setDesignation(e.target.value);
                  if (errors.designation) setErrors({ ...errors, designation: '' });
                }}
                placeholder="e.g. Director of Public Programs"
                className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none ${
                  errors.designation ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                }`}
              />
              {errors.designation && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.designation}</p>
              )}
            </div>
          </div>

          {/* Row 3: Official Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
                Official Contact Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => {
                    setOfficialEmail(e.target.value);
                    if (errors.officialEmail) setErrors({ ...errors, officialEmail: '' });
                  }}
                  placeholder="e.g. eleanor.vance@cityevents.org"
                  className={`w-full pl-9 pr-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none ${
                    errors.officialEmail ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                  }`}
                />
              </div>
              {errors.officialEmail && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.officialEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
                Phone Number (10 Digits) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="e.g. 4155552671"
                  className={`w-full pl-9 pr-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none ${
                    errors.phone ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Row 4: City, State, Website */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
                City <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (errors.city) setErrors({ ...errors, city: '' });
                  }}
                  placeholder="e.g. San Francisco"
                  className={`w-full pl-9 pr-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none ${
                    errors.city ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                  }`}
                />
              </div>
              {errors.city && <p className="text-[11px] text-rose-400 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
                State / Province <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  if (errors.state) setErrors({ ...errors, state: '' });
                }}
                placeholder="e.g. CA"
                className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none ${
                  errors.state ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
                }`}
              />
              {errors.state && <p className="text-[11px] text-rose-400 mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
                Website / Social Link
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.org"
                  className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Short Bio / About */}
          <div>
            <label className="block text-neutral-300 font-bold uppercase tracking-wider mb-1">
              Organization Bio / About <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                if (errors.bio) setErrors({ ...errors, bio: '' });
              }}
              placeholder="Describe your organization's mission, background, and the types of events you orchestrate..."
              className={`w-full px-3 py-2 bg-black border rounded-xl text-neutral-100 focus:outline-none leading-relaxed ${
                errors.bio ? 'border-rose-500' : 'border-neutral-800 focus:border-neutral-500'
              }`}
            />
            {errors.bio && <p className="text-[11px] text-rose-400 mt-1">{errors.bio}</p>}
          </div>

          {/* Required Authorization Checkbox */}
          <div className="p-3 bg-black border border-neutral-800 rounded-xl space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAuthorized}
                onChange={(e) => {
                  setIsAuthorized(e.target.checked);
                  if (errors.isAuthorized) setErrors({ ...errors, isAuthorized: '' });
                }}
                className="mt-0.5 rounded border-neutral-700 text-white focus:ring-0 cursor-pointer"
              />
              <span className="text-xs text-neutral-300 leading-snug">
                I confirm I am authorized to organize and broadcast public events on behalf of this organization.
                <span className="text-rose-400"> *</span>
              </span>
            </label>
            {errors.isAuthorized && (
              <p className="text-[11px] text-rose-400 pl-6">{errors.isAuthorized}</p>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
            {!isMandatory && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <span>{isMandatory ? 'Save Profile & Enter Hub' : 'Update Host Profile'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
