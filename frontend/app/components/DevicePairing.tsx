import { useState } from 'react';
import { Bluetooth, CheckCircle2, Camera, Wifi, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface DevicePairingProps {
  open: boolean;
  onClose: () => void;
  onPairingComplete: () => void;
}

export function DevicePairing({ open, onClose, onPairingComplete }: DevicePairingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPairing, setIsPairing] = useState(false);
  const [pairingSuccess, setPairingSuccess] = useState(false);

  const steps = [
    {
      title: 'Prepare Your Device',
      icon: Camera,
      instructions: [
        'Remove the cervical screening device from its case',
        'Ensure the device is charged (LED should be green)',
        'Power on the device by pressing and holding the power button for 3 seconds',
        'Wait for the device LED to pulse blue, indicating it\'s ready to pair',
      ],
    },
    {
      title: 'Enable Bluetooth',
      icon: Bluetooth,
      instructions: [
        'Open your device\'s Bluetooth settings',
        'Ensure Bluetooth is turned on',
        'Keep the Bluetooth settings screen open',
        'Make sure you\'re within 10 feet (3 meters) of the screening device',
      ],
    },
    {
      title: 'Pair the Device',
      icon: Wifi,
      instructions: [
        'Look for "CervicalScreen-XXXX" in your available Bluetooth devices',
        'Tap on the device name to initiate pairing',
        'If prompted for a PIN, enter: 0000',
        'Wait for the confirmation message and the device LED to turn solid green',
      ],
    },
    {
      title: 'Test Connection',
      icon: CheckCircle2,
      instructions: [
        'Once paired, the device will vibrate briefly to confirm connection',
        'You should see a green checkmark on this screen',
        'If the connection fails, try moving closer to the device and repeat the pairing process',
        'Contact support if you continue to experience pairing issues',
      ],
    },
  ];

  const currentStepData = steps[currentStep];

  const handleStartPairing = () => {
    setIsPairing(true);
    // Simulate pairing process
    setTimeout(() => {
      setPairingSuccess(true);
      setIsPairing(false);
    }, 3000);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (pairingSuccess) {
      onPairingComplete();
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setPairingSuccess(false);
    setIsPairing(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Device Pairing</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  index < currentStep 
                    ? 'bg-green-500 border-green-500' 
                    : index === currentStep 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <span className={`text-sm ${
                      index === currentStep ? 'text-white' : 'text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Current step content */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <currentStepData.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</p>
                <h3 className="text-xl">{currentStepData.title}</h3>
              </div>
            </div>

            <div className="space-y-3">
              {currentStepData.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{instruction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pairing action for step 3 */}
          {currentStep === 2 && !pairingSuccess && (
            <div className="space-y-4">
              <button
                onClick={handleStartPairing}
                disabled={isPairing}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPairing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Pairing...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-5 h-5" />
                    <span>Start Pairing</span>
                  </>
                )}
              </button>

              {isPairing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Please wait while we establish a connection with your device. This may take a few moments.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Success message */}
          {pairingSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 mb-1">Device Paired Successfully!</p>
                <p className="text-sm text-green-700">
                  Your cervical screening device is now connected and ready to use.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={currentStep === 2 && !pairingSuccess}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Help text */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact support at <span className="text-blue-600 font-medium">support@cervicalscreen.com</span> or call <span className="text-blue-600 font-medium">1-800-SCREEN</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
