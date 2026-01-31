import { useState } from 'react';
import { CheckCircle2, AlertTriangle, FileText, Send } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface ClinicalDecisionProps {
  patientId: string;
  patientName: string;
  imageQualityScore?: number;
  triageFlags?: string[];
  open: boolean;
  onClose: () => void;
  onDecisionSubmit: (decision: ClinicalDecisionData) => void;
}

interface ClinicalDecisionData {
  patientId: string;
  decision: 'reassure' | 'repeat' | 'hpv-test' | 'refer-routine' | 'refer-urgent';
  notes: string;
  urgency?: 'routine' | 'two-week' | 'urgent';
  timestamp: Date;
}

export function ClinicalDecision({
  patientId,
  patientName,
  imageQualityScore,
  triageFlags = [],
  open,
  onClose,
  onDecisionSubmit,
}: ClinicalDecisionProps) {
  const [decision, setDecision] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('routine');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) {
      alert('Please select a clinical decision');
      return;
    }

    if (!notes.trim()) {
      alert('Please provide clinical notes for your decision');
      return;
    }

    setSubmitting(true);

    const decisionData: ClinicalDecisionData = {
      patientId,
      decision: decision as ClinicalDecisionData['decision'],
      notes,
      urgency: decision.includes('refer') ? (urgency as ClinicalDecisionData['urgency']) : undefined,
      timestamp: new Date(),
    };

    setTimeout(() => {
      onDecisionSubmit(decisionData);
      setSubmitting(false);
      handleClose();
    }, 1000);
  };

  const handleClose = () => {
    setDecision('');
    setUrgency('routine');
    setNotes('');
    onClose();
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'gray';
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const qualityColor = getQualityColor(imageQualityScore);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Clinical Decision</DialogTitle>
          <p className="text-gray-600">Patient: {patientName}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Decision Support Information */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Decision Support Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Image Quality */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Image Quality Score</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${qualityColor}-500`} />
                  <span className="text-lg font-medium">
                    {imageQualityScore ? `${imageQualityScore}%` : 'Not assessed'}
                  </span>
                </div>
                {imageQualityScore && imageQualityScore < 70 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Consider requesting repeat capture for better quality
                  </p>
                )}
              </div>

              {/* Triage Flags */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Automated Triage Flags</p>
                {triageFlags.length > 0 ? (
                  <div className="space-y-1">
                    {triageFlags.map((flag, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">{flag}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No flags detected</p>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3 flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Important Reminder</p>
                <p>
                  Automated analysis is for decision support only. Final clinical decisions 
                  must be based on your professional judgment, clinical guidelines, and all 
                  available patient information.
                </p>
              </div>
            </div>
          </div>

          {/* Clinical Decision Options */}
          <div>
            <h3 className="font-medium mb-3">Select Clinical Decision</h3>
            <RadioGroup value={decision} onValueChange={setDecision} className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <RadioGroupItem value="reassure" id="reassure" className="mt-1" />
                <Label htmlFor="reassure" className="flex-1 cursor-pointer">
                  <p className="font-medium mb-1">Reassure - Return to routine recall</p>
                  <p className="text-sm text-gray-600">
                    No abnormalities detected. Patient returns to standard screening schedule.
                  </p>
                </Label>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                <RadioGroupItem value="repeat" id="repeat" className="mt-1" />
                <Label htmlFor="repeat" className="flex-1 cursor-pointer">
                  <p className="font-medium mb-1">Request Repeat Capture</p>
                  <p className="text-sm text-gray-600">
                    Image quality insufficient or inconclusive findings. Request new images.
                  </p>
                </Label>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <RadioGroupItem value="hpv-test" id="hpv-test" className="mt-1" />
                <Label htmlFor="hpv-test" className="flex-1 cursor-pointer">
                  <p className="font-medium mb-1">Arrange HPV Test</p>
                  <p className="text-sm text-gray-600">
                    Findings suggest need for HPV testing. Arrange sample collection and laboratory testing.
                  </p>
                </Label>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                <RadioGroupItem value="refer-routine" id="refer-routine" className="mt-1" />
                <Label htmlFor="refer-routine" className="flex-1 cursor-pointer">
                  <p className="font-medium mb-1">Refer to Colposcopy (Routine)</p>
                  <p className="text-sm text-gray-600">
                    Abnormalities detected requiring colposcopy examination. Non-urgent referral.
                  </p>
                </Label>
              </div>

              <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                <RadioGroupItem value="refer-urgent" id="refer-urgent" className="mt-1" />
                <Label htmlFor="refer-urgent" className="flex-1 cursor-pointer">
                  <p className="font-medium mb-1">Refer to Colposcopy (Urgent)</p>
                  <p className="text-sm text-gray-600">
                    Significant abnormalities detected. Urgent colposcopy referral required.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Urgency selection for referrals */}
          {(decision === 'refer-routine' || decision === 'refer-urgent') && (
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <h3 className="font-medium mb-3">Referral Urgency</h3>
              <RadioGroup value={urgency} onValueChange={setUrgency} className="space-y-2">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="routine" id="routine" />
                  <Label htmlFor="routine" className="cursor-pointer">
                    Routine (6-8 weeks)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="two-week" id="two-week" />
                  <Label htmlFor="two-week" className="cursor-pointer">
                    Two-week wait (suspected cancer pathway)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="cursor-pointer">
                    Urgent (within 48-72 hours)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Clinical Notes */}
          <div>
            <h3 className="font-medium mb-3">Clinical Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document your clinical assessment, findings, and rationale for this decision..."
              className="min-h-[150px] resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              These notes will be included in the patient record and referral letter (if applicable)
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!decision || !notes.trim() || submitting}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Decision</span>
                </>
              )}
            </button>
          </div>

          {/* Confirmation message */}
          {decision && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                Your decision will be recorded in the patient's record, and the patient will be 
                notified of the next steps via secure message and email.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
