import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/app/components/Login';
import { PatientDashboard } from '@/app/components/PatientDashboard';
import { PhysicianDashboard } from '@/app/components/PhysicianDashboard';
import { Notifications } from '@/app/components/Notifications';
import { NotificationDetail } from '@/app/components/NotificationDetail';
import { PatientProfile } from '@/app/components/PatientProfile';
import { PhysicianProfile } from '@/app/components/PhysicianProfile';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/physician-dashboard" element={<PhysicianDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/notifications/:id" element={<NotificationDetail />} />
          <Route path="/patient-profile" element={<PatientProfile />} />
          <Route path="/physician-profile" element={<PhysicianProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}