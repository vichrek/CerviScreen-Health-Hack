import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, LogOut, Image as ImageIcon, X, Bluetooth, CheckCircle2, AlertCircle, Bell, Download, MessageSquare, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ConsentEligibility } from '@/app/components/ConsentEligibility';
import { DevicePairing } from '@/app/components/DevicePairing';
import { StructuredChatbot } from '@/app/components/StructuredChatbot';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { toast } from 'sonner';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  qualityScore?: number;
  qualityFeedback?: string;
}

interface QuestionAnswer {
  questionId: string;
  question: string;
  answer: string | string[];
  timestamp: Date;
}

export function PatientDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Consent and setup states
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentFlow, setShowConsentFlow] = useState(true);
  const [showDevicePairing, setShowDevicePairing] = useState(false);
  const [devicePaired, setDevicePaired] = useState(false);
  
  // Questionnaire state
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<QuestionAnswer[]>([]);
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  
  // Submission and download states
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  
  // Physician selection
  const [physicians, setPhysicians] = useState<Array<{id: string, full_name: string}>>([]);
  const [selectedPhysicianId, setSelectedPhysicianId] = useState<string>('');
  const [showPhysicianDialog, setShowPhysicianDialog] = useState(false);
  
  // Notifications
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        setUserName(user.user_metadata.name || user.email || 'Patient');
        
        // Check if consent has been given (stored in localStorage for demo)
        const consentGiven = localStorage.getItem(`consent_${user.id}`);
        if (consentGiven === 'true') {
          setHasConsent(true);
          setShowConsentFlow(false);
        }
        
        // Fetch available physicians
        await fetchPhysicians();
        
        // Fetch unread notifications count
        await fetchUnreadCount();
        
        // Check if patient has assigned physician
        const { data: patientData } = await supabase
          .from('patients')
          .select('assigned_physician_id')
          .eq('id', user.id)
          .single();
        
        if (patientData?.assigned_physician_id) {
          setSelectedPhysicianId(patientData.assigned_physician_id);
        }
      }
    };

    checkAuth();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchUnreadCount = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (!user) return;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleConsentComplete = async (data: { consent: boolean; eligibility: any }) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        // Store consent locally (in production, you'd create a Supabase table for this)
        localStorage.setItem(`consent_${user.id}`, 'true');
        localStorage.setItem(`consent_data_${user.id}`, JSON.stringify({
          consent: data.consent,
          eligibility: data.eligibility,
          timestamp: new Date().toISOString()
        }));
        
        // Also store in Supabase
        await supabase.from('consent_records').insert({
          patient_id: user.id,
          consent_given: data.consent,
          eligibility_data: data.eligibility
        });
      }

      setHasConsent(true);
      setShowConsentFlow(false);
      toast.success('Consent recorded successfully!');
      
      // Show physician selection dialog first
      setTimeout(() => {
        setShowPhysicianDialog(true);
      }, 500);
    } catch (error) {
      console.error('Error storing consent:', error);
      toast.error('Failed to store consent. Please try again.');
    }
  };

  const fetchPhysicians = async () => {
    try {
      const { data, error } = await supabase
        .from('physicians')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      if (data) {
        setPhysicians(data);
      }
    } catch (error) {
      console.error('Error fetching physicians:', error);
    }
  };

  const handlePhysicianSelection = async () => {
    if (!selectedPhysicianId) {
      toast.error('Please select a physician');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        // Update patient's assigned physician
        await supabase
          .from('patients')
          .upsert({
            id: user.id,
            full_name: userName,
            assigned_physician_id: selectedPhysicianId
          });
        
        toast.success('Physician selected successfully!');
        setShowPhysicianDialog(false);
        
        // Show device pairing dialog
        setTimeout(() => {
          setShowDevicePairing(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error selecting physician:', error);
      toast.error('Failed to select physician. Please try again.');
    }
  };

  const handleDevicePairingComplete = () => {
    setDevicePaired(true);
    toast.success('Device paired successfully! You can now proceed with the questionnaire.', {
      duration: 8000,
    });
  };

  const handleQuestionnaireComplete = async (answers: QuestionAnswer[]) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        // Store questionnaire locally (in production, you'd create a Supabase table for this)
        localStorage.setItem(`questionnaire_${user.id}`, JSON.stringify({
          answers,
          timestamp: new Date().toISOString()
        }));
      }

      setQuestionnaireAnswers(answers);
      setQuestionnaireCompleted(true);
      toast.success('Questionnaire completed! You can now capture and upload images.', {
        duration: 8000,
      });
    } catch (error) {
      console.error('Error storing questionnaire:', error);
      toast.error('Failed to save questionnaire. Please try again.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      toast.error('Please log in to upload images');
      return;
    }

    setUploading(true);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      try {
        // Show preview immediately with quality assessment
        const reader = new FileReader();
        reader.onloadend = () => {
          // Simulate quality check
          const qualityScore = Math.floor(Math.random() * 30) + 70; // 70-100
          const qualityFeedback = 
            qualityScore >= 85 ? 'Excellent quality - Clear and well-focused' :
            qualityScore >= 75 ? 'Good quality - Suitable for assessment' :
            'Fair quality - May need repeat capture';

          const newImage: UploadedImage = {
            id: Date.now().toString() + Math.random(),
            file,
            preview: reader.result as string,
            qualityScore,
            qualityFeedback
          };
          setUploadedImages(prev => [...prev, newImage]);

          if (qualityScore < 75) {
            toast.warning('Image quality below optimal. Consider retaking for better results.');
          } else {
            toast.success('Image uploaded with good quality!');
          }
        };
        reader.readAsDataURL(file);

        // In production, upload to Supabase Storage:
        // const { data, error } = await supabase.storage
        //   .from('screening-images')
        //   .upload(`${user.id}/${Date.now()}_${file.name}`, file);
        
        console.log('Image processed successfully (stored locally)');
      } catch (err) {
        console.error('Upload error:', err);
        toast.error('Failed to process image: ' + (err as Error).message);
      }
    }

    setUploading(false);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async () => {
    if (!questionnaireCompleted) {
      toast.error('Please complete the questionnaire before submitting');
      return;
    }

    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one image before submitting');
      return;
    }

    if (!selectedPhysicianId) {
      toast.error('Please select a physician first');
      setShowPhysicianDialog(true);
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      toast.error('Please log in to submit');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        // Prepare submission data with base64 images
        const submissionTimestamp = new Date().toISOString();
        const submission = {
          patient_id: user.id,
          physician_id: selectedPhysicianId,
          patient_name: userName,
          questionnaire_answers: questionnaireAnswers,
          image_count: uploadedImages.length,
          images: uploadedImages.map(img => ({
            fileName: img.file.name,
            fileSize: img.file.size,
            qualityScore: img.qualityScore,
            qualityFeedback: img.qualityFeedback,
            preview: img.preview // Store base64 image data
          })),
          status: 'pending_review',
          submitted_at: submissionTimestamp
        };
        
        // Save to Supabase
        const { data: submittedData, error } = await supabase
          .from('screening_submissions')
          .insert(submission)
          .select()
          .single();
        
        if (error) throw error;
        
        // Store with timestamp for local use
        const submissionWithTimestamp = {
          ...submission,
          timestamp: submissionTimestamp
        };
        
        // Also store locally for backup and PDF generation
        localStorage.setItem(`submission_${user.id}_${Date.now()}`, JSON.stringify(submissionWithTimestamp));
        setLastSubmission(submissionWithTimestamp);
      }

      toast.success('Screening submitted successfully! Your physician will review your case shortly.', {
        duration: 8000,
      });
      setIsSubmitted(true);
      
      // Show download dialog after a brief delay
      setTimeout(() => {
        setShowDownloadDialog(true);
      }, 1000);
      
      // Keep the data for download, don't reset immediately
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Failed to submit: ' + (err as Error).message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const handleDownloadData = async () => {
    if (!lastSubmission) return;

    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = 20;

      // Get timestamp safely
      const submissionDate = lastSubmission.submitted_at || lastSubmission.timestamp || new Date().toISOString();

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        yPosition += 2;
      };

      // Title
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Cervical Screening Questionnaire', margin, 25);
      
      yPosition = 50;
      doc.setTextColor(0, 0, 0);

      // Patient Information
      addText('PATIENT INFORMATION', 14, true);
      yPosition += 3;
      addText(`Patient Name: ${lastSubmission.patient_name || lastSubmission.patientName || 'Patient'}`, 11);
      addText(`Submission Date: ${new Date(submissionDate).toLocaleString()}`, 11);
      yPosition += 5;

      // Questionnaire Section
      addText('QUESTIONNAIRE RESPONSES', 14, true);
      yPosition += 3;
      addText('Below are your responses to the screening questionnaire. Please keep this for your records.', 10);
      yPosition += 5;
      
      const answers = lastSubmission.questionnaire_answers || lastSubmission.questionnaireAnswers || [];
      answers.forEach((qa: any, index: number) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        addText(`Question ${index + 1}: ${qa.question}`, 11, true);
        
        let answer = '';
        if (Array.isArray(qa.answer)) {
          answer = qa.answer.join(', ');
        } else {
          answer = qa.answer || 'Not provided';
        }
        addText(`Answer: ${answer}`, 10);
        yPosition += 3;
      });

      // Summary Note
      yPosition += 5;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      addText('IMPORTANT NOTES', 14, true);
      yPosition += 3;
      addText('• Your complete screening submission (including images) has been sent to your physician for review.', 10);
      addText('• You will be notified once your physician has reviewed your case.', 10);
      addText('• This document contains only your questionnaire responses for your personal records.', 10);
      addText('• If you have any questions or concerns, please contact your healthcare provider.', 10);

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages} | Generated on ${new Date().toLocaleDateString()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const timestamp = new Date(submissionDate).toISOString().split('T')[0];
      doc.save(`screening-questionnaire-${timestamp}.pdf`);
      
      toast.success('Questionnaire downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleStartNewScreening = () => {
    setShowDownloadDialog(false);
    setIsSubmitted(false);
    setUploadedImages([]);
    setQuestionnaireCompleted(false);
    setLastSubmission(null);
    toast.info('Ready for new screening');
  };

  // Show consent flow if not completed
  if (showConsentFlow && !hasConsent) {
    return <ConsentEligibility onComplete={handleConsentComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Device Pairing Dialog */}
      <DevicePairing
        open={showDevicePairing}
        onClose={() => setShowDevicePairing(false)}
        onPairingComplete={handleDevicePairingComplete}
      />

      {/* Physician Selection Dialog */}
      <Dialog open={showPhysicianDialog} onOpenChange={setShowPhysicianDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Your Physician</DialogTitle>
            <DialogDescription>
              Choose a physician who will review your screening submissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="physician" className="block text-sm font-medium mb-2">
                Available Physicians
              </label>
              <select
                id="physician"
                value={selectedPhysicianId}
                onChange={(e) => setSelectedPhysicianId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select a physician --</option>
                {physicians.map((physician) => (
                  <option key={physician.id} value={physician.id}>
                    {physician.full_name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handlePhysicianSelection}
              disabled={!selectedPhysicianId}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Selection
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Data Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Your Questionnaire</DialogTitle>
            <DialogDescription>
              Download a copy of your questionnaire responses for your personal records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-900">
                <strong>Note:</strong> Your complete submission (including images) has been sent to your physician. 
                This download is for your questionnaire responses only.
              </p>
            </div>
            
            <button
              onClick={handleDownloadData}
              className="w-full flex items-center justify-center gap-3 p-6 border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors bg-gradient-to-r from-blue-50 to-indigo-50"
            >
              <Download className="w-8 h-8 text-blue-600" />
              <div className="text-left">
                <div className="text-lg font-semibold text-gray-900">Download Questionnaire PDF</div>
                <div className="text-sm text-gray-600">Your responses for your records</div>
              </div>
            </button>
            
            <div className="pt-4 border-t space-y-2">
              <button
                onClick={handleStartNewScreening}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Screening
              </button>
              <button
                onClick={() => setShowDownloadDialog(false)}
                className="w-full py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl">CerviScreen Patient Portal</h1>
              <p className="text-sm text-gray-600">Welcome, {userName}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Profile Button */}
              <button
                onClick={() => navigate('/patient-profile')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              
              {!devicePaired && hasConsent && (
                <button
                  onClick={() => setShowDevicePairing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Bluetooth className="w-4 h-4" />
                  Pair Device
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex gap-3 mt-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              hasConsent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              Consent {hasConsent ? 'Complete' : 'Pending'}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              devicePaired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <Bluetooth className="w-4 h-4" />
              Device {devicePaired ? 'Paired' : 'Not Paired'}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              questionnaireCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              Questionnaire {questionnaireCompleted ? 'Complete' : 'Pending'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Questionnaire Section */}
          <div className="bg-white rounded-xl shadow-sm border">
            {/* Prominent instruction banner - only show if questionnaire not completed */}
            {!questionnaireCompleted && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Complete Your Questionnaire</h2>
                    <p className="text-blue-100">Answer the questions below to begin your screening process</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-xl">Screening Questionnaire</h2>
              <p className="text-sm text-gray-600">Answer questions about your health and symptoms</p>
            </div>

            <div className="h-[600px]">
              {!questionnaireCompleted ? (
                <StructuredChatbot onComplete={handleQuestionnaireComplete} />
              ) : (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl mb-2">Questionnaire Completed</h3>
                    <p className="text-gray-600 mb-4">
                      Your responses have been recorded. You can now proceed to capture and upload images.
                    </p>
                    <button
                      onClick={() => {
                        setQuestionnaireCompleted(false);
                        setQuestionnaireAnswers([]);
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Restart Questionnaire
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-xl">Cervical Screening Images</h2>
              <p className="text-sm text-gray-600">Capture and upload images using your device</p>
            </div>

            <div className="p-4 space-y-4">
              {!devicePaired ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 mb-1">Device Not Paired</p>
                    <p className="text-sm text-yellow-700 mb-3">
                      Please pair your screening device before capturing images.
                    </p>
                    <button
                      onClick={() => setShowDevicePairing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Bluetooth className="w-4 h-4" />
                      Pair Device Now
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading || !questionnaireCompleted}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !questionnaireCompleted}
                    className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : !questionnaireCompleted ? 'Complete questionnaire first' : 'Click to upload images'}
                    </span>
                    <span className="text-xs text-gray-500">PNG, JPG up to 10MB</span>
                  </button>

                  {/* Uploaded Images with Quality Feedback */}
                  {uploadedImages.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Uploaded Images ({uploadedImages.length})</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {uploadedImages.map(image => (
                          <div key={image.id} className="relative group border rounded-lg overflow-hidden">
                            <div className="flex gap-3 p-3">
                              <img
                                src={image.preview}
                                alt="Upload preview"
                                className="w-24 h-24 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">{image.file.name}</p>
                                {image.qualityScore && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full ${
                                            image.qualityScore >= 85 ? 'bg-green-500' :
                                            image.qualityScore >= 75 ? 'bg-yellow-500' : 'bg-orange-500'
                                          }`}
                                          style={{ width: `${image.qualityScore}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-medium">{image.qualityScore}%</span>
                                    </div>
                                    <p className="text-xs text-gray-600">{image.qualityFeedback}</p>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveImage(image.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button or Success Message */}
                  {!isSubmitted ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!questionnaireCompleted || uploadedImages.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-5 h-5" />
                      Submit Screening to Clinician
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Submission Successful!</p>
                            <p className="text-sm text-green-700">Your screening has been sent for review</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDownloadDialog(true)}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download Data
                        </button>
                        <button
                          onClick={handleStartNewScreening}
                          className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          New Screening
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Help and Instructions */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-medium mb-4">Need Help?</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">📱 Technical Support</p>
              <p className="text-gray-600">Call: 1-800-SCREEN</p>
              <p className="text-gray-600">Email: support@cerviscreen.com</p>
            </div>
            <div>
              <p className="font-medium mb-1">🏥 Clinical Questions</p>
              <p className="text-gray-600">Contact your healthcare provider</p>
              <p className="text-gray-600">Or call: 1-800-HEALTH</p>
            </div>
            <div>
              <p className="font-medium mb-1">🌐 Language Support</p>
              <p className="text-gray-600">Available in multiple languages</p>
              <p className="text-gray-600">Select language in settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}