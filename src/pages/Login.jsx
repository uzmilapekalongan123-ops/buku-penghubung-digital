import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { BookOpen, User, ShieldAlert } from 'lucide-react';

export const Login = ({ onLoginSuccess, forcedRole }) => {
  const [role, setRole] = useState(forcedRole || 'parent'); // 'parent' or 'teacher'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'teacher') {
        // Login Guru / Admin - memeriksa database kelas
        const { data, error: dbError } = await supabase
          .from('kelas')
          .select('id, username, password')
          .eq('username', username.trim())
          .eq('password', password.trim())
          .maybeSingle();

        if (dbError || !data) {
          setError('Username atau password Guru/Wali Kelas salah.');
        } else {
          onLoginSuccess({ role: 'teacher', username: 'Guru/Wali Kelas', classId: data.id });
        }
      } else {
        // Login Wali Murid - memeriksa database siswa
        const { data, error: dbError } = await supabase
          .from('siswa')
          .select('*, kelas(nama_kelas, nama_wali, wa_wali)')
          .eq('username', username.trim().toLowerCase())
          .eq('password', password)
          .single();

        if (dbError || !data) {
          setError('Username atau password Siswa/Wali Murid tidak ditemukan.');
        } else {
          onLoginSuccess({ role: 'parent', student: data });
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }} className="fade-in">
        <img 
          src="./logo.png" 
          alt="Logo Sekolah" 
          style={{
            height: '80px',
            width: '80px',
            objectFit: 'contain',
            marginBottom: '12px',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
          }} 
        />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1b4332', marginBottom: '6px' }}>
          Buku Penghubung
        </h1>
        <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>
          {role === 'parent' ? 'Portal Laporan & Absensi Wali Murid' : 'Portal Manajemen Dasbor Guru'}
        </p>
      </div>

      <Card className="fade-in" style={{ padding: '28px' }}>
        {/* Toggle Role (Hanya ditampilkan jika tidak dipaksa oleh URL) */}
        {!forcedRole && (
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.04)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => { setRole('parent'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: role === 'parent' ? '#ffffff' : 'transparent',
                color: role === 'parent' ? '#1b4332' : '#6c757d',
                boxShadow: role === 'parent' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Wali Murid
            </button>
            <button
              type="button"
              onClick={() => { setRole('teacher'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: role === 'teacher' ? '#ffffff' : 'transparent',
                color: role === 'teacher' ? '#1b4332' : '#6c757d',
                boxShadow: role === 'teacher' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Wali Kelas (Guru)
            </button>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            fontWeight: 500
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              {role === 'parent' ? 'Username Siswa' : 'Username Guru'}
            </label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder={role === 'parent' ? 'Masukkan username siswa' : 'Masukkan username guru'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" loading={loading}>
            Masuk ke Aplikasi
          </Button>
        </form>
      </Card>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8rem', color: '#888' }}>
        <p>© 2026 Proyek Amal Pendidikan</p>
        {role === 'parent' && (
          <p style={{ marginTop: '4px' }}>Lupa password? Hubungi Wali Kelas untuk reset password.</p>
        )}
      </div>
    </div>
  );
};
