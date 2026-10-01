import React, { useState } from 'react';
import { QrCode, CheckCircle2, X, Camera, Sparkles, UserCheck } from 'lucide-react';
import { Participant } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onCheckIn: (participantId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  participants,
  onCheckIn,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [justScanned, setJustScanned] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingParticipants = participants.filter((p) => !p.isCheckedIn);

  const handleSimulateScan = (id: string) => {
    onCheckIn(id);
    const p = participants.find((x) => x.id === id);
    setJustScanned(p ? p.name : 'Attendee');
    setTimeout(() => {
      setJustScanned(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300">
              <QrCode className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">QR Check-in Scanner</h3>
              <p className="text-xs text-neutral-400">Rapid gate validation via FastPass engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder simulation (Pitch black inner tile with green scan laser) */}
        <div className="p-6 space-y-5">
          <div className="relative h-48 bg-black rounded-lg border border-neutral-800 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            {/* Indication laser green */}
            <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" />
            
            <div className="relative z-10 w-28 h-28 border-2 border-dashed border-neutral-700 rounded-xl flex items-center justify-center p-2">
              <Camera className="w-8 h-8 text-neutral-600 animate-pulse" />
            </div>

            <p className="relative z-10 mt-3 text-xs text-neutral-400">
              [GATE VALIDATION SCANNER ACTIVE]
            </p>
          </div>

          {justScanned && (
            <div className="p-3 bg-black border border-emerald-500/30 rounded-lg flex items-center gap-3 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                <strong>{justScanned}</strong> checked in successfully!
              </span>
            </div>
          )}

          {/* Quick Select Attendee to simulate Scan */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
              <span>Simulate Badge Scan on Unchecked Attendee</span>
              <span className="text-neutral-500 text-[11px]">
                {pendingParticipants.length} pending
              </span>
            </label>
            <div className="flex gap-2">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="flex-1 px-3 py-2 bg-black border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-neutral-500"
              >
                <option value="">Choose an unchecked attendee...</option>
                {pendingParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.ticketTier} — {p.company})
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedId}
                onClick={() => {
                  if (selectedId) {
                    handleSimulateScan(selectedId);
                    setSelectedId('');
                  }
                }}
                className="px-4 py-2 bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:pointer-events-none text-black text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-black" />
                Scan Badge
              </button>
            </div>
          </div>

          {/* Recently checked list */}
          <div className="pt-2 border-t border-neutral-800">
            <p className="text-xs text-neutral-400 mb-2">Instant Check-in Quick Buttons:</p>
            <div className="flex flex-wrap gap-2">
              {pendingParticipants.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSimulateScan(p.id)}
                  className="px-2.5 py-1 text-xs bg-black hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-neutral-400" />
                  {p.name}
                </button>
              ))}
              {pendingParticipants.length === 0 && (
                <span className="text-xs text-emerald-400">All registered attendees have checked in!</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
