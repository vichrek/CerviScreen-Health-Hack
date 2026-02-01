import { useState } from 'react';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/app/components/ui/checkbox';

interface ConsentEligibilityProps {
  onComplete: (data: { consent: boolean; eligibility: EligibilityData }) => void;
}

interface EligibilityData {
  ageConfirmed: boolean;
  hasCervix: boolean;
  notPregnant: boolean;
  noRecentScreening: boolean;
}

export function ConsentEligibility({ onComplete }: ConsentEligibilityProps) {
  const [step, setStep] = useState<'welcome' | 'eligibility' | 'consent'>('welcome');
  
  // Eligibility state
  const [eligibility, setEligibility] = useState<EligibilityData>({
    ageConfirmed: false,
    hasCervix: false,
    notPregnant: false,
    noRecentScreening: false,
  });

  // Consent state
  const [consentItems, setConsentItems] = useState({
    understandPurpose: false,
    agreeDataStorage: false,
    agreeImageCapture: false,
    understandNotDiagnostic: false,
    canWithdraw: false,
  });

  const allEligibilityMet = Object.values(eligibility).every(v => v === true);
  const allConsentGiven = Object.values(consentItems).every(v => v === true);

  const handleContinue = () => {
    if (step === 'welcome') {
      setStep('eligibility');
    } else if (step === 'eligibility' && allEligibilityMet) {
      setStep('consent');
    } else if (step === 'consent' && allConsentGiven) {
      onComplete({ consent: true, eligibility });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress indicator */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1">
          <div className="bg-white">
            <div 
              className="h-1 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
              style={{ 
                width: step === 'welcome' ? '33%' : step === 'eligibility' ? '66%' : '100%' 
              }}
            />
          </div>
        </div>

        <div className="p-8">
          {step === 'welcome' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl mb-2">Welcome to CerviScreen</h1>
                <p className="text-gray-600">At-Home Cervical Screening Service</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg mb-3">What is this service?</h2>
                <p className="text-sm text-gray-700 mb-4">
                  CerviScreen enables you to perform cervical screening from the comfort of your home using a specialized imaging device. Your images and information will be securely transmitted to healthcare professionals for review and triage.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Safe, private, and convenient screening at home</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Professional review by qualified clinicians</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Clear guidance and support throughout the process</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleContinue}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                Get Started
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 'eligibility' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl mb-2">Eligibility Check</h1>
                <p className="text-gray-600">Please confirm the following to ensure this service is right for you</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id="age"
                    checked={eligibility.ageConfirmed}
                    onCheckedChange={(checked) => 
                      setEligibility(prev => ({ ...prev, ageConfirmed: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="age" className="flex-1 cursor-pointer">
                    <p className="font-medium mb-1">I am between 25 and 64 years old</p>
                    <p className="text-sm text-gray-600">Cervical screening is recommended for this age group</p>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id="hasCervix"
                    checked={eligibility.hasCervix}
                    onCheckedChange={(checked) => 
                      setEligibility(prev => ({ ...prev, hasCervix: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="hasCervix" className="flex-1 cursor-pointer">
                    <p className="font-medium mb-1">I have a cervix</p>
                    <p className="text-sm text-gray-600">This screening is for people with a cervix, regardless of current gender identity</p>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id="notPregnant"
                    checked={eligibility.notPregnant}
                    onCheckedChange={(checked) => 
                      setEligibility(prev => ({ ...prev, notPregnant: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="notPregnant" className="flex-1 cursor-pointer">
                    <p className="font-medium mb-1">I am not currently pregnant</p>
                    <p className="text-sm text-gray-600">Screening during pregnancy requires different procedures</p>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id="noRecentScreening"
                    checked={eligibility.noRecentScreening}
                    onCheckedChange={(checked) => 
                      setEligibility(prev => ({ ...prev, noRecentScreening: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="noRecentScreening" className="flex-1 cursor-pointer">
                    <p className="font-medium mb-1">I have not had cervical screening in the past 12 months</p>
                    <p className="text-sm text-gray-600">Screening is typically done every 3-5 years unless advised otherwise</p>
                  </label>
                </div>
              </div>

              {!allEligibilityMet && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Please confirm all eligibility criteria to continue. If you're unsure about any criteria, please contact your healthcare provider.
                  </p>
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={!allEligibilityMet}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue to Consent
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 'consent' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl mb-2">Informed Consent</h1>
                <p className="text-gray-600">Please read and confirm your understanding of the following</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id="understandPurpose"
                    checked={consentItems.understandPurpose}
                    onCheckedChange={(checked) => 
                      setConsentItems(prev => ({ ...prev, understandPurpose: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="understandPurpose" className="flex-1 cursor-pointer">
                    <p className="font-medium mb-1">I understand the purpose of this screening</p>
                    <p className="text-sm text-gray-600">This screening helps detect early changes in cervical cells that could develop into cancer if left untreated</p>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id="agreeDataStorage"
                    checked={consentItems.agreeDataStorage}
                    onCheckedChange={(checked) => 
                      setConsentItems(prev => ({ ...prev, agreeDataStorage: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="agreeDataStorage" className="flex-1 cursor-pointer">
                    <p className="font-medium mb-1">I consent to secure storage of my data and images</p>
                    <p className="text-sm text-gray-600">Your data will be stored securely in compliance with data protection regulations and only accessed by authorized healthcare staff</p>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id="agreeImageCapture"
                    checked={consentItems.agreeImageCapture}
                    onCheckedChange={(checked) => 
                      setConsentItems(prev => ({ ...prev, agreeImageCapture: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="agreeImageCapture" className="flex-1 cursor-pointer">
                    <p className="font-medium mb-1">I consent to capturing and transmitting cervical images</p>
                    <p className="text-sm text-gray-600">Images will be captured using the home screening device and securely transmitted to healthcare professionals for review</p>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id="understandNotDiagnostic"
                    checked={consentItems.understandNotDiagnostic}
                    onCheckedChange={(checked) => 
                      setConsentItems(prev => ({ ...prev, understandNotDiagnostic: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="understandNotDiagnostic" className="flex-1 cursor-pointer">
                    <p className="font-medium mb-1">I understand this is decision-support, not autonomous diagnosis</p>
                    <p className="text-sm text-gray-600">Any automated analysis is used only to support clinical decisions. All final decisions are made by qualified healthcare professionals</p>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id="canWithdraw"
                    checked={consentItems.canWithdraw}
                    onCheckedChange={(checked) => 
                      setConsentItems(prev => ({ ...prev, canWithdraw: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="canWithdraw" className="flex-1 cursor-pointer">
                    <p className="font-medium mb-1">I understand I can withdraw consent at any time</p>
                    <p className="text-sm text-gray-600">You have the right to withdraw from the screening process at any point before final clinical review</p>
                  </label>
                </div>
              </div>

              {!allConsentGiven && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Please confirm all consent items to proceed with the screening process.
                  </p>
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={!allConsentGiven}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Complete & Continue to Dashboard
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
