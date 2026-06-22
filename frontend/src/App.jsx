// Md Saif AliPERMANENT
// AMMANANNA
// KSVIDPERMANENT
// KIRETY
import React from "react";
import 'tailwindcss/tailwind.css';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Home from './pages/Home.jsx';
import MockInterviews from './pages/interview/MockInterviews.jsx';
import Login from './pages/auth/Login.jsx';
import Contests from './pages/contest/Contests.jsx';
import ContestProblems from './pages/contest/ContestProblems.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Register from './pages/auth/Register.jsx';
import MCQInterview from './pages/interview/MCQInterview.jsx';
import Compiler from './pages/interview/Compiler.jsx';
import PracticeSession from './pages/interview/PracticeSession.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ResumeAnalyzer from './pages/ResumeAnalyzer.jsx';
import FaceToFaceInterview from './pages/interview/FaceToFaceInterview.jsx';
import InterviewPreparation from './pages/interview/InterviewPreparation.jsx';
import InterviewLanding from './pages/interview/InterviewLanding.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import ProfessionalAdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminContestView from './pages/admin/AdminContestView.jsx';
// import ManageInterviews from './pages/admin/ManageInterviews.jsx'; // Disabled - Using Scheduled Interviews only
import ManageScheduledInterviews from './pages/admin/ManageScheduledInterviews.jsx';
import ScheduledInterviews from './pages/interview/ScheduledInterviews.jsx';

// ProtectedRoute component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();

  const hideNavbar = false; // All pages now show navbar
  const fullBleedRoutes = ['/', '/Login', '/login', '/register'];
  const fullBleedPrefixes = [
    '/practice',
    '/mock-interviews',
    '/preparation',
    '/interview-preparation',
    '/interview-prepration',
    '/contests',
    '/compiler',
    '/face-to-face-interview',
    '/resume-analyzer',
  ];
  const isFullBleedRoute = fullBleedRoutes.includes(location.pathname)
    || fullBleedPrefixes.some((prefix) => location.pathname.startsWith(prefix));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          fontSize: '16px',
          fontWeight: '500',
        }}
        toastStyle={{
          backgroundColor: '#ffffff',
          color: '#1f2937',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          minHeight: '70px',
          padding: '16px',
        }}
      />
      {!hideNavbar && <Navbar />}
      <main
        className={
          isFullBleedRoute
            ? 'flex-1 w-full bg-slate-50'
            : 'flex-1 w-full mx-auto px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32 max-w-screen-2xl bg-white'
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<MockInterviews />} />
          <Route path="/practice/:category" element={<MockInterviews />} />
          <Route path="/practice-session" element={<PracticeSession />} />
          <Route path="/mock-interviews" element={<MockInterviews />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/contest/:contestId/problems" element={<ProtectedRoute><ContestProblems /></ProtectedRoute>} />
          <Route path="/preparation" element={<InterviewPreparation />} />
          <Route path="/preparation/:category" element={<InterviewPreparation />} />
          <Route path="/interview-preparation" element={<InterviewPreparation />} />
          <Route path="/interview-preparation/:category" element={<InterviewPreparation />} />
          <Route path="/interview-prepration" element={<InterviewPreparation />} />
          <Route path="/interview-prepration/:category" element={<InterviewPreparation />} />

          {/* Protected Routes */}
          <Route path="/compiler" element={<ProtectedRoute><Compiler /></ProtectedRoute>} />
          <Route path="/mcq-interview" element={<ProtectedRoute><MCQInterview /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/resume-analyzer" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
          <Route path="/face-to-face-interview" element={<ProtectedRoute><FaceToFaceInterview /></ProtectedRoute>} />
          <Route path="/interview/:interviewId/start" element={<ProtectedRoute><FaceToFaceInterview /></ProtectedRoute>} />
          <Route path="/interview/:interviewId" element={<InterviewLanding />} />
          <Route path="/scheduled-interviews" element={<ScheduledInterviews />} />

          {/* Public Routes */}
          <Route path="/Login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<ProfessionalAdminDashboard />} />
          <Route path="/admin/contest/:contestId" element={<AdminContestView />} />
          {/* <Route path="/admin/manage-interviews" element={<ManageInterviews />} /> */}
          <Route path="/admin/interviews" element={<ManageScheduledInterviews />} />
          <Route path="/admin/scheduled-interviews" element={<ManageScheduledInterviews />} />
        </Routes>
      </main>
    </div>
  );
}

// Wrap only with AuthProvider (no Router)
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
