import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Briefcase, Award, Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProfileData {
  full_name: string;
  email: string;
  specialization?: string;
  license_number?: string;
  phone?: string;
  years_of_experience?: number;
}

export function PhysicianProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    specialization: 'Gynecology',
    license_number: '',
    phone: '',
    years_of_experience: 0,
  });
  const [editedProfile, setEditedProfile] = useState<ProfileData>(profile);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
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

      const { data: physicianData } = await supabase
        .from('physicians')
        .select('*')
        .eq('id', user.id)
        .single();

      const profileData = {
        full_name: physicianData?.full_name || user.user_metadata.name || user.email || '',
        email: user.email || '',
        specialization: physicianData?.specialization || 'Gynecology',
        license_number: physicianData?.license_number || '',
        phone: physicianData?.phone || '',
        years_of_experience: physicianData?.years_of_experience || 0,
      };

      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (!user) return;

      await supabase.from('physicians').upsert({
        id: user.id,
        full_name: editedProfile.full_name,
        specialization: editedProfile.specialization,
        license_number: editedProfile.license_number,
        phone: editedProfile.phone,
        years_of_experience: editedProfile.years_of_experience,
      });

      setProfile(editedProfile);
      setEditing(false);
      toast.success('Profile updated successfully!', { duration: 3000 });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/physician-dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">My Profile</h1>
              <p className="text-sm text-gray-600">Manage your professional information</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Dr. {profile.full_name}</h2>
                  <p className="text-blue-100">{profile.specialization}</p>
                  <p className="text-blue-100 text-sm">{profile.email}</p>
                </div>
              </div>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button onClick={() => { setEditedProfile(profile); setEditing(false); }} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />Full Name
                  </label>
                  <input type="text" value={editing ? editedProfile.full_name : profile.full_name} onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })} disabled={!editing} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />Email
                  </label>
                  <input type="email" value={profile.email} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />Specialization
                  </label>
                  <select value={editing ? editedProfile.specialization : profile.specialization} onChange={(e) => setEditedProfile({ ...editedProfile, specialization: e.target.value })} disabled={!editing} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                    <option value="Gynecology">Gynecology</option>
                    <option value="Obstetrics">Obstetrics</option>
                    <option value="Oncology">Oncology</option>
                    <option value="General Practice">General Practice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />License Number
                  </label>
                  <input type="text" value={editing ? editedProfile.license_number : profile.license_number} onChange={(e) => setEditedProfile({ ...editedProfile, license_number: e.target.value })} disabled={!editing} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />Phone
                  </label>
                  <input type="tel" value={editing ? editedProfile.phone : profile.phone} onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })} disabled={!editing} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input type="number" value={editing ? editedProfile.years_of_experience : profile.years_of_experience} onChange={(e) => setEditedProfile({ ...editedProfile, years_of_experience: parseInt(e.target.value) || 0 })} disabled={!editing} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}