import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { SettingsProvider } from './context/SettingsContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventFormPage from './pages/EventFormPage';
import EventLandingPage from './pages/EventLandingPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import AccountPage from './pages/AccountPage';
import DashboardPage from './pages/DashboardPage';
import InboxPage from './pages/InboxPage';
import ComposeMessagePage from './pages/ComposeMessagePage';
import SystemSettingsPage from './pages/SystemSettingsPage';


// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode; requiresManager?: boolean; requiresOwner?: boolean }> = ({ 
  element, 
  requiresManager = false,
  requiresOwner = false
}) => {
  const { isAuthenticated, isLoading, isManager, isOwner } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiresManager && !isManager) {
    return <Navigate to="/" />;
  }
  
  if (requiresOwner && !isOwner) {
    return <Navigate to="/" />;
  }
  
  return <>{element}</>;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Landing page route - no header/footer */}
        <Route path="/event/:eventId" element={<EventLandingPage />} />
        
        {/* Main app routes with header/footer */}
        <Route path="/" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <HomePage />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/login" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <LoginPage />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/events" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<EventsPage />} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/events/new" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<EventFormPage />} requiresManager={true} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/events/:eventId" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<EventDetailPage />} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/events/:eventId/edit" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<EventFormPage />} requiresManager={true} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/admin" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<AdminPage />} requiresOwner={true} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/account" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<AccountPage />} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/dashboard" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<DashboardPage />} requiresManager={true} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/inbox" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<InboxPage />} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/compose" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<ComposeMessagePage />} requiresManager={true} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/settings" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ProtectedRoute element={<SystemSettingsPage />} requiresOwner={true} />
            </main>
            <Footer />
          </div>
        } />
        

      </Routes>
    </Router>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppProvider>
          <MessageProvider>
            <AppContent />
          </MessageProvider>
        </AppProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;