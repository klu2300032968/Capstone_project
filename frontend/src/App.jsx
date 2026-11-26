import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LoginModal from './components/LoginModal';
import './App.css';

function AppContent() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="app-container">
      <Navbar onOpenLogin={() => setIsLoginOpen(true)} />
      <Dashboard onOpenLogin={() => setIsLoginOpen(true)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
