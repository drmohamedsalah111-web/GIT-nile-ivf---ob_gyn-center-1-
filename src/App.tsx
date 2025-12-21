import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DoctorReception from './pages/DoctorReception';

function App() {
  return (
    <Router>
      <Routes>
        {/* ...existing routes... */}
        <Route path="/doctor-reception" element={<DoctorReception />} />
        {/* ...existing code... */}
      </Routes>
    </Router>
  );
}

export default App;