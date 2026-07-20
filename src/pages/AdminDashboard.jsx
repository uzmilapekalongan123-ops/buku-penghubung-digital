import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Calendar, UserCheck, Users, Award, Star, Megaphone, LogOut, Edit, Trash2, Plus, MessageCircle, RefreshCw, Search, ShieldAlert, PlusCircle, Upload, Smile } from 'lucide-react';

export const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'students', 'badges', 'achievements', 'announcements'
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Edit Wali Kelas
  const [isEditingWali, setIsEditingWali] = useState(false);
  const [waliName, setWaliName] = useState('');
  const [waliWa, setWaliWa] = useState('');

  // --- Search Query State ---
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // --- State Absensi ---
  const [absences, setAbsences] = useState({}); // { studentId: { status: 'Hadir', keterangan: '' } }
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // --- State CRUD Siswa ---
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    username: '', password: '', nama_siswa: '', alamat: '', nama_ortu: '', wa_ortu: '', token: ''
  });
  const [generatingAllTokens, setGeneratingAllTokens] = useState(false);

  // --- State Beri Stempel ---
  const [masterBadges, setMasterBadges] = useState([]);
  const [selectedStudentForBadge, setSelectedStudentForBadge] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [badgeNote, setBadgeNote] = useState('');
  const [givingBadge, setGivingBadge] = useState(false);
  const [activeBadgeGroupFilter, setActiveBadgeGroupFilter] = useState('Semmua');

  // --- State Stempel yang Dimiliki Siswa Terpilih (Dapat Ditarik/Dihapus) ---
  const [givenBadges, setGivenBadges] = useState([]);
  const [loadingGivenBadges, setLoadingGivenBadges] = useState(false);

  // --- State Tambah Katalog Stempel Baru ---
  const [isAddingNewBadgeCatalog, setIsAddingNewBadgeCatalog] = useState(false);
  const [iconMode, setIconMode] = useState('emoji'); // 'emoji' | 'upload'
  const [newBadgeForm, setNewBadgeForm] = useState({
    nama_stempel: '', simbol: '⭐', gambar_url: '', deskripsi: '', grup_stempel: 'Apresiasi', custom_grup_stempel: ''
  });
  const [uploadError, setUploadError] = useState('');
  const [savingNewBadgeCatalog, setSavingNewBadgeCatalog] = useState(false);

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

  // Efek memuat riwayat stempel siswa secara dinamis saat siswa dipilih
  useEffect(() => {
    if (selectedStudentForBadge) {
      fetchGivenBadges(selectedStudentForBadge);
    } else {
      setGivenBadges([]);
    }
  }, [selectedStudentForBadge]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const { data: clsData } = await supabase.from('kelas').select('*');
      if (clsData && clsData.length > 0) {
        setClassInfo(clsData[0]);
        setWaliName(clsData[0].nama_wali);
        setWaliWa(clsData[0].wa_wali);
        
        const { data: stdData } = await supabase
          .from('siswa')
          .select('*')
          .eq('kelas_id', clsData[0].id)
          .order('nama_siswa', { ascending: true });
        setStudents(stdData || []);
      }

      const { data: bdgData } = await supabase.from('master_badge').select('*');
      setMasterBadges(bdgData || []);

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
      students.forEach(s => {
        absMap[s.id] = { status: 'Hadir', keterangan: '' };
      });
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
    const filtered = students.filter(s => s.nama_siswa.toLowerCase().includes(attendanceSearchQuery.toLowerCase()));
    filtered.forEach(s => {
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
        const { error } = await supabase
          .from('siswa')
          .update(studentForm)
          .eq('id', currentStudent.id);
        if (error) throw error;
      } else {
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

  const handleGenerateAllTokens = async () => {
    if (students.length === 0) return;
    if (!window.confirm('Apakah Anda yakin ingin me-reset & membuat ulang token akses publik untuk SEMUA siswa? Tautan laporan publik lama wali murid tidak akan bisa diakses lagi setelah reset ini.')) return;

    setGeneratingAllTokens(true);
    try {
      for (const s of students) {
        const newToken = 'tkn_' + Math.random().toString(36).substring(2, 10);
        const { error } = await supabase
          .from('siswa')
          .update({ token: newToken })
          .eq('id', s.id);
        
        if (error) throw error;
      }
      
      alert('Berhasil membuat ulang semua token akses siswa!');
      fetchInitialData();
    } catch (err) {
      console.error('Error generating all tokens:', err);
      alert('Terjadi kesalahan saat membuat ulang token akses.');
    } finally {
      setGeneratingAllTokens(false);
    }
  };

  // --- Aksi Stempel (Beri, Tarik, Tambah Katalog, Hapus Katalog) ---
  const fetchGivenBadges = async (studentId) => {
    try {
      setLoadingGivenBadges(true);
      const { data, error } = await supabase
        .from('catatan_stempel')
        .select('*, master_badge(*)')
        .eq('siswa_id', studentId)
        .order('tanggal_waktu', { ascending: false });
      
      if (error) throw error;
      setGivenBadges(data || []);
    } catch (err) {
      console.error('Error fetching given badges:', err);
    } finally {
      setLoadingGivenBadges(false);
    }
  };

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
      setSelectedBadgeId('');
      setBadgeNote('');
      fetchGivenBadges(selectedStudentForBadge); // Refresh riwayat stempel siswa terpilih
    } catch (err) {
      console.error(err);
      alert('Gagal memberikan stempel.');
    } finally {
      setGivingBadge(false);
    }
  };

  const handleDeleteGivenBadge = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menarik/menghapus pemberian stempel ini dari ananda?')) return;
    try {
      const { error } = await supabase
        .from('catatan_stempel')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Stempel berhasil ditarik!');
      fetchGivenBadges(selectedStudentForBadge);
    } catch (err) {
      console.error(err);
      alert('Gagal menarik stempel.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setUploadError('');
    if (!file) return;

    if (file.size > 50 * 1024) {
      setUploadError('Ukuran berkas melebihi batas 50 KB! Silakan kompres gambar atau pilih gambar lain.');
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewBadgeForm(prev => ({
        ...prev,
        gambar_url: reader.result,
        simbol: ''
      }));
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca berkas gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewBadgeCatalog = async (e) => {
    e.preventDefault();
    if (!newBadgeForm.nama_stempel || !newBadgeForm.deskripsi) {
      alert('Lengkapi nama stempel dan penjelasan.');
      return;
    }

    if (iconMode === 'emoji' && !newBadgeForm.simbol) {
      alert('Masukkan simbol emoji stempel.');
      return;
    }

    if (iconMode === 'upload' && !newBadgeForm.gambar_url) {
      alert('Pilih file gambar kustom terlebih dahulu.');
      return;
    }

    const groupToSave = newBadgeForm.grup_stempel === 'NEW_GROUP' 
      ? newBadgeForm.custom_grup_stempel.trim() 
      : newBadgeForm.grup_stempel;

    if (!groupToSave) {
      alert('Tulis nama grup stempel baru.');
      return;
    }

    setSavingNewBadgeCatalog(true);
    try {
      const { error } = await supabase
        .from('master_badge')
        .insert({
          nama_stempel: newBadgeForm.nama_stempel,
          simbol: iconMode === 'emoji' ? newBadgeForm.simbol : '🖼️',
          gambar_url: iconMode === 'upload' ? newBadgeForm.gambar_url : null,
          deskripsi: newBadgeForm.deskripsi,
          grup_stempel: groupToSave
        });

      if (error) throw error;
      alert('Stempel baru berhasil ditambahkan ke katalog!');
      
      setNewBadgeForm({ nama_stempel: '', simbol: '⭐', gambar_url: '', deskripsi: '', grup_stempel: 'Apresiasi', custom_grup_stempel: '' });
      setIsAddingNewBadgeCatalog(false);
      setIconMode('emoji');
      
      const { data: bdgData } = await supabase.from('master_badge').select('*');
      setMasterBadges(bdgData || []);
    } catch (err) {
      console.error('Error saving new master badge:', err);
      alert('Gagal menambahkan stempel ke katalog.');
    } finally {
      setSavingNewBadgeCatalog(false);
    }
  };

  const handleDeleteMasterBadge = async (badgeId, badgeName) => {
    if (!window.confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus stempel "${badgeName}" dari katalog? \n\nTindakan ini secara otomatis akan menghapus stempel ini dari seluruh siswa yang telah mendapatkannya.`)) return;
    try {
      const { error } = await supabase
        .from('master_badge')
        .delete()
        .eq('id', badgeId);

      if (error) throw error;
      alert(`Stempel "${badgeName}" berhasil dihapus dari katalog!`);

      if (selectedBadgeId === badgeId) {
        setSelectedBadgeId('');
      }

      // Refresh katalog
      const { data: bdgData } = await supabase.from('master_badge').select('*');
      setMasterBadges(bdgData || []);

      // Refresh riwayat stempel siswa terpilih
      if (selectedStudentForBadge) {
        fetchGivenBadges(selectedStudentForBadge);
      }
    } catch (err) {
      console.error('Error deleting master badge:', err);
      alert('Gagal menghapus stempel dari katalog.');
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

  // --- Aksi Pengumuman ---
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
      if (announcementForm.kategori === 'Sangat Penting') {
        console.log("Menghapus pengumuman Sangat Penting yang sudah ada...");
        const { error: delError } = await supabase
          .from('pengumuman')
          .delete()
          .eq('kategori', 'Sangat Penting');
        
        if (delError) {
          console.warn("Gagal menghapus pengumuman Sangat Penting lama:", delError);
        }
      }

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

  const filteredStudentsForAttendance = students.filter(s => 
    s.nama_siswa.toLowerCase().includes(attendanceSearchQuery.toLowerCase())
  );

  const filteredStudentsForList = students.filter(s => 
    s.nama_siswa.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const dbBadgeGroups = Array.from(new Set(masterBadges.map(b => b.grup_stempel).filter(Boolean)));

  const filteredMasterBadgesForGiving = activeBadgeGroupFilter === 'Semua'
    ? masterBadges
    : masterBadges.filter(b => b.grup_stempel === activeBadgeGroupFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* Top Navbar */}
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Dasbor Wali Kelas</h2>
            <p style={{ opacity: 0.95, fontSize: '0.85rem', fontWeight: 500 }}>Wali Kelas: {classInfo?.nama_wali || 'Guru'}</p>
          </div>
          <button 
            onClick={onLogout} 
            style={{ 
              background: '#ffe2e2', 
              border: '1.5px solid #ffb3b3', 
              color: '#c62828', 
              padding: '8px 14px', 
              borderRadius: '20px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 2px 5px rgba(198, 40, 40, 0.1)'
            }}
            title="Keluar"
          >
            <LogOut size={16} />
            Keluar
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
          { id: 'badges', label: 'Stempel', icon: Award },
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
                padding: 'clamp(8px, 2.2vw, 12px) clamp(2px, 0.8vw, 8px)',
                border: 'none',
                background: 'none',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: 'clamp(0.68rem, 2.2vw, 0.8rem)',
                color: activeTab === t.id ? '#2d6a4f' : '#6c757d',
                borderBottom: activeTab === t.id ? '3px solid #2d6a4f' : '3px solid transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '0'
              }}
            >
              <Icon size={16} style={{ marginBottom: '4px' }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="fade-in">
        
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
                Hadirkan Semua Siswa (Sesuai Pencarian)
              </Button>
            </Card>

            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#1b4332', fontWeight: 600, margin: 0 }}>Daftar Kehadiran</h3>
                
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                    placeholder="Cari nama siswa untuk diabsen..."
                    value={attendanceSearchQuery}
                    onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                </div>
              </div>

              {students.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Belum ada siswa terdaftar. Tambahkan siswa terlebih dahulu di tab 'Siswa'.
                </p>
              ) : filteredStudentsForAttendance.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Siswa dengan nama "{attendanceSearchQuery}" tidak ditemukan.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredStudentsForAttendance.map((s) => {
                    const studentAbsence = absences[s.id] || { status: 'Hadir', keterangan: '' };
                    return (
                      <div key={s.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '14px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '8px', color: '#1b4332' }}>{s.nama_siswa}</div>
                        
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

        {/* TAB 2: KELOLA SISWA */}
        {activeTab === 'students' && (
          <>
            <Card style={{ background: '#fff9db', border: '1px solid #ffe066' }}>
              <h3 style={{ fontSize: '1rem', color: '#b58d16', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} /> Keamanan: Reset Akses Masal
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#666', marginBottom: '12px', lineHeight: 1.4 }}>
                Reset semua token akses siswa sekaligus. Langkah ini membuat seluruh tautan laporan publik yang dibagikan sebelumnya tidak valid demi keamanan berkala.
              </p>
              <Button 
                onClick={handleGenerateAllTokens} 
                variant="accent" 
                loading={generatingAllTokens}
                style={{ padding: '10px 16px', fontSize: '0.85rem' }}
              >
                Ganti Token Semua Siswa
              </Button>
            </Card>

            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#1b4332', fontWeight: 600, margin: 0 }}>Kelola Data Siswa</h3>
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

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                    placeholder="Cari siswa berdasarkan nama..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                </div>
              </div>

              {students.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Belum ada siswa terdaftar. Klik tombol (+) di atas untuk menambahkan.
                </p>
              ) : filteredStudentsForList.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Siswa dengan nama "{studentSearchQuery}" tidak ditemukan.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredStudentsForList.map((s) => (
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
          </>
        )}

        {/* TAB 3: BERI STEMPEL & TAMBAH STEMPEL */}
        {activeTab === 'badges' && (
          <>
            {/* Form 1: Tambah Stempel Baru ke Katalog */}
            <Card style={{ borderLeft: '4px solid var(--accent)' }}>
              <div 
                onClick={() => setIsAddingNewBadgeCatalog(!isAddingNewBadgeCatalog)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <h3 style={{ fontSize: '1.05rem', color: '#1b4332', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlusCircle size={20} color="var(--accent)" />
                  Tambah Stempel Baru ke Katalog
                </h3>
                <span style={{ fontSize: '1.2rem', color: '#888', fontWeight: 'bold' }}>{isAddingNewBadgeCatalog ? '−' : '+'}</span>
              </div>

              {isAddingNewBadgeCatalog && (
                <form onSubmit={handleAddNewBadgeCatalog} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="badge-name">Nama Stempel</label>
                    <input 
                      type="text" 
                      id="badge-name"
                      className="form-input" 
                      placeholder="Misal: Hafalan Lancar / Kerapian Terbaik"
                      value={newBadgeForm.nama_stempel}
                      onChange={(e) => setNewBadgeForm(prev => ({ ...prev, nama_stempel: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Jenis Simbol Stempel</label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setIconMode('emoji')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: iconMode === 'emoji' ? '2px solid var(--accent)' : '1px solid #ccc',
                          background: iconMode === 'emoji' ? 'var(--accent-light)' : 'white',
                          color: iconMode === 'emoji' ? 'var(--accent-dark)' : '#666',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}
                      >
                        <Smile size={16} />
                        Emoji Simbol
                      </button>
                      <button
                        type="button"
                        onClick={() => setIconMode('upload')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: iconMode === 'upload' ? '2px solid var(--accent)' : '1px solid #ccc',
                          background: iconMode === 'upload' ? 'var(--accent-light)' : 'white',
                          color: iconMode === 'upload' ? 'var(--accent-dark)' : '#666',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}
                      >
                        <Upload size={16} />
                        Upload Gambar
                      </button>
                    </div>
                  </div>

                  {iconMode === 'emoji' ? (
                    <div className="form-group">
                      <label className="form-label" htmlFor="badge-emoji-input">Simbol Emoji</label>
                      <input 
                        type="text" 
                        id="badge-emoji-input"
                        className="form-input" 
                        style={{ fontSize: '1.2rem', width: '80px', textAlign: 'center' }}
                        value={newBadgeForm.simbol}
                        onChange={(e) => setNewBadgeForm(prev => ({ ...prev, simbol: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label" htmlFor="badge-upload-file">Pilih Gambar Stempel (Maks 50 KB)</label>
                      <input 
                        type="file" 
                        id="badge-upload-file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'block', fontSize: '0.85rem', width: '100%', marginTop: '6px' }}
                      />
                      {newBadgeForm.gambar_url && (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#2d6a4f', fontWeight: 600 }}>Pratinjau:</span>
                          <img 
                            src={newBadgeForm.gambar_url} 
                            alt="Preview stempel kustom" 
                            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '50%', border: '1px solid #ccc' }} 
                          />
                        </div>
                      )}
                      {uploadError && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-alpa)', fontWeight: 500, marginTop: '4px' }}>
                          ❌ {uploadError}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="badge-group">Grup Stempel</label>
                    <select 
                      id="badge-group"
                      className="form-input"
                      value={newBadgeForm.grup_stempel}
                      onChange={(e) => setNewBadgeForm(prev => ({ ...prev, grup_stempel: e.target.value }))}
                    >
                      <option value="Apresiasi">Apresiasi</option>
                      <option value="Disiplin">Disiplin</option>
                      <option value="Evaluasi">Evaluasi</option>
                      {dbBadgeGroups.filter(g => g !== 'Apresiasi' && g !== 'Disiplin' && g !== 'Evaluasi').map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                      <option value="NEW_GROUP">+ Tambah Grup Baru...</option>
                    </select>
                  </div>

                  {newBadgeForm.grup_stempel === 'NEW_GROUP' && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="custom-group-name">Nama Grup Stempel Baru</label>
                      <input 
                        type="text" 
                        id="custom-group-name"
                        className="form-input" 
                        placeholder="Misal: Hafalan Al-Qur'an / Kebersihan"
                        value={newBadgeForm.custom_grup_stempel}
                        onChange={(e) => setNewBadgeForm(prev => ({ ...prev, custom_grup_stempel: e.target.value }))}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="badge-desc">Penjelasan / Deskripsi</label>
                    <textarea 
                      id="badge-desc"
                      className="form-input" 
                      style={{ height: '70px', resize: 'none' }}
                      placeholder="Diberikan kepada siswa yang..."
                      value={newBadgeForm.deskripsi}
                      onChange={(e) => setNewBadgeForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                      required
                    />
                  </div>

                  <Button type="submit" loading={savingNewBadgeCatalog} variant="accent">
                    Simpan ke Katalog Stempel
                  </Button>
                </form>
              )}
            </Card>

            {/* Form 2: Berikan Stempel Apresiasi */}
            <Card>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '14px', fontWeight: 600 }}>Berikan Stempel Apresiasi</h3>
              
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
                  <label className="form-label">Saring Grup Stempel</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '12px' }}>
                    {['Semua', ...dbBadgeGroups].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setActiveBadgeGroupFilter(g)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '16px',
                          border: activeBadgeGroupFilter === g ? '1.5px solid var(--accent)' : '1px solid rgba(0,0,0,0.1)',
                          background: activeBadgeGroupFilter === g ? 'var(--accent-light)' : 'white',
                          color: activeBadgeGroupFilter === g ? 'var(--accent-dark)' : '#6c757d',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Pilih Stempel (Medali)</label>
                  
                  {filteredMasterBadgesForGiving.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.8rem', padding: '10px 0' }}>
                      Tidak ada stempel dalam grup "{activeBadgeGroupFilter}".
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                      {filteredMasterBadgesForGiving.map(b => {
                        const isSelected = selectedBadgeId === b.id;
                        return (
                          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
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
                                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                                flex: 1,
                                textAlign: 'left'
                              }}
                            >
                              {b.gambar_url ? (
                                <img 
                                  src={b.gambar_url} 
                                  alt={b.nama_stempel} 
                                  style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '50%' }} 
                                />
                              ) : (
                                <span style={{ fontSize: '1.2rem' }}>{b.simbol || '⭐'}</span>
                              )}
                              <span>{b.nama_stempel}</span>
                            </button>
                            
                            {/* Tombol Hapus Katalog Stempel */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMasterBadge(b.id, b.nama_stempel)}
                              style={{
                                background: '#ffe2e2',
                                border: '1px solid #ffb3b3',
                                borderRadius: '8px',
                                width: '34px',
                                height: '34px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#c62828'
                              }}
                              title="Hapus stempel ini dari katalog"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

              {/* Riwayat Stempel Siswa Terpilih (Untuk Menarik/Menghapus Stempel yang Diberikan) */}
              {selectedStudentForBadge && (
                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.92rem', color: '#1b4332', fontWeight: 600, marginBottom: '10px' }}>
                    Riwayat Stempel Siswa Ini (Dapat Ditarik/Dihapus)
                  </h4>
                  {loadingGivenBadges ? (
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>Memuat riwayat stempel...</p>
                  ) : givenBadges.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>Siswa ini belum memiliki stempel.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {givenBadges.map((gb) => (
                        <div 
                          key={gb.id} 
                          style={{ 
                            background: '#f8f9fa', 
                            padding: '8px 12px', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            fontSize: '0.8rem' 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
                              {gb.master_badge?.gambar_url ? (
                                <img src={gb.master_badge.gambar_url} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '50%' }} />
                              ) : (
                                gb.master_badge?.simbol || '⭐'
                              )}
                            </span>
                            <div>
                              <span style={{ fontWeight: 600, color: '#1b4332' }}>{gb.master_badge?.nama_stempel}</span>
                              <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '6px' }}>
                                ({new Date(gb.tanggal_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                              </span>
                              {gb.catatan && <div style={{ color: '#555', fontStyle: 'italic', fontSize: '0.75rem', marginTop: '2px' }}>"{gb.catatan}"</div>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteGivenBadge(gb.id)}
                            style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', padding: '4px' }}
                            title="Tarik stempel ini dari siswa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </>
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
                    <option value="Sangat Penting">Sangat Penting</option>
                  </select>
                  {announcementForm.kategori === 'Sangat Penting' && (
                    <p style={{ fontSize: '0.72rem', color: '#c62828', fontWeight: 500, marginTop: '4px' }}>
                      ⚠️ <i>Kategori Sangat Penting hanya boleh ada satu di sistem. Membuat yang baru akan otomatis menghapus yang lama.</i>
                    </p>
                  )}
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
                    <div key={a.id} style={{ 
                      borderBottom: '1px solid rgba(0,0,0,0.06)', 
                      paddingBottom: '16px', 
                      position: 'relative',
                      borderLeft: a.kategori === 'Sangat Penting' ? '4px solid #c62828' : undefined,
                      paddingLeft: a.kategori === 'Sangat Penting' ? '12px' : undefined,
                      background: a.kategori === 'Sangat Penting' ? '#fff5f5' : undefined
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>
                          {new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`tag-kategori tag-${a.kategori.toLowerCase().replace(/\s+/g, '-')}`}>
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
                      <p style={{ fontSize: '0.88rem', color: '#333', whiteSpace: 'pre-line', marginBottom: '6px', fontWeight: a.kategori === 'Sangat Penting' ? 500 : 400 }}>{a.isi}</p>
                      {a.link_luar && (
                        <a href={a.link_luar} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#2d6a4f', textDecoration: 'underline' }}>
                          Link Google Drive
                        </a>
                      )}

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
