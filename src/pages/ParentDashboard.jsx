import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Calendar, Award, MessageCircle, Star, Share2, LogOut, Send, AlertTriangle, ChevronRight, Info } from 'lucide-react';

export const ParentDashboard = ({ student: initialStudent, onLogout }) => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'badges', 'announcements'
  const [studentData, setStudentData] = useState(initialStudent); // Menggunakan state agar token terbaru tersinkronisasi
  const [attendance, setAttendance] = useState([]);
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [comments, setComments] = useState({}); // { announcementId: [comments] }
  const [newComments, setNewComments] = useState({}); // { announcementId: 'text' }
  const [commentErrors, setCommentErrors] = useState({}); // { announcementId: 'error' }
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);
  
  // --- State Navigasi Bulan/Tahun Kehadiran ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableMonths, setAvailableMonths] = useState([]); // [{month: 0, year: 2026}]
  const [latestRecordDateStr, setLatestRecordDateStr] = useState('');

  // --- State Modal Detail Absensi ---
  const [absenceDetailModal, setAbsenceDetailModal] = useState({ isOpen: false, status: '', list: [] });

  // --- State Pencarian Tanggal Absensi ---
  const [searchDate, setSearchDate] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // --- State Modal Detail Stempel Terkelompok ---
  const [selectedBadgeGroup, setSelectedBadgeGroup] = useState(null); // { master: {}, instances: [] }

  useEffect(() => {
    fetchData();
  }, [initialStudent.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 0. Ambil DATA SISWA TERBARU (untuk sinkronisasi token jika digenerate ulang oleh guru)
      const { data: freshStudent, error: freshError } = await supabase
        .from('siswa')
        .select('*, kelas(*)')
        .eq('id', initialStudent.id)
        .single();
      
      if (!freshError && freshStudent) {
        setStudentData(freshStudent);
      }

      // 1. Ambil data absensi
      const { data: attData } = await supabase
        .from('absensi')
        .select('*')
        .eq('siswa_id', initialStudent.id)
        .order('tanggal', { ascending: false });
      const records = attData || [];
      setAttendance(records);

      if (records.length > 0) {
        setLatestRecordDateStr(records[0].tanggal);
      } else {
        setLatestRecordDateStr(new Date().toISOString().split('T')[0]);
      }

      // 2. Ambil stempel/badge
      const { data: bdgData } = await supabase
        .from('catatan_stempel')
        .select('*, master_badge(*)')
        .eq('siswa_id', initialStudent.id)
        .order('tanggal_waktu', { ascending: false });
      setBadges(bdgData || []);

      // 3. Ambil prestasi
      const { data: prsData } = await supabase
        .from('prestasi')
        .select('*')
        .eq('siswa_id', initialStudent.id)
        .order('tanggal', { ascending: false });
      setAchievements(prsData || []);

      // 4. Ambil pengumuman kelas & umum
      const { data: annData } = await supabase
        .from('pengumuman')
        .select('*')
        .or(`kelas_id.eq.${initialStudent.kelas_id},kelas_id.is.null`)
        .order('tanggal', { ascending: false });
      setAnnouncements(annData || []);

      // 5. Ambil semua komentar untuk pengumuman yang tampil
      if (annData && annData.length > 0) {
        const annIds = annData.map(a => a.id);
        const { data: cmtData } = await supabase
          .from('komentar')
          .select('*')
          .in('pengumuman_id', annIds)
          .order('created_at', { ascending: true });
        
        const grouped = {};
        cmtData?.forEach(c => {
          if (!grouped[c.pengumuman_id]) {
            grouped[c.pengumuman_id] = [];
          }
          grouped[c.pengumuman_id].push(c);
        });
        setComments(grouped);
      }

      // 6. Hitung Rentang Bulan & Tahun yang relevan bagi siswa
      calculateAvailableMonths(records);

    } catch (err) {
      console.error('Error fetching parent dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailableMonths = (records) => {
    const list = [];
    const today = new Date();
    
    if (records.length === 0) {
      list.push({ month: today.getMonth(), year: today.getFullYear() });
      setAvailableMonths(list);
      return;
    }

    const oldestDate = new Date(records[records.length - 1].tanggal);
    const newestDate = new Date(records[0].tanggal);

    let current = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
    const end = new Date(newestDate.getFullYear(), newestDate.getMonth(), 1);

    while (current <= end) {
      list.push({
        month: current.getMonth(),
        year: current.getFullYear()
      });
      current.setMonth(current.getMonth() + 1);
    }

    setAvailableMonths(list);
    setSelectedMonth(newestDate.getMonth());
    setSelectedYear(newestDate.getFullYear());
  };

  const getMonthlyAttendanceDetails = () => {
    if (!latestRecordDateStr) return { stats: { hadir: 0, sakit: 0, izin: 0, alpa: 0, libur: 0, persentase: 100 }, calendarDays: [] };

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const calendarDays = [];
    
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let libur = 0;

    const latestRecordDate = new Date(latestRecordDateStr);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const record = attendance.find(a => a.tanggal === dateStr);

      if (record) {
        if (record.status === 'Hadir') hadir++;
        else if (record.status === 'Sakit') sakit++;
        else if (record.status === 'Izin') izin++;
        else if (record.status === 'Alpa') alpa++;
        
        calendarDays.push({
          tanggal: dateStr,
          status: record.status,
          keterangan: record.keterangan || '',
          type: 'record'
        });
      } else {
        if (currentDate > latestRecordDate) {
          calendarDays.push({
            tanggal: dateStr,
            status: 'Belum Direkam',
            keterangan: 'Absensi belum diinput oleh guru',
            type: 'future'
          });
        } else {
          libur++;
          calendarDays.push({
            tanggal: dateStr,
            status: 'Libur',
            keterangan: 'Hari Libur / Sekolah Tutup',
            type: 'holiday'
          });
        }
      }
    }

    const totalHariSekolah = hadir + sakit + izin + alpa;
    const persentase = totalHariSekolah > 0 
      ? Math.round((hadir / totalHariSekolah) * 100) 
      : 100;

    return {
      stats: { hadir, sakit, izin, alpa, libur, persentase },
      calendarDays
    };
  };

  const { stats, calendarDays } = getMonthlyAttendanceDetails();

  const openAbsenceDetail = (statusType) => {
    const list = calendarDays.filter(d => d.status === statusType);
    setAbsenceDetailModal({
      isOpen: true,
      status: statusType,
      list
    });
  };

  const handleSearchDate = (e) => {
    const dateVal = e.target.value;
    setSearchDate(dateVal);

    if (!dateVal) {
      setSearchResult(null);
      return;
    }

    const latestRecordDate = new Date(latestRecordDateStr);
    const targetDate = new Date(dateVal);
    const record = attendance.find(a => a.tanggal === dateVal);

    if (record) {
      setSearchResult({
        tanggal: dateVal,
        status: record.status,
        keterangan: record.keterangan || 'Hadir di sekolah'
      });
    } else {
      if (targetDate > latestRecordDate) {
        setSearchResult({
          tanggal: dateVal,
          status: 'Belum Direkam',
          keterangan: 'Absensi belum diumumkan / belum sampai tanggal ini.'
        });
      } else {
        setSearchResult({
          tanggal: dateVal,
          status: 'Libur',
          keterangan: 'Hari Libur / Sekolah Tutup'
        });
      }
    }
  };

  // Mengelompokkan stempel berdasarkan ID master_badge untuk menampilkan angka counter dan riwayat
  const getGroupedBadges = () => {
    const groups = {};
    badges.forEach(b => {
      if (!b.master_badge) return;
      const bid = b.badge_id;
      if (!groups[bid]) {
        groups[bid] = {
          master: b.master_badge,
          instances: []
        };
      }
      groups[bid].instances.push(b);
    });
    return Object.values(groups);
  };

  const groupedBadges = getGroupedBadges();

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleCommentChange = (announcementId, text) => {
    setNewComments(prev => ({ ...prev, [announcementId]: text }));
    
    const words = getWordCount(text);
    if (words > 10) {
      setCommentErrors(prev => ({ 
        ...prev, 
        [announcementId]: `Komentar melebihi batas! (${words}/10 kata)` 
      }));
    } else {
      setCommentErrors(prev => ({ ...prev, [announcementId]: '' }));
    }
  };

  const handleSendComment = async (announcementId) => {
    const text = newComments[announcementId] || '';
    const words = getWordCount(text);
    
    if (words === 0) return;
    if (words > 10) return;

    setSubmittingComment(prev => ({ ...prev, [announcementId]: true }));

    try {
      const { data, error } = await supabase
        .from('komentar')
        .insert({
          pengumuman_id: announcementId,
          nama_user: `Wali dari ${studentData.nama_siswa}`,
          komentar: text.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setComments(prev => {
        const currentList = prev[announcementId] || [];
        return {
          ...prev,
          [announcementId]: [...currentList, data]
        };
      });

      setNewComments(prev => ({ ...prev, [announcementId]: '' }));

    } catch (err) {
      console.error(err);
      setCommentErrors(prev => ({ ...prev, [announcementId]: 'Gagal mengirim komentar.' }));
    } finally {
      setSubmittingComment(prev => ({ ...prev, [announcementId]: false }));
    }
  };

  const handleCopyLink = () => {
    // Selalu gunakan token terbaru dari state studentData
    const publicLink = `${window.location.origin}${window.location.pathname}?token=${studentData.token}`;
    navigator.clipboard.writeText(publicLink).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* Top Navbar */}
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Buku Penghubung</h2>
            <p style={{ opacity: 0.9, fontSize: '0.85rem' }}>{studentData.kelas?.nama_kelas}</p>
          </div>
          <button 
            onClick={() => {
              console.log("Menghapus sesi & keluar...");
              onLogout();
            }}
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
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>

        <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.12)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem' }}>
          <p><strong>Siswa:</strong> {studentData.nama_siswa}</p>
          <p><strong>Orang Tua:</strong> {studentData.nama_ortu}</p>
          <p><strong>Wali Kelas:</strong> {studentData.kelas?.nama_wali}</p>
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
        boxShadow: '0 4px 6px -4px rgba(0,0,0,0.05)'
      }}>
        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            flex: 1,
            padding: '16px 10px',
            border: 'none',
            background: 'none',
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: activeTab === 'attendance' ? '#2d6a4f' : '#6c757d',
            borderBottom: activeTab === 'attendance' ? '3px solid #2d6a4f' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Calendar size={16} style={{ display: 'block', margin: '0 auto 4px auto' }} />
          Kehadiran
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          style={{
            flex: 1,
            padding: '16px 10px',
            border: 'none',
            background: 'none',
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: activeTab === 'badges' ? '#2d6a4f' : '#6c757d',
            borderBottom: activeTab === 'badges' ? '3px solid #2d6a4f' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Award size={16} style={{ display: 'block', margin: '0 auto 4px auto' }} />
          Stempel & Prestasi
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          style={{
            flex: 1,
            padding: '16px 10px',
            border: 'none',
            background: 'none',
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: activeTab === 'announcements' ? '#2d6a4f' : '#6c757d',
            borderBottom: activeTab === 'announcements' ? '3px solid #2d6a4f' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <MessageCircle size={16} style={{ display: 'block', margin: '0 auto 4px auto' }} />
          Pengumuman
        </button>
      </div>

      {/* Tab Contents */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="fade-in">
        
        {/* TAB 1: KEHADIRAN */}
        {activeTab === 'attendance' && (
          <>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#1b4332', fontWeight: 600 }}>Statistik Kehadiran</h3>
                
                <select 
                  style={{ padding: '4px 6px', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 500 }}
                  value={`${selectedMonth}-${selectedYear}`}
                  onChange={(e) => {
                    const [m, y] = e.target.value.split('-').map(Number);
                    setSelectedMonth(m);
                    setSelectedYear(y);
                  }}
                >
                  {availableMonths.map((item, idx) => (
                    <option key={idx} value={`${item.month}-${item.year}`}>
                      {namaBulan[item.month]} {item.year}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '10px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2d6a4f' }}>{stats.persentase}%</div>
                  <div style={{ fontSize: '0.72rem', color: '#6c757d', fontWeight: 500 }}>Kehadiran Murni</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                    <span style={{ color: 'var(--color-hadir)', fontWeight: 600 }}>• Hadir:</span>
                    <span style={{ fontWeight: 600 }}>{stats.hadir} hari</span>
                  </div>
                  
                  <button 
                    onClick={() => openAbsenceDetail('Sakit')}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', width: '100%', textAlign: 'left' }}
                  >
                    <span style={{ color: 'var(--color-sakit)', fontWeight: 600, textDecoration: 'underline' }}>• Sakit:</span>
                    <span style={{ fontWeight: 600, textDecoration: 'underline' }}>{stats.sakit} hari</span>
                  </button>

                  <button 
                    onClick={() => openAbsenceDetail('Izin')}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', width: '100%', textAlign: 'left' }}
                  >
                    <span style={{ color: 'var(--color-izin)', fontWeight: 600, textDecoration: 'underline' }}>• Izin:</span>
                    <span style={{ fontWeight: 600, textDecoration: 'underline' }}>{stats.izin} hari</span>
                  </button>

                  <button 
                    onClick={() => openAbsenceDetail('Alpa')}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', width: '100%', textAlign: 'left' }}
                  >
                    <span style={{ color: 'var(--color-alpa)', fontWeight: 600, textDecoration: 'underline' }}>• Alpa:</span>
                    <span style={{ fontWeight: 600, textDecoration: 'underline' }}>{stats.alpa} hari</span>
                  </button>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', color: '#6c757d' }}>
                    <span>• Libur:</span>
                    <span>{stats.libur} hari</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '12px', fontWeight: 600 }}>Cari Kehadiran Siswa</h3>
              <div className="form-group" style={{ marginBottom: searchResult ? '12px' : '0' }}>
                <label className="form-label" htmlFor="search-date">Pilih Tanggal</label>
                <input 
                  type="date" 
                  id="search-date"
                  className="form-input" 
                  value={searchDate}
                  onChange={handleSearchDate}
                />
              </div>

              {searchResult && (
                <div style={{
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '10px',
                  borderLeft: `4px solid ${
                    searchResult.status === 'Hadir' ? 'var(--color-hadir)' :
                    searchResult.status === 'Sakit' ? 'var(--color-sakit)' :
                    searchResult.status === 'Izin' ? 'var(--color-izin)' :
                    searchResult.status === 'Alpa' ? 'var(--color-alpa)' : '#6c757d'
                  }`,
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {new Date(searchResult.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className={`badge-status badge-${searchResult.status.toLowerCase().replace(/\s+/g, '')}`}>
                      {searchResult.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#555', margin: 0 }}><strong>Info:</strong> {searchResult.keterangan}</p>
                </div>
              )}
            </Card>

            <Card>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '14px', fontWeight: 600 }}>Riwayat Bulan Ini</h3>
              {calendarDays.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Belum ada riwayat absensi tercatat.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {calendarDays
                    .filter(d => d.type === 'record' || d.type === 'holiday')
                    .map((day, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '10px 12px', 
                          background: day.type === 'holiday' ? 'rgba(0,0,0,0.02)' : 'white',
                          borderBottom: '1px solid rgba(0,0,0,0.04)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {new Date(day.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {day.keterangan && <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '2px' }}>{day.keterangan}</div>}
                        </div>
                        <span className={`badge-status ${
                          day.status === 'Hadir' ? 'badge-hadir' :
                          day.status === 'Sakit' ? 'badge-sakit' :
                          day.status === 'Izin' ? 'badge-izin' :
                          day.status === 'Alpa' ? 'badge-alpa' : 'badge-alpa'
                        }`} style={{ 
                          backgroundColor: day.status === 'Libur' ? '#e9ecef' : undefined,
                          color: day.status === 'Libur' ? '#495057' : undefined
                        }}>
                          {day.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* TAB 2: STEMPEL & PRESTASI (PENGELOMPOKAN STEMPEL & COUNTER) */}
        {activeTab === 'badges' && (
          <>
            <Card>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '12px', fontWeight: 600 }}>Koleksi Stempel Apresiasi</h3>
              {groupedBadges.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Belum ada stempel apresiasi yang diterima ananda.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '10px 0' }}>
                  {groupedBadges.map((item) => (
                    <div 
                      key={item.master.id} 
                      className="badge-emoji"
                      onClick={() => setSelectedBadgeGroup(item)}
                      title={item.master.nama_stempel}
                      style={{ position: 'relative', width: '54px', height: '54px', fontSize: '26px' }}
                    >
                      {item.master.simbol || '⭐'}
                      
                      {/* Counter Angka di Pojok Kanan Atas */}
                      {item.instances.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: 'linear-gradient(135deg, #d4af37, #b58d16)',
                          color: 'white',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          border: '1.5px solid white',
                          boxShadow: 'var(--shadow-sm)'
                        }}>
                          {item.instances.length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', marginTop: '6px' }}>
                *Ketuk stempel untuk membaca riwayat apresiasi & catatan guru.
              </p>
            </Card>

            <Card>
              <h3 style={{ fontSize: '1.05rem', color: '#1b4332', marginBottom: '14px', fontWeight: 600 }}>Papan Prestasi</h3>
              {achievements.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Belum ada catatan prestasi terdaftar untuk ananda.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {achievements.map((p) => (
                    <div key={p.id} style={{ borderLeft: '3px solid #d4af37', paddingLeft: '12px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</div>
                      <h4 style={{ margin: '2px 0 4px 0', color: '#1b4332', fontSize: '0.92rem', fontWeight: 600 }}>{p.judul_prestasi}</h4>
                      <p style={{ fontSize: '0.82rem', color: '#555', margin: 0 }}>{p.deskripsi}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Tab 3: Pengumuman & Komentar */}
        {activeTab === 'announcements' && (
          <>
            {announcements.length === 0 ? (
              <Card>
                <p style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                  Tidak ada pengumuman kelas saat ini.
                </p>
              </Card>
            ) : (
              announcements.map((a) => {
                const words = getWordCount(newComments[a.id] || '');
                const currentError = commentErrors[a.id];
                const isTooLong = words > 10;
                
                return (
                  <Card key={a.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#e8f5e9', color: '#2d6a4f', fontWeight: 600 }}>{a.kategori}</span>
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

                    {/* Sektor Komentar */}
                    <div className="comment-box">
                      <div className="comment-list">
                        {(comments[a.id] || []).length === 0 ? (
                          <span style={{ color: '#888', fontSize: '0.75rem', fontStyle: 'italic' }}>Belum ada tanggapan/komentar.</span>
                        ) : (
                          comments[a.id].map((c) => (
                            <div key={c.id} className="comment-item">
                              <div className="comment-author">{c.nama_user}</div>
                              <div style={{ color: '#333', marginTop: '2px' }}>{c.komentar}</div>
                              <span style={{ fontSize: '0.65rem', color: '#888' }}>
                                {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Teks Himbauan */}
                      <p style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: '6px', background: '#f8f9fa', padding: '6px', borderRadius: '4px' }}>
                        💡 <i>Tulis komentar dengan sopan (Maksimal 10 kata).</i>
                      </p>

                      {/* Input Komentar Baru */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          placeholder="Tanggapan Anda..."
                          value={newComments[a.id] || ''}
                          onChange={(e) => handleCommentChange(a.id, e.target.value)}
                          disabled={submittingComment[a.id]}
                        />
                        <button
                          onClick={() => handleSendComment(a.id)}
                          disabled={submittingComment[a.id] || isTooLong || !newComments[a.id]?.trim()}
                          style={{
                            background: '#2d6a4f',
                            border: 'none',
                            color: 'white',
                            padding: '0 14px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: (isTooLong || !newComments[a.id]?.trim()) ? 0.5 : 1
                          }}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                      
                      {/* Counter dan Error Kata */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {currentError ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} color="var(--color-alpa)" />
                            <span className="comment-limit-warning">{currentError}</span>
                          </div>
                        ) : (
                          <span className="comment-limit-ok">
                            {newComments[a.id]?.trim() ? `${words}/10 kata` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </>
        )}

        {/* Share & WA */}
        <Card style={{ marginTop: '10px', background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
          <h3 style={{ fontSize: '1rem', color: '#1b4332', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={18} /> Bagikan Laporan Siswa
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#2b2d42', marginBottom: '12px', lineHeight: 1.4 }}>
            Ingin membagikan perkembangan ananda ke keluarga dekat? Copy link di bawah ini. Penerima link tidak perlu login.
          </p>
          <Button 
            onClick={handleCopyLink} 
            variant={copySuccess ? 'accent' : 'primary'}
            style={{ padding: '10px 16px', fontSize: '0.85rem' }}
          >
            {copySuccess ? '✓ Link Laporan Publik Disalin!' : 'Copy Link Laporan Publik'}
          </Button>
        </Card>

        {studentData.kelas?.wa_wali && (
          <a 
            href={`https://wa.me/${studentData.kelas.wa_wali}?text=Assalamualaikum%20Ustadz/Ustadzah%2C%20saya%20wali%20dari%20${encodeURIComponent(studentData.nama_siswa)}...`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="wa-float"
          >
            <MessageCircle size={18} />
            Hubungi Wali Kelas via WhatsApp
          </a>
        )}
      </div>

      {/* MODAL 1: Detail Ketidakhadiran */}
      <Modal 
        isOpen={absenceDetailModal.isOpen} 
        onClose={() => setAbsenceDetailModal({ isOpen: false, status: '', list: [] })} 
        title={`Riwayat Ketidakhadiran: ${absenceDetailModal.status}`}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {absenceDetailModal.list.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '10px' }}>
              Tidak ada catatan untuk bulan ini.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {absenceDetailModal.list.map((day, idx) => (
                <div key={idx} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', borderLeft: `4px solid ${
                  absenceDetailModal.status === 'Sakit' ? 'var(--color-sakit)' :
                  absenceDetailModal.status === 'Izin' ? 'var(--color-izin)' : 'var(--color-alpa)'
                }` }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1b4332', marginBottom: '4px' }}>
                    {new Date(day.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#555' }}>
                    <strong>Keterangan:</strong> {day.keterangan || 'Tidak ada keterangan tambahan.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: Detail Stempel Terkelompok dengan Timeline Riwayat */}
      <Modal 
        isOpen={!!selectedBadgeGroup} 
        onClose={() => setSelectedBadgeGroup(null)} 
        title="Detail Stempel Apresiasi"
      >
        {selectedBadgeGroup && (
          <div style={{ padding: '10px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {selectedBadgeGroup.master.gambar_url ? (
                <img 
                  src={selectedBadgeGroup.master.gambar_url} 
                  alt={selectedBadgeGroup.master.nama_stempel} 
                  style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '12px', borderRadius: '50%' }}
                />
              ) : (
                <div style={{ fontSize: '4.5rem', marginBottom: '12px' }}>
                  {selectedBadgeGroup.master.simbol || '⭐'}
                </div>
              )}
              <h4 style={{ fontSize: '1.25rem', color: '#1b4332', fontWeight: 700, marginBottom: '6px' }}>
                {selectedBadgeGroup.master.nama_stempel}
              </h4>
              <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fcf6bd', color: '#b58d16', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                Grup: {selectedBadgeGroup.master.grup_stempel}
              </span>
              <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '12px', lineHeight: 1.5, background: '#f4f7f6', padding: '12px', borderRadius: '10px' }}>
                {selectedBadgeGroup.master.deskripsi}
              </p>
            </div>

            {/* Riwayat Kapan Saja Didapatkan */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '16px' }}>
              <h5 style={{ color: '#1b4332', fontSize: '0.92rem', fontWeight: 600, marginBottom: '10px' }}>
                Riwayat Penerimaan (Total: {selectedBadgeGroup.instances.length} Kali)
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                {selectedBadgeGroup.instances.map((instance, idx) => (
                  <div key={idx} style={{ background: '#fcfcfc', border: '1px solid rgba(0,0,0,0.04)', padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <div style={{ color: '#888', fontWeight: 500, marginBottom: '2px' }}>
                      {new Date(instance.tanggal_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p style={{ margin: 0, color: '#333' }}>
                      {instance.catatan ? `"${instance.catatan}"` : <i>"Diberikan stempel tanpa catatan tambahan."</i>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
