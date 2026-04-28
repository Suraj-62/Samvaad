import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import DashboardHub from './pages/DashboardHub';
import HumanMockInterview from './pages/HumanMockInterview';
import HumanInterviewBooking from './pages/HumanInterviewBooking';
import HumanMockDashboard from './pages/HumanMockDashboard';
import HumanInterviewJoin from './pages/HumanInterviewJoin';
import InterviewerDashboard from './pages/InterviewerDashboard';
import AdminDashboard from './pages/AdminDashboard';

import Configurator from './pages/Configurator';

import GDJoin from './pages/GDJoin';
import GDRoom from './pages/GDRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignIn />} />
        <Route path="/dashboard" element={<DashboardHub />} />
        <Route path="/configurator" element={<Configurator />} />
        <Route path="/human-mock" element={<HumanMockInterview />} />
        <Route path="/human-mock-dashboard" element={<HumanMockDashboard />} />
        <Route path="/human-booking" element={<HumanInterviewBooking />} />
        <Route path="/human-join" element={<HumanInterviewJoin />} />
        <Route path="/interviewer-dashboard" element={<InterviewerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/gd-join" element={<GDJoin />} />
        <Route path="/gd-room" element={<GDRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
