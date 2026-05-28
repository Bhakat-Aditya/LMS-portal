import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CourseDetails from "./pages/CourseDetails";
import Login from "./pages/Login";
import PaymentStatus from "./pages/PaymentStatus";
import TeacherDashboard from "./pages/TeacherDashboard";
import AllStudents from "./pages/AllStudents";
import NoticeBoard from "./pages/NoticeBoard";

function App() {
  // Global early theme synchronization
  useEffect(() => {
    const storedTheme = localStorage.getItem("lms_theme") || "light";
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/course/:courseId" element={<CourseDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/students" element={<AllStudents />} />
            <Route path="/notice-board" element={<NoticeBoard />} />
            <Route
              path="/payment-status/:transactionId"
              element={<PaymentStatus />}
            />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
