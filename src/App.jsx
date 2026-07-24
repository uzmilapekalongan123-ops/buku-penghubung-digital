import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { PublicReport } from './pages/PublicReport';
import { useRegisterSW } from 'virtual:pwa-register/react';

function App() {
  const [user, setUser] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return window.location.href.includes('admin');
  });

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.error('SW registration error: ', error);
    },
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

  // Helper to render update prompt if SW detects new version
  const renderUpdatePrompt = () => {
    if (!needRefresh) return null;
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        background: '#ffffff',
        border: '1.5px solid #2d6a4f',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '320px',
        animation: 'slideUp 0.3s ease'
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1b4332', display: 'block', marginBottom: '2px' }}>Pembaruan Tersedia 🚀</span>
          <span style={{ fontSize: '0.78rem', color: '#6c757d', lineHeight: 1.4, display: 'block' }}>Aplikasi Buku Penghubung memiliki fitur baru. Hubungkan pembaruan sekarang!</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setNeedRefresh(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '0.78rem',
              cursor: 'pointer',
              padding: '6px 12px'
            }}
          >
            Nanti saja
          </button>
          <button 
            onClick={() => updateServiceWorker(true)}
            style={{
              background: '#2d6a4f',
              border: 'none',
              color: 'white',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: '8px',
              padding: '6px 14px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(45, 106, 79, 0.2)'
            }}
          >
            Update Sekarang
          </button>
        </div>
      </div>
    );
  };

  // 1. Jika terdapat token di URL, tampilkan laporan publik (read-only)
  if (isPublic) {
    return (
      <>
        <PublicReport />
        {renderUpdatePrompt()}
      </>
    );
  }

  // 2. Jika belum login, tampilkan login khusus berdasarkan rute
  if (!user) {
    return (
      <>
        <Login 
          key={isAdminRoute ? 'admin' : 'parent'}
          onLoginSuccess={handleLoginSuccess} 
          forcedRole={isAdminRoute ? 'teacher' : 'parent'} 
        />
        {renderUpdatePrompt()}
      </>
    );
  }

  // 3. Tampilkan dashboard sesuai role user
  if (user.role === 'teacher') {
    return (
      <>
        <AdminDashboard onLogout={handleLogout} />
        {renderUpdatePrompt()}
      </>
    );
  } else if (user.role === 'parent') {
    return (
      <>
        <ParentDashboard student={user.student} onLogout={handleLogout} />
        {renderUpdatePrompt()}
      </>
    );
  }

  return (
    <>
      <Login 
        key={isAdminRoute ? 'admin' : 'parent'}
        onLoginSuccess={handleLoginSuccess} 
        forcedRole={isAdminRoute ? 'teacher' : 'parent'} 
      />
      {renderUpdatePrompt()}
    </>
  );
}

export default App;
