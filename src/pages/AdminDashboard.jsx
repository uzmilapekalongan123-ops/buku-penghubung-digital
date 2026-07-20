import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Calendar, UserCheck, Users, Award, Star, Megaphone, LogOut, Edit, Trash2, Plus, MessageCircle, RefreshCw } from 'lucide-react';

export const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'students', 'badges', 'achievements', 'announcements'
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Edit Wali Kelas
  const [isEditingWali, setIsEditingWali] = useState(false);
  const [waliName, setWaliName] = useState('');
  const [waliWa, setWaliWa] = useState('');

  // --- State Absensi ---
  const [absences, setAbsences] = useState({}); // { studentId: { status: 'Hadir', keterangan: '' } }
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // --- State CRUD Siswa ---
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null); // null for new, student object for edit
  const [studentForm, setStudentForm] = useState({
    username: '', password: '', nama_siswa: '', alamat: '', nama_ortu: '', wa_ortu: '', token: ''
  });

  // --- State Beri Stempel ---
  const [masterBadges, setMasterBadges] = useState([]);
  const [selectedStudentForBadge, setSelectedStudentForBadge] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [badgeNote, setBadgeNote] = useState('');
  const [givingBadge, setGivingBadge] = useState(false);

  // --- State Catatan Prestasi ---
  const [selectedStudentForPrestasi, setSelectedStudentForPrestasi] = useState('');
  const [prestasiForm, setPrestasiForm] = useState({ tanggal: new Date().toISOString().split('T')[0], judul: '', deskripsi: '' });
  const [savingPrestasi, setSavingPrestasi] = useState(false);

  // --- State Pengumuman ---
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ kategori: 'Informasi', isi: '', link_luar: '' });
  const [comments, setComments] = useState({});
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance' && students.length > 0) {
      fetchAttendanceForDate(attendanceDate);
    }
  }, [activeTab, attendanceDate, students]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // 1. Ambil data kelas (ambil kelas pertama yang ada)
      const { data: clsData } = await supabase.from('kelas').select('*');
      if (clsData && clsData.length > 0) {
        setClassInfo(clsData[0]);
        setWaliName(clsData[0].nama_wali);
        setWaliWa(clsData[0].wa_wali);
        
        // 2. Ambil data siswa
        const { data: stdData } = await supabase
          .from('siswa')
          .select('*')
          .eq('kelas_id', clsData[0].id)
          .order('nama_siswa', { ascending: true });
        setStudents(stdData || []);
      }

      // 3. Ambil data stempel master
      const { data: bdgData } = await supabase.from('master_badge').select('*');
      setMasterBadges(bdgData || []);

      // 4. Ambil pengumuman
      fetchAnnouncements();

    } catch (err) {
      console.error('Error fetching initial admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Aksi Wali Kelas ---
  const handleUpdateWali = async () => {
    try {
      const { error } = await supabase
        .from('kelas')
        .update({ nama_wali: waliName, wa_wali: waliWa })
        .eq('id', classInfo.id);

      if (error) throw error;
      setClassInfo(prev => ({ ...prev, nama_wali: waliName, wa_wali: waliWa }));
      setIsEditingWali(false);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui data Wali Kelas.');
    }
  };

  // --- Aksi Absensi ---
  const fetchAttendanceForDate = async (date) => {
    try {
      const { data } = await supabase
        .from('absensi')
        .select('*')
        .eq('tanggal', date);

      const absMap = {};
      // Set default semua Hadir
      students.forEach(s => {
        absMap[s.id] = { status: 'Hadir', keterangan: '' };
      });
      // Timpa dengan data dari database jika ada
      data?.forEach(a => {
        absMap[a.siswa_id] = { status: a.status, keterangan: a.keterangan || '' };
      });
      setAbsences(absMap);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAbsenceChange = (studentId, field, value) => {
    setAbsences(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = { ...absences };
    students.forEach(s => {
      updated[s.id] = { ...updated[s.id], status: 'Hadir' };
    });
    setAbsences(updated);
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const upsertData = Object.keys(absences).map(studentId => ({
        siswa_id: studentId,
        tanggal: attendanceDate,
        status: absences[studentId].status,
        keterangan: absences[studentId].keterangan
      }));

      // Di Supabase, kita gunakan upsert dengan constraint (siswa_id, tanggal)
      const { error } = await supabase
        .from('absensi')
        .upsert(upsertData, { onConflict: 'siswa_id,tanggal' });

      if (error) throw error;
      alert('Absensi berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan absensi.');
    } finally {
      setSavingAttendance(false);
    }
  };

  // --- Aksi Siswa CRUD ---
  const handleOpenStudentModal = (student = null) => {
    if (student) {
      setCurrentStudent(student);
      setStudentForm({ ...student });
    } else {
      setCurrentStudent(null);
      setStudentForm({
        username: '',
        password: '',
        nama_siswa: '',
        alamat: '',
        nama_ortu: '',
        wa_ortu: '',
        token: 'tkn_' + Math.random().toString(36).substring(2, 10)
      });
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      if (currentStudent) {
        // Edit Siswa
        const { error } = await supabase
          .from('siswa')
          .update(studentForm)
          .eq('id', currentStudent.id);
        if (error) throw error;
      } else {
        // Tambah Siswa Baru
        const { error } = await supabase
          .from('siswa')
          .insert({ ...studentForm, kelas_id: classInfo.id });
        if (error) throw error;
      }

      setIsStudentModalOpen(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data siswa. Username atau Token mungkin duplikat.');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus siswa ini? Semua catatan absensi, stempel, dan prestasi anak ini akan terhapus.')) return;
    try {
      const { error } = await supabase.from('siswa').delete().eq('id', studentId);
      if (error) throw error;
      fetchInitialData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus siswa.');
    }
  };

  const handleGenerateNewToken = () => {
    setStudentForm(prev => ({
      ...prev,
      token: 'tkn_' + Math.random().toString(36).substring(2, 10)
    }));
  };

  // --- Aksi Stempel ---
  const handleGiveBadge = async (e) => {
    e.preventDefault();
    if (!selectedStudentForBadge || !selectedBadgeId) {
      alert('Pilih siswa dan jenis stempel terlebih dahulu.');
      return;
    }

    setGivingBadge(true);
    try {
      const { error } = await supabase
        .from('catatan_stempel')
        .insert({
          siswa_id: selectedStudentForBadge,
          badge_id: selectedBadgeId,
          catatan: badgeNote
        });

      if (error) throw error;
      alert('Stempel apresiasi berhasil diberikan!');
      setSelectedStudentForBadge('');
      setSelectedBadgeId('');
      setBadgeNote('');
    } catch (err) {
      console.error(err);
      alert('Gagal memberikan stempel.');
    } finally {
      setGivingBadge(false);
    }
  };

  // --- Aksi Prestasi ---
  const handleSavePrestasi = async (e) => {
    e.preventDefault();
    if (!selectedStudentForPrestasi || !prestasiForm.judul) {
      alert('Pilih siswa dan isi judul prestasi.');
      return;
    }

    setSavingPrestasi(true);
    try {
      const { error } = await supabase
        .from('prestasi')
        .insert({
          siswa_id: selectedStudentForPrestasi,
          tanggal: prestasiForm.tanggal,
          judul_prestasi: prestasiForm.judul,
          deskripsi: prestasiForm.deskripsi
        });

      if (error) throw error;
      alert('Prestasi siswa berhasil dicatat!');
      setSelectedStudentForPrestasi('');
      setPrestasiForm({ tanggal: new Date().toISOString().split('T')[0], judul: '', deskripsi: '' });
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan prestasi.');
    } finally {
      setSavingPrestasi(false);
    }
  };

  // --- Aksi Pengumuman & Komentar ---
  const fetchAnnouncements = async () => {
    try {
      const { data } = await supabase
        .from('pengumuman')
        .select('*')
        .order('tanggal', { ascending: false });
      setAnnouncements(data || []);

      if (data && data.length > 0) {
        const ids = data.map(a => a.id);
        const { data: cmtData } = await supabase
          .from('komentar')
          .select('*')
          .in('pengumuman_id', ids)
          .order('created_at', { ascending: true });

        const grouped = {};
        cmtData?.forEach(c => {
          if (!grouped[c.pengumuman_id]) grouped[c.pengumuman_id] = [];
          grouped[c.pengumuman_id].push(c);
        });
        setComments(grouped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.isi) return;

    setSavingAnnouncement(true);
    try {
      const { error } = await supabase
        .from('pengumuman')
        .insert({
          kelas_id: classInfo.id,
          kategori: announcementForm.kategori,
          isi: announcementForm.isi,
          link_luar: announcementForm.link_luar || null
        });

      if (error) throw error;
      setAnnouncementForm({ kategori: 'Informasi', isi: '', link_luar: '' });
      fetchAnnouncements();
      alert('Pengumuman berhasil diposting!');
    } catch (err) {
      console.error(err);
      alert('Gagal memposting pengumuman.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      const { error } = await supabase.from('komentar').delete().eq('id', commentId);
      if (error) throw error;
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus komentar.');
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('Hapus pengumuman ini? Semua komentar di dalamnya juga akan terhapus.')) return;
    try {
      const { error } = await supabase.from('pengumuman').delete().eq('id', annId);
      if (error) throw error;
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus pengumuman.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e8f5e9', borderTopColor: '#2d6a4f', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#2d6a4f', fontWeight: 500 }}>Memuat Dasbor Guru...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* Top Navbar */}
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Dasbor Wali Kelas</h2>
            <p style={{ opacity: 0.9, fontSize: '0.85rem' }}>{classInfo?.nama_kelas || 'Nama Kelas'}</p>
          </div>
          <button 
            onClick={onLogout} 
            style={{ 
              background: 'rgba(255,255,255,0.15)', 
              border: 'none', 
              color: 'white', 
              padding: '8px', 
              borderRadius: '50%', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Keluar"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Wali Kelas Info Area */}
        <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.12)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem' }}>
          {isEditingWali ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 10px', fontSize: '0.85rem' }} 
                value={waliName} 
                onChange={(e) => setWaliName(e.target.value)} 
                placeholder="Nama Wali Kelas"
              />
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 10px', fontSize: '0.85rem' }} 
                value={waliWa} 
                onChange={(e) => setWaliWa(e.target.value)} 
                placeholder="Nomor WA Wali (e.g. 628...)"
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={handleUpdateWali} style={{ background: '#d4af37', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Simpan</button>
                <button onClick={() => setIsEditingWali(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Batal</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p><strong>Wali Kelas:</strong> {classInfo?.nama_wali}</p>
                <p><strong>WhatsApp:</strong> {classInfo?.wa_wali}</p>
              </div>
              <button 
                onClick={() => setIsEditingWali(true)} 
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                title="Edit Wali Kelas"
              >
                <Edit size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 6px -4px rgba(0,0,0,0.05)'
      }}>
        {[
          { id: 'attendance', label: 'Absensi', icon: UserCheck },
          { id: 'students', label: 'Siswa', icon: Users },
          { id: 'badges', label: 'Beri Stempel', icon: Award },
          { id: 'achievements', label: 'Prestasi', icon: Star },
          { id: 'announcements', label: 'Pengumuman', icon: Megaphone }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                padding: '14px 12px',
                border: 'none',
                background: 'none',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: activeTab === t.id ? '#2d6a4f' : '#6c757d',
                borderBottom: activeTab === t.id ? '3px solid #2d6a4f' : '3px solid transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '85px'
              }}
            >
              <Icon size={16} style={{ marginBottom: '4px' }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="fade-in">
        
        {/* TAB 1: ABSENSI */}
        {activeTab === 'attendance' && (
          <>
            <Card>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '14px', fontWeight: 600 }}>Pilih Tanggal & Aksi Cepat</h3>
              <div className="form-group">
                <label className="form-label" htmlFor="att-date">Tanggal Absensi</label>
                <input 
                  type="date" 
                  id="att-date"
                  className="form-input" 
                  value={attendanceDate} 
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
              <Button onClick={handleMarkAllPresent} variant="outline" style={{ fontSize: '0.88rem' }}>
                Hadirkan Semua Siswa
              </Button>
            </Card>

            <Card>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '14px', fontWeight: 600 }}>Daftar Kehadiran</h3>
              {students.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Belum ada siswa terdaftar. Tambahkan siswa terlebih dahulu di tab 'Siswa'.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {students.map((s) => {
                    const studentAbsence = absences[s.id] || { status: 'Hadir', keterangan: '' };
                    return (
                      <div key={s.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '14px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '8px', color: '#1b4332' }}>{s.nama_siswa}</div>
                        
                        {/* Selector Kehadiran */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                          {['Hadir', 'Izin', 'Sakit', 'Alpa'].map((st) => {
                            const isSelected = studentAbsence.status === st;
                            let btnBg = 'rgba(0,0,0,0.03)';
                            let btnColor = '#6c757d';
                            
                            if (isSelected) {
                              if (st === 'Hadir') { btnBg = 'var(--color-hadir)'; btnColor = 'white'; }
                              if (st === 'Izin') { btnBg = 'var(--color-izin)'; btnColor = 'white'; }
                              if (st === 'Sakit') { btnBg = 'var(--color-sakit)'; btnColor = 'white'; }
                              if (st === 'Alpa') { btnBg = 'var(--color-alpa)'; btnColor = 'white'; }
                            }
                            
                            return (
                              <button
                                key={st}
                                onClick={() => handleAbsenceChange(s.id, 'status', st)}
                                style={{
                                  flex: 1,
                                  border: 'none',
                                  padding: '8px 4px',
                                  borderRadius: '6px',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  background: btnBg,
                                  color: btnColor,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>

                        {/* Input Keterangan jika non-Hadir */}
                        {studentAbsence.status !== 'Hadir' && (
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            placeholder={`Keterangan ${studentAbsence.status} (misal: Demam tinggi / Ke luar kota)`}
                            value={studentAbsence.keterangan || ''}
                            onChange={(e) => handleAbsenceChange(s.id, 'keterangan', e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}

                  <Button onClick={handleSaveAttendance} loading={savingAttendance} style={{ marginTop: '10px' }}>
                    Simpan Absensi Hari Ini
                  </Button>
                </div>
              )}
            </Card>
          </>
        )}

        {/* TAB 2: KELOLA SISWA (CRUD) */}
        {activeTab === 'students' && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', fontWeight: 600 }}>Kelola Data Siswa</h3>
              <button 
                onClick={() => handleOpenStudentModal()}
                style={{
                  background: '#2d6a4f',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Tambah Siswa Baru"
              >
                <Plus size={18} />
              </button>
            </div>

            {students.length === 0 ? (
              <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                Belum ada siswa terdaftar. Klik tombol (+) di atas untuk menambahkan.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {students.map((s) => (
                  <div 
                    key={s.id} 
                    style={{ 
                      background: '#f8f9fa', 
                      padding: '12px', 
                      borderRadius: '10px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#1b4332', fontSize: '0.9rem' }}>{s.nama_siswa}</div>
                      <div style={{ color: '#6c757d', marginTop: '2px' }}>User: {s.username} | Pass: {s.password}</div>
                      <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '2px' }}>Public Token: {s.token}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleOpenStudentModal(s)} 
                        style={{ background: 'none', border: 'none', color: '#2d6a4f', cursor: 'pointer' }}
                        title="Edit Siswa"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(s.id)} 
                        style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}
                        title="Hapus Siswa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 3: BERI STEMPEL */}
        {activeTab === 'badges' && (
          <Card>
            <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '16px', fontWeight: 600 }}>Berikan Stempel Apresiasi</h3>
            <form onSubmit={handleGiveBadge}>
              <div className="form-group">
                <label className="form-label" htmlFor="badge-student">Pilih Siswa</label>
                <select 
                  id="badge-student"
                  className="form-input" 
                  value={selectedStudentForBadge} 
                  onChange={(e) => setSelectedStudentForBadge(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nama_siswa}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Stempel (Medali)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
                  {masterBadges.map(b => {
                    const isSelected = selectedBadgeId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBadgeId(b.id)}
                        style={{
                          background: isSelected ? 'var(--accent-light)' : 'white',
                          border: isSelected ? '2px solid var(--accent)' : '1.5px solid rgba(0,0,0,0.1)',
                          borderRadius: '12px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{b.simbol}</span>
                        <span>{b.nama_stempel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="badge-note">Catatan Tambahan (Opsional)</label>
                <input 
                  type="text" 
                  id="badge-note"
                  className="form-input" 
                  placeholder="Misal: Menyelesaikan tugas tepat waktu..."
                  value={badgeNote} 
                  onChange={(e) => setBadgeNote(e.target.value)}
                />
              </div>

              <Button type="submit" loading={givingBadge}>
                Berikan Stempel
              </Button>
            </form>
          </Card>
        )}

        {/* TAB 4: CATATAN PRESTASI */}
        {activeTab === 'achievements' && (
          <Card>
            <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '16px', fontWeight: 600 }}>Catat Prestasi Baru Siswa</h3>
            <form onSubmit={handleSavePrestasi}>
              <div className="form-group">
                <label className="form-label" htmlFor="prestasi-student">Pilih Siswa</label>
                <select 
                  id="prestasi-student"
                  className="form-input" 
                  value={selectedStudentForPrestasi} 
                  onChange={(e) => setSelectedStudentForPrestasi(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nama_siswa}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prestasi-date">Tanggal Capaian</label>
                <input 
                  type="date" 
                  id="prestasi-date"
                  className="form-input" 
                  value={prestasiForm.tanggal}
                  onChange={(e) => setPrestasiForm(prev => ({ ...prev, tanggal: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prestasi-title">Judul Prestasi / Capaian</label>
                <input 
                  type="text" 
                  id="prestasi-title"
                  className="form-input" 
                  placeholder="Misal: Juara 1 Lomba Adzan / Hafal Juz 30"
                  value={prestasiForm.judul}
                  onChange={(e) => setPrestasiForm(prev => ({ ...prev, judul: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="prestasi-desc">Deskripsi Singkat</label>
                <textarea 
                  id="prestasi-desc"
                  className="form-input" 
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Penjelasan detail prestasi..."
                  value={prestasiForm.deskripsi}
                  onChange={(e) => setPrestasiForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                />
              </div>

              <Button type="submit" loading={savingPrestasi}>
                Simpan Catatan Prestasi
              </Button>
            </form>
          </Card>
        )}

        {/* TAB 5: PENGUMUMAN */}
        {activeTab === 'announcements' && (
          <>
            <Card>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '16px', fontWeight: 600 }}>Posting Pengumuman Baru</h3>
              <form onSubmit={handleSaveAnnouncement}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ann-cat">Kategori</label>
                  <select 
                    id="ann-cat"
                    className="form-input" 
                    value={announcementForm.kategori} 
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, kategori: e.target.value }))}
                  >
                    <option value="Informasi">Informasi</option>
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ann-content">Isi Pengumuman (Teks Singkat)</label>
                  <textarea 
                    id="ann-content"
                    className="form-input" 
                    style={{ height: '90px', resize: 'none' }}
                    placeholder="Tulis pengumuman di sini..."
                    value={announcementForm.isi} 
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, isi: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" htmlFor="ann-link">Link Luar (Google Drive Foto Kegiatan)</label>
                  <input 
                    type="url" 
                    id="ann-link"
                    className="form-input" 
                    placeholder="https://drive.google.com/..."
                    value={announcementForm.link_luar} 
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, link_luar: e.target.value }))}
                  />
                </div>

                <Button type="submit" loading={savingAnnouncement}>
                  Post Pengumuman
                </Button>
              </form>
            </Card>

            <Card>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '16px', fontWeight: 600 }}>Riwayat Pengumuman & Komentar</h3>
              {announcements.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Belum ada pengumuman terkirim.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {announcements.map((a) => (
                    <div key={a.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '16px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>
                          {new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#e8f5e9', color: '#2d6a4f', fontWeight: 600 }}>
                            {a.kategori}
                          </span>
                          <button 
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}
                            title="Hapus Pengumuman"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: '#333', whiteSpace: 'pre-line', marginBottom: '6px' }}>{a.isi}</p>
                      {a.link_luar && (
                        <a href={a.link_luar} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#2d6a4f', textDecoration: 'underline' }}>
                          Link Google Drive
                        </a>
                      )}

                      {/* Tampilan Komentar Wali Murid */}
                      <div className="comment-box" style={{ marginTop: '12px', background: 'rgba(0,0,0,0.01)', padding: '10px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1b4332', display: 'block', marginBottom: '6px' }}>
                          Tanggapan Wali Murid ({(comments[a.id] || []).length})
                        </span>
                        <div className="comment-list" style={{ maxHeight: '150px' }}>
                          {(comments[a.id] || []).length === 0 ? (
                            <span style={{ color: '#888', fontSize: '0.72rem', fontStyle: 'italic' }}>Belum ada tanggapan.</span>
                          ) : (
                            comments[a.id].map((c) => (
                              <div key={c.id} className="comment-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 8px' }}>
                                <div>
                                  <div className="comment-author">{c.nama_user}</div>
                                  <div style={{ color: '#333', fontSize: '0.8rem', marginTop: '1px' }}>{c.komentar}</div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteComment(c.id)}
                                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '2px' }}
                                  title="Hapus Komentar"
                                >
                                  &times;
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {/* MODAL CRUD SISWA */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title={currentStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
      >
        <form onSubmit={handleSaveStudent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="form-student-name">Nama Lengkap Siswa</label>
            <input 
              type="text" 
              id="form-student-name"
              className="form-input" 
              value={studentForm.nama_siswa}
              onChange={(e) => setStudentForm(prev => ({ ...prev, nama_siswa: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-student-user">Username Login (Wali)</label>
            <input 
              type="text" 
              id="form-student-user"
              className="form-input" 
              value={studentForm.username}
              onChange={(e) => setStudentForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-student-pass">Password Login (Wali)</label>
            <input 
              type="text" 
              id="form-student-pass"
              className="form-input" 
              value={studentForm.password}
              onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-parent-name">Nama Orang Tua / Wali</label>
            <input 
              type="text" 
              id="form-parent-name"
              className="form-input" 
              value={studentForm.nama_ortu}
              onChange={(e) => setStudentForm(prev => ({ ...prev, nama_ortu: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-parent-wa">Nomor WhatsApp Orang Tua</label>
            <input 
              type="text" 
              id="form-parent-wa"
              className="form-input" 
              placeholder="e.g. 628..."
              value={studentForm.wa_ortu}
              onChange={(e) => setStudentForm(prev => ({ ...prev, wa_ortu: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-student-addr">Alamat Rumah</label>
            <input 
              type="text" 
              id="form-student-addr"
              className="form-input" 
              value={studentForm.alamat}
              onChange={(e) => setStudentForm(prev => ({ ...prev, alamat: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-student-token">Akses Token Publik (Laporan Publik)</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="text" 
                id="form-student-token"
                className="form-input" 
                value={studentForm.token}
                readOnly
                required
              />
              <button
                type="button"
                onClick={handleGenerateNewToken}
                style={{
                  background: '#fcf6bd',
                  border: '1.5px solid var(--accent)',
                  borderRadius: '10px',
                  padding: '0 12px',
                  cursor: 'pointer',
                  color: 'var(--accent-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Ganti Token Baru"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>
              Token ini digunakan untuk link publik tanpa login. Ganti berkala demi keamanan data.
            </p>
          </div>

          <Button type="submit" style={{ marginTop: '8px' }}>
            Simpan Data Siswa
          </Button>
        </form>
      </Modal>
    </div>
  );
};
