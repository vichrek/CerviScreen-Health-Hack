import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Calendar, MessageSquare, Image as ImageIcon, ChevronDown, ChevronUp, FileCheck, AlertTriangle, TrendingUp, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ClinicalDecision } from '@/app/components/ClinicalDecision';
import { toast } from 'sonner';

interface PatientSubmission {
  patientId: string;
  patientName: string;
  messages: Array<{
    text: string;
    timestamp: Date;
  }>;
  timestamp: string;
  questionnaireAnswers?: any[];
  imageQualityScore?: number;
  triageFlags?: string[];
}

interface MedicalImage {
  patientId: string;
  patientName: string;
  fileName: string;
  originalName: string;
  uploadedAt: string;
  url: string | null;
  qualityScore?: number;
}

interface ClinicalDecisionData {
  patientId: string;
  decision: 'reassure' | 'repeat' | 'hpv-test' | 'refer-routine' | 'refer-urgent';
  notes: string;
  urgency?: 'routine' | 'two-week' | 'urgent';
  timestamp: Date;
}

export function PhysicianDashboard() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<PatientSubmission[]>([]);
  const [images, setImages] = useState<MedicalImage[]>([]);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Clinical decision dialog state
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    name: string;
    imageQualityScore?: number;
    triageFlags?: string[];
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const userRole = localStorage.getItem('userRole');
      
      if (!accessToken || userRole !== 'physician') {
        navigate('/');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        setUserName(user.user_metadata.name || user.email || 'Physician');
      }

      await fetchData(accessToken);
    };

    checkAuth();
  }, [navigate]);

  const fetchData = async (accessToken: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (!user) return;

      // Fetch submissions assigned to this physician
      const { data: submissions, error: submissionsError } = await supabase
        .from('screening_submissions')
        .select('*')
        .eq('physician_id', user.id)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
      }

      if (submissions && submissions.length > 0) {
        // Transform to match the interface
        const transformedSubmissions: PatientSubmission[] = submissions.map(sub => ({
          patientId: sub.patient_id,
          patientName: sub.patient_name,
          messages: [
            { text: `Submitted ${sub.image_count} images`, timestamp: new Date(sub.submitted_at) }
          ],
          timestamp: sub.submitted_at,
          questionnaireAnswers: sub.questionnaire_answers,
          imageQualityScore: sub.images?.[0]?.qualityScore || 0,
          triageFlags: sub.images?.some((img: any) => img.qualityScore < 75) 
            ? ['Low image quality detected'] 
            : []
        }));

        setSubmissions(transformedSubmissions);

        // Transform images with preview URLs
        const allImages: MedicalImage[] = [];
        submissions.forEach(sub => {
          if (sub.images && Array.isArray(sub.images)) {
            sub.images.forEach((img: any, idx: number) => {
              allImages.push({
                patientId: sub.patient_id,
                patientName: sub.patient_name,
                fileName: img.fileName,
                originalName: img.fileName,
                uploadedAt: sub.submitted_at,
                url: img.preview || null, // Use the base64 preview
                qualityScore: img.qualityScore
              });
            });
          }
        });
        setImages(allImages);
      } else {
        // No submissions yet - show empty state
        setSubmissions([]);
        setImages([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const togglePatientDetails = (patientId: string) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId);
  };

  const handleMakeDecision = (patientId: string, patientName: string, imageQualityScore?: number, triageFlags?: string[]) => {
    setSelectedPatient({
      id: patientId,
      name: patientName,
      imageQualityScore,
      triageFlags
    });
    setShowDecisionDialog(true);
  };

  const handleDecisionSubmit = async (decision: ClinicalDecisionData) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (!user) return;

      // Find the submission for this patient
      const { data: submissions } = await supabase
        .from('screening_submissions')
        .select('id')
        .eq('patient_id', decision.patientId)
        .eq('physician_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (submissions && submissions.length > 0) {
        const submissionId = submissions[0].id;
        
        // Save clinical decision
        await supabase.from('clinical_decisions').insert({
          submission_id: submissionId,
          physician_id: user.id,
          decision_type: decision.decision,
          notes: decision.notes,
          urgency: decision.urgency
        });

        // Update submission status
        await supabase
          .from('screening_submissions')
          .update({ 
            status: 'reviewed',
            reviewed_at: new Date().toISOString()
          })
          .eq('id', submissionId);

        // Create notification for patient
        const notificationTitle = getDecisionTitle(decision.decision);
        const notificationMessage = createNotificationMessage(decision);
        
        await supabase.from('notifications').insert({
          patient_id: decision.patientId,
          physician_id: user.id,
          submission_id: submissionId,
          title: notificationTitle,
          message: notificationMessage,
          notification_type: decision.urgency === 'urgent' ? 'urgent' : 'clinical_decision'
        });
      }

      // Also store locally for backup
      localStorage.setItem(
        `decision_${decision.patientId}_${Date.now()}`,
        JSON.stringify({
          ...decision,
          physicianId: user.id,
          physicianName: userName
        })
      );

      toast.success('Clinical decision recorded and patient notified');
      
      // Refresh data
      await fetchData(accessToken);
    } catch (error) {
      console.error('Error storing decision:', error);
      toast.error('Failed to store decision');
    }
  };

  const getDecisionTitle = (decisionType: string): string => {
    const titles: Record<string, string> = {
      'reassure': 'Normal Results - No Action Needed',
      'repeat': 'Repeat Screening Recommended',
      'hpv-test': 'HPV Test Recommended',
      'refer-routine': 'Routine Referral Required',
      'refer-urgent': 'Urgent Referral Required'
    };
    return titles[decisionType] || 'Screening Results Available';
  };

  const createNotificationMessage = (decision: ClinicalDecisionData): string => {
    let message = `Your cervical screening has been reviewed by Dr. ${userName}.\n\n`;
    
    const recommendations: Record<string, string> = {
      'reassure': 'Good news! Your screening results are normal. Continue with routine screening as recommended.',
      'repeat': 'We recommend repeating your screening. Please schedule a follow-up appointment.',
      'hpv-test': 'An HPV test is recommended as a follow-up. Please contact us to arrange this.',
      'refer-routine': 'A referral to a specialist has been arranged for further evaluation. You will be contacted with appointment details.',
      'refer-urgent': 'URGENT: A specialist referral has been made. You will be contacted within 48 hours with appointment details.'
    };
    
    message += recommendations[decision.decision] || 'Please review your results and contact us if you have questions.';
    
    if (decision.notes) {
      message += `\n\nPhysician Notes:\n${decision.notes}`;
    }
    
    return message;
  };

  // Group submissions and images by patient
  const patientData = new Map<string, { submissions: PatientSubmission[], images: MedicalImage[] }>();
  
  submissions.forEach(submission => {
    if (!patientData.has(submission.patientId)) {
      patientData.set(submission.patientId, { submissions: [], images: [] });
    }
    patientData.get(submission.patientId)?.submissions.push(submission);
  });

  images.forEach(image => {
    if (!patientData.has(image.patientId)) {
      patientData.set(image.patientId, { submissions: [], images: [] });
    }
    patientData.get(image.patientId)?.images.push(image);
  });

  // Calculate statistics
  const highPriorityCount = submissions.filter(s => s.triageFlags && s.triageFlags.length > 0).length;
  const lowQualityImages = images.filter(img => img.qualityScore && img.qualityScore < 75).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl">CervicalScreen - Clinician Dashboard</h1>
            <p className="text-sm text-gray-600">Dr. {userName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-3xl mt-1">{patientData.size}</p>
              </div>
              <User className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Submissions</p>
                <p className="text-3xl mt-1">{submissions.length}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-3xl mt-1">{highPriorityCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Images Received</p>
                <p className="text-3xl mt-1">{images.length}</p>
              </div>
              <ImageIcon className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(highPriorityCount > 0 || lowQualityImages > 0) && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 mb-1">Attention Required</p>
                <ul className="text-sm text-orange-700 space-y-1">
                  {highPriorityCount > 0 && (
                    <li>• {highPriorityCount} patient{highPriorityCount !== 1 ? 's' : ''} with triage flags requiring review</li>
                  )}
                  {lowQualityImages > 0 && (
                    <li>• {lowQualityImages} image{lowQualityImages !== 1 ? 's' : ''} with quality scores below 75%</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Data Section */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-xl">Patient Records</h2>
              <p className="text-sm text-gray-600">View patient information and make clinical decisions</p>
            </div>

            <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Loading patient data...</p>
                </div>
              ) : patientData.size === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No patient submissions yet</p>
                  <p className="text-sm mt-2">Patient data will appear here when they submit screenings</p>
                </div>
              ) : (
                Array.from(patientData.entries()).map(([patientId, data]) => {
                  const latestSubmission = data.submissions[0];
                  const hasTriageFlags = latestSubmission?.triageFlags && latestSubmission.triageFlags.length > 0;
                  const avgQuality = data.images.length > 0 
                    ? Math.round(data.images.reduce((sum, img) => sum + (img.qualityScore || 0), 0) / data.images.length)
                    : undefined;

                  return (
                    <div key={patientId} className={`border rounded-lg overflow-hidden ${hasTriageFlags ? 'border-orange-300 bg-orange-50' : ''}`}>
                      <div
                        onClick={() => togglePatientDetails(patientId)}
                        className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            hasTriageFlags ? 'bg-orange-100' : 'bg-blue-100'
                          }`}>
                            <User className={`w-5 h-5 ${hasTriageFlags ? 'text-orange-600' : 'text-blue-600'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{data.submissions[0]?.patientName || data.images[0]?.patientName || 'Unknown Patient'}</p>
                              {hasTriageFlags && (
                                <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs rounded-full">
                                  Priority
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {data.submissions.length} submission{data.submissions.length !== 1 ? 's' : ''}, {data.images.length} image{data.images.length !== 1 ? 's' : ''}
                              {avgQuality && ` • Quality: ${avgQuality}%`}
                            </p>
                          </div>
                        </div>
                        {expandedPatient === patientId ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {expandedPatient === patientId && (
                        <div className="px-4 pb-4 pt-2 bg-white border-t space-y-3">
                          {/* Decision Support Summary */}
                          {(latestSubmission?.imageQualityScore || hasTriageFlags) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                Decision Support
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {latestSubmission?.imageQualityScore && (
                                  <div>
                                    <p className="text-gray-600">Image Quality</p>
                                    <p className="font-medium">{latestSubmission.imageQualityScore}%</p>
                                  </div>
                                )}
                                {hasTriageFlags && (
                                  <div>
                                    <p className="text-gray-600">Triage Flags</p>
                                    <p className="font-medium text-orange-600">{latestSubmission.triageFlags.length} flag(s)</p>
                                  </div>
                                )}
                              </div>
                              {hasTriageFlags && (
                                <div className="mt-2 space-y-1">
                                  {latestSubmission.triageFlags.map((flag, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                      <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
                                      <span>{flag}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Submissions */}
                          {data.submissions.map((submission, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded border">
                              <div className="flex items-center gap-2 text-sm mb-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">
                                  {new Date(submission.timestamp).toLocaleString()}
                                </span>
                              </div>
                              
                              {/* Questionnaire Answers */}
                              {submission.questionnaireAnswers && submission.questionnaireAnswers.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  <p className="text-sm font-medium text-gray-700">Questionnaire Responses:</p>
                                  <div className="bg-white p-3 rounded border space-y-2">
                                    {submission.questionnaireAnswers.map((qa: any, qaIdx: number) => (
                                      <div key={qaIdx} className="text-sm">
                                        <p className="font-medium text-gray-700">{qa.question}</p>
                                        <p className="text-gray-600 ml-2">
                                          {Array.isArray(qa.answer) ? qa.answer.join(', ') : qa.answer}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {submission.messages && submission.messages.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-gray-700">Notes:</p>
                                  {submission.messages.slice(0, 3).map((msg, msgIdx) => (
                                    <div key={msgIdx} className="text-sm bg-white p-2 rounded">
                                      {msg.text}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* Images */}
                          {data.images.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Medical Images ({data.images.length}):</p>
                              <div className="grid grid-cols-2 gap-2">
                                {data.images.slice(0, 4).map((img, idx) => (
                                  <div key={idx} className="relative">
                                    {img.url ? (
                                      <div className="relative">
                                        <img 
                                          src={img.url} 
                                          alt={img.originalName}
                                          className="w-full h-24 object-cover rounded border"
                                        />
                                        {img.qualityScore && (
                                          <div className="absolute top-1 right-1 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                                            {img.qualityScore}%
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="w-full h-24 bg-gray-200 rounded border flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Make Decision Button */}
                          <button
                            onClick={() => handleMakeDecision(
                              patientId,
                              data.submissions[0]?.patientName || data.images[0]?.patientName || 'Unknown Patient',
                              latestSubmission?.imageQualityScore,
                              latestSubmission?.triageFlags
                            )}
                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                          >
                            <FileCheck className="w-4 h-4" />
                            Make Clinical Decision
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Image Gallery Section */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-xl">Medical Images</h2>
              <p className="text-sm text-gray-600">Patient-submitted cervical screening images</p>
            </div>

            <div className="p-4 max-h-[700px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Loading images...</p>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No patient images submitted yet</p>
                  <p className="text-sm mt-2">Images will appear here when patients upload them</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, idx) => (
                    <div key={idx} className="relative group cursor-pointer">
                      {image.url ? (
                        <div className="relative">
                          <img
                            src={image.url}
                            alt={image.originalName}
                            className="w-full aspect-square object-cover rounded-lg border"
                          />
                          {image.qualityScore && (
                            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                              image.qualityScore >= 85 ? 'bg-green-500' :
                              image.qualityScore >= 75 ? 'bg-yellow-500' : 'bg-orange-500'
                            } text-white`}>
                              Quality: {image.qualityScore}%
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                              View Full Image
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="mt-2">
                        <p className="text-sm font-medium truncate">{image.patientName}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(image.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Guidelines and Information */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            Clinical Guidelines
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="font-medium mb-2">Screening Intervals</p>
              <p className="text-gray-600">Age 25-49: Every 3 years</p>
              <p className="text-gray-600">Age 50-64: Every 5 years</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="font-medium mb-2">Referral Pathways</p>
              <p className="text-gray-600">Routine: 6-8 weeks</p>
              <p className="text-gray-600">Urgent: Within 2 weeks</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="font-medium mb-2">Quality Standards</p>
              <p className="text-gray-600">Image quality ≥ 85%: Excellent</p>
              <p className="text-gray-600">Image quality &lt; 70%: Repeat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Decision Dialog */}
      {showDecisionDialog && selectedPatient && (
        <ClinicalDecision
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          imageQualityScore={selectedPatient.imageQualityScore}
          triageFlags={selectedPatient.triageFlags}
          open={showDecisionDialog}
          onClose={() => {
            setShowDecisionDialog(false);
            setSelectedPatient(null);
          }}
          onDecisionSubmit={handleDecisionSubmit}
        />
      )}
    </div>
  );
}