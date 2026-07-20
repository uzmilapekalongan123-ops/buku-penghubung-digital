import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { PublicReport } from './pages/PublicReport';

function App() {
  const [user, setUser] = useState(null);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    // Memeriksa apakah URL memiliki parameter '?token=xxx'
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      setIsPublic(true);
    } else {
      // Periksa apakah ada sesi login yang tersimpan di localStorage
      const savedUser = localStorage.getItem('buku_penghubung_session');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Gagal memuat sesi:', e);
          localStorage.removeItem('buku_penghubung_session');
        }
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('buku_penghubung_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('buku_penghubung_session');
  };

  // Jika terdapat token di URL, tampilkan halaman laporan publik (read-only)
  if (isPublic) {
    return <PublicReport />;
  }

  // Jika belum login, tampilkan halaman login
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Tampilkan dashboard sesuai role
  if (user.role === 'teacher') {
    return <AdminDashboard onLogout={handleLogout} />;
  } else if (user.role === 'parent') {
    return <ParentDashboard student={user.student} onLogout={handleLogout} />;
  }

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;
