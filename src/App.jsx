import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { PublicReport } from './pages/PublicReport';

function App() {
  const [user, setUser] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return window.location.href.includes('admin');
  });

  useEffect(() => {
    // Fungsi memeriksa rute admin
    const checkRoute = () => {
      const isAdm = window.location.href.includes('admin');
      setIsAdminRoute(isAdm);
      
      // Memeriksa parameter token publik
      if (new URLSearchParams(window.location.search).has('token')) {
        setIsPublic(true);
      }
    };

    checkRoute();

    // Memeriksa sesi login tersimpan
    const savedUser = localStorage.getItem('buku_penghubung_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Gagal memuat sesi:', e);
        localStorage.removeItem('buku_penghubung_session');
      }
    }

    // Dengarkan navigasi browser
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('buku_penghubung_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('buku_penghubung_session');
  };

  // 1. Jika terdapat token di URL, tampilkan laporan publik (read-only)
  if (isPublic) {
    return <PublicReport />;
  }

  // 2. Jika belum login, tampilkan login khusus berdasarkan rute
  if (!user) {
    return (
      <Login 
        key={isAdminRoute ? 'admin' : 'parent'}
        onLoginSuccess={handleLoginSuccess} 
        forcedRole={isAdminRoute ? 'teacher' : 'parent'} 
      />
    );
  }

  // 3. Tampilkan dashboard sesuai role user
  if (user.role === 'teacher') {
    return <AdminDashboard onLogout={handleLogout} />;
  } else if (user.role === 'parent') {
    return <ParentDashboard student={user.student} onLogout={handleLogout} />;
  }

  return (
    <Login 
      key={isAdminRoute ? 'admin' : 'parent'}
      onLoginSuccess={handleLoginSuccess} 
      forcedRole={isAdminRoute ? 'teacher' : 'parent'} 
    />
  );
}

export default App;
