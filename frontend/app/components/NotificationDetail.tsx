import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NotificationDetail {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  physician_id?: string;
  submission_id?: string;
}

interface PhysicianInfo {
  full_name: string;
  specialization?: string;
}

interface SubmissionInfo {
  submitted_at: string;
  status: string;
  questionnaire_answers: any[];
  image_count: number;
}

export function NotificationDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [physicianInfo, setPhysicianInfo] = useState<PhysicianInfo | null>(null);
  const [submissionInfo, setSubmissionInfo] = useState<SubmissionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNotificationDetails();
    }
  }, [id]);

  const fetchNotificationDetails = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (!user) {
        navigate('/');
        return;
      }

      // Fetch notification
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .eq('patient_id', user.id)
        .single();

      if (notifError) throw notifError;
      setNotification(notifData);

      // Mark as read
      if (!notifData.is_read) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      }

      // Fetch physician info if available
      if (notifData.physician_id) {
        const { data: physicianData } = await supabase
          .from('physicians')
          .select('full_name, specialization')
          .eq('id', notifData.physician_id)
          .single();

        if (physicianData) {
          setPhysicianInfo(physicianData);
        }
      }

      // Fetch submission info if available
      if (notifData.submission_id) {
        const { data: submissionData } = await supabase
          .from('screening_submissions')
          .select('submitted_at, status, questionnaire_answers, image_count')
          .eq('id', notifData.submission_id)
          .single();

        if (submissionData) {
          setSubmissionInfo(submissionData);
        }
      }
    } catch (error) {
      console.error('Error fetching notification details:', error);
      toast.error('Failed to load notification details');
      navigate('/notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTypeInfo = (type: string) => {
    switch (type) {
      case 'clinical_decision':
        return {
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          icon: <FileText className="w-6 h-6 text-blue-600" />
        };
      case 'urgent':
        return {
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          icon: <AlertCircle className="w-6 h-6 text-red-600" />
        };
      default:
        return {
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-900',
          icon: <FileText className="w-6 h-6 text-gray-600" />
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notification...</p>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Notification not found</p>
        </div>
      </div>
    );
  }

  const typeInfo = getNotificationTypeInfo(notification.notification_type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Notification Details</h1>
              <p className="text-sm text-gray-600">
                {new Date(notification.created_at).toLocaleDateString()} at{' '}
                {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Main Notification Card */}
        <div className={`bg-white rounded-xl shadow-lg border-2 ${typeInfo.borderColor} overflow-hidden`}>
          {/* Header Section */}
          <div className={`${typeInfo.bgColor} border-b ${typeInfo.borderColor} p-6`}>
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${typeInfo.bgColor} border-2 ${typeInfo.borderColor} flex items-center justify-center`}>
                {typeInfo.icon}
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${typeInfo.textColor} mb-2`}>
                  {notification.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(notification.created_at).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(notification.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Message Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Message</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {notification.message}
              </p>
            </div>
          </div>

          {/* Physician Information */}
          {physicianInfo && (
            <div className="px-6 pb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Physician Information</h3>
                </div>
                <div className="ml-8 space-y-1">
                  <p className="text-gray-900 font-medium">{physicianInfo.full_name}</p>
                  {physicianInfo.specialization && (
                    <p className="text-gray-600 text-sm">{physicianInfo.specialization}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submission Information */}
          {submissionInfo && (
            <div className="px-6 pb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Related Submission</h3>
                </div>
                <div className="ml-8 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Submitted</p>
                      <p className="font-medium">
                        {new Date(submissionInfo.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-medium capitalize">
                        {submissionInfo.status.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Questions Answered</p>
                      <p className="font-medium">{submissionInfo.questionnaire_answers?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Images Submitted</p>
                      <p className="font-medium">{submissionInfo.image_count}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="bg-gray-50 border-t px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Marked as read</span>
              </div>
              <button
                onClick={() => navigate('/patient-dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <FileText className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">All Notifications</p>
                <p className="text-sm text-gray-600">View all your notifications</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/patient-dashboard')}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Dashboard</p>
                <p className="text-sm text-gray-600">Return to your dashboard</p>
              </div>
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="font-semibold text-orange-900 mb-2">Need Assistance?</h3>
          <p className="text-sm text-orange-800 mb-3">
            If you have questions about this notification or need to discuss your results, please contact your physician's office.
          </p>
          <div className="text-sm text-orange-700">
            <p><strong>Support:</strong> 1-800-SCREEN</p>
            <p><strong>Email:</strong> support@cerviscreen.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}