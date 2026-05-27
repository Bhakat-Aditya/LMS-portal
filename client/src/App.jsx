//  RIGHT (Navbar is inside, so it can safely read 'user')
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CourseDetails from "./pages/CourseDetails";
import Login from "./pages/Login";
import PaymentStatus from './pages/PaymentStatus';

// A simple placeholder for dashboard until we build it
const TeacherDashboard = () => <div className="p-8">Teacher Upload Area</div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Navbar is now properly shielded inside the AuthProvider umbrella */}
        <Navbar />

        <main className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/course/:courseId" element={<CourseDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/payment-status/:transactionId" element={<PaymentStatus />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
