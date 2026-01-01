import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DoctorReception from './pages/DoctorReception';
import DoctorRegistration from './pages/Auth/DoctorRegistration';
import SubscriptionPending from './pages/Auth/SubscriptionPending';

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication & Registration */}
        <Route path="/register" element={<DoctorRegistration />} />
        <Route path="/subscription-pending" element={<SubscriptionPending />} />
        
        {/* ...existing routes... */}
        <Route path="/doctor-reception" element={<DoctorReception />} />
        {/* ...existing code... */}
      </Routes>
    </Router>
  );
}

export default App;