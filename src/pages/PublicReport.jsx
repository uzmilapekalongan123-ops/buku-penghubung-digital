import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Calendar, Award, MessageCircle, Info, Star, ShieldAlert } from 'lucide-react';

export const PublicReport = () => {
  const [token, setToken] = useState('');
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State untuk Stempel
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    // Ambil token dari query parameter URL (?token=xxx)
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      fetchData(tokenParam);
    } else {
      setError('Token laporan tidak ditemukan. Silakan gunakan tautan laporan publik yang sah.');
      setLoading(false);
    }
  }, []);

  const fetchData = async (tkn) => {
    try {
      // 1. Ambil Data Siswa
      const { data: stdData, error: stdError } = await supabase
        .from('siswa')
        .select('*, kelas(*)')
        .eq('token', tkn)
        .single();

      if (stdError || !stdData) {
        setError('Token laporan tidak valid atau kedaluwarsa.');
        setLoading(false);
        return;
      }

      setStudent(stdData);

      // 2. Ambil Riwayat Absensi
      const { data: attData } = await supabase
        .from('absensi')
        .select('*')
        .eq('siswa_id', stdData.id)
        .order('tanggal', { ascending: false });

      setAttendance(attData || []);

      // 3. Ambil Riwayat Stempel (Badge)
      const { data: bdgData } = await supabase
        .from('catatan_stempel')
        .select('*, master_badge(*)')
        .eq('siswa_id', stdData.id)
        .order('tanggal_waktu', { ascending: false });

      setBadges(bdgData || []);

      // 4. Ambil Riwayat Prestasi
      const { data: prsData } = await supabase
        .from('prestasi')
        .select('*')
        .eq('siswa_id', stdData.id)
        .order('tanggal', { ascending: false });

      setAchievements(prsData || []);

      // 5. Ambil Pengumuman Kelas & Umum
      const { data: annData } = await supabase
        .from('pengumuman')
        .select('*')
        .or(`kelas_id.eq.${stdData.kelas_id},kelas_id.is.null`)
        .order('tanggal', { ascending: false });

      setAnnouncements(annData || []);

    } catch (err) {
      console.error(err);
      setError('Gagal memuat data laporan publik.');
    } finally {
      setLoading(false);
    }
  };

  // Hitung persentase kehadiran
  const getAttendanceStats = () => {
    if (!attendance.length) return { hadir: 0, izin: 0, sakit: 0, alpa: 0, persentase: 100 };
    const total = attendance.length;
    const hadir = attendance.filter(a => a.status === 'Hadir').length;
    const izin = attendance.filter(a => a.status === 'Izin').length;
    const sakit = attendance.filter(a => a.status === 'Sakit').length;
    const alpa = total - hadir - izin - sakit;
    const persentase = Math.round(((hadir + izin + sakit) / total) * 100); // menganggap izin/sakit adalah absensi resmi bersurat
    const persentaseHadirMurni = Math.round((hadir / total) * 100);

    return { hadir, izin, sakit, alpa, persentase: persentaseHadirMurni };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e8f5e9', borderTopColor: '#2d6a4f', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#2d6a4f', fontWeight: 500 }}>Memuat laporan publik...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: '#d32f2f', marginBottom: '16px' }}><ShieldAlert size={60} style={{ margin: '0 auto' }} /></div>
        <h2 style={{ fontSize: '1.4rem', color: '#1b4332', marginBottom: '8px' }}>Akses Ditolak</h2>
        <p style={{ color: '#6c757d', marginBottom: '24px' }}>{error}</p>
        <p style={{ fontSize: '0.85rem', color: '#888' }}>Minta wali kelas untuk membagikan tautan publik yang baru.</p>
      </div>
    );
  }

  const stats = getAttendanceStats();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '30px' }}>
      {/* Header Siswa */}
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '1.8rem' }}>🎒</div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Laporan Publik Siswa</h2>
            <p style={{ opacity: 0.9, fontSize: '0.85rem' }}>{student.kelas?.nama_kelas || 'Kelas'}</p>
          </div>
        </div>
        <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem' }}>
          <p><strong>Nama:</strong> {student.nama_siswa}</p>
          <p><strong>Wali Kelas:</strong> {student.kelas?.nama_wali} ({student.kelas?.wa_wali})</p>
        </div>
      </header>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="fade-in">
        {/* Banner Informasional */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: '#e8f5e9',
          color: '#2e7d32',
          padding: '12px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          lineHeight: 1.4,
          border: '1px solid rgba(46, 125, 50, 0.15)'
        }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>Halaman ini bersifat <strong>BACA SAJA</strong>. Informasi disinkronisasi langsung oleh sekolah demi kenyamanan keluarga.</span>
        </div>

        {/* 1. Ringkasan Kehadiran */}
        <Card>
          <h3 style={{ fontSize: '1.1rem', color: '#1b4332', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} /> Statistik Kehadiran
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '15px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2e7d32' }}>{stats.persentase}%</div>
              <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Kehadiran Murni</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ color: 'var(--color-hadir)', fontWeight: 600 }}>• Hadir:</span>
                <span>{stats.hadir} hari</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ color: 'var(--color-sakit)', fontWeight: 600 }}>• Sakit:</span>
                <span>{stats.sakit} hari</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ color: 'var(--color-izin)', fontWeight: 600 }}>• Izin:</span>
                <span>{stats.izin} hari</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ color: 'var(--color-alpa)', fontWeight: 600 }}>• Alpa:</span>
                <span style={{ fontWeight: stats.alpa > 0 ? 700 : 400 }}>{stats.alpa} hari</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Koleksi Stempel Apresiasi */}
        <Card>
          <h3 style={{ fontSize: '1.1rem', color: '#1b4332', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} /> Lencana Stempel ({badges.length})
          </h3>
          {badges.length === 0 ? (
            <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
              Belum ada stempel apresiasi yang tercatat.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', margin: '10px 0' }}>
              {badges.map((b) => (
                <div 
                  key={b.id} 
                  className="badge-emoji"
                  onClick={() => setSelectedBadge(b.master_badge)}
                  title={b.master_badge?.nama_stempel}
                >
                  {b.master_badge?.simbol || '⭐'}
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', marginTop: '6px' }}>
            *Ketuk stempel untuk melihat detail penghargaan.
          </p>
        </Card>

        {/* 3. Catatan Prestasi */}
        <Card>
          <h3 style={{ fontSize: '1.1rem', color: '#1b4332', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={20} /> Catatan Prestasi Siswa
          </h3>
          {achievements.length === 0 ? (
            <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
              Belum ada catatan prestasi terdaftar.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {achievements.map((p) => (
                <div key={p.id} style={{ borderLeft: '3px solid #d4af37', paddingLeft: '12px', position: 'relative' }}>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <h4 style={{ margin: '2px 0 4px 0', color: '#1b4332', fontSize: '0.95rem', fontWeight: 600 }}>{p.judul_prestasi}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>{p.deskripsi}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 4. Pengumuman Terakhir */}
        <Card>
          <h3 style={{ fontSize: '1.1rem', color: '#1b4332', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={20} /> Papan Pengumuman
          </h3>
          {announcements.length === 0 ? (
            <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
              Tidak ada pengumuman kelas saat ini.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {announcements.map((a) => (
                <div key={a.id} style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#e8f5e9', color: '#2d6a4f', fontWeight: 600 }}>{a.kategori}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#333', whiteSpace: 'pre-line', marginBottom: '8px' }}>{a.isi}</p>
                  {a.link_luar && (
                    <a 
                      href={a.link_luar} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ fontSize: '0.8rem', color: '#2d6a4f', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      🔗 Lihat Foto Kegiatan (Google Drive)
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Hubungi Wali Kelas */}
        {student.kelas?.wa_wali && (
          <a 
            href={`https://wa.me/${student.kelas.wa_wali}?text=Assalamualaikum%20Ustadz/Ustadzah%2C%20saya%20wali%20dari%20${encodeURIComponent(student.nama_siswa)}...`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="wa-float fade-in"
          >
            <MessageCircle size={18} />
            Hubungi Wali Kelas via WhatsApp
          </a>
        )}
      </div>

      {/* Modal Detail Stempel */}
      <Modal 
        isOpen={!!selectedBadge} 
        onClose={() => setSelectedBadge(null)} 
        title="Detail Stempel Apresiasi"
      >
        {selectedBadge && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            {selectedBadge.gambar_url ? (
              <img 
                src={selectedBadge.gambar_url} 
                alt={selectedBadge.nama_stempel} 
                style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '16px', borderRadius: '50%' }}
              />
            ) : (
              <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'bounce 2s infinite' }}>
                {selectedBadge.simbol || '⭐'}
              </div>
            )}
            <h4 style={{ fontSize: '1.2rem', color: '#1b4332', fontWeight: 700, marginBottom: '8px' }}>
              {selectedBadge.nama_stempel}
            </h4>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fcf6bd', color: '#b58d16', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px' }}>
              Grup: {selectedBadge.grup_stempel}
            </span>
            <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.5, background: '#f4f7f6', padding: '16px', borderRadius: '12px' }}>
              {selectedBadge.deskripsi}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
