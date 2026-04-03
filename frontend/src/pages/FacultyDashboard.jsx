import { useEffect, useState } from 'react';
import { Search, Send } from 'lucide-react';
import api from '../api';
import PasswordPanel from '../components/PasswordPanel';

export default function FacultyDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [searchGano, setSearchGano] = useState('3.0');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const loadProfileInfo = async () => {
    try {
      const [profileResponse, assignedResponse] = await Promise.all([
        api.get('/faculty/me'),
        api.get('/faculty/assigned'),
      ]);

      setProfile(profileResponse.data);
      setAssigned(assignedResponse.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadProfileInfo();

    const loadStudentsForCurrentFilter = async () => {
      try {
        const response = await api.get(`/faculty/students?minGano=${searchGano}`);
        setStudents(response.data);
      } catch {
        setStudents([]);
      }
    };

    loadStudentsForCurrentFilter();
  }, [searchGano]);

  const handleSearch = async (event) => {
    event?.preventDefault();
    setLoading(true);

    try {
      const response = await api.get(`/faculty/students?minGano=${searchGano}`);
      setStudents(response.data);
    } catch (error) {
      setStudents([]);
      setNotice({ type: 'error', text: error.response?.data?.error || 'Ogrenci listesi alinamadi.' });
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (studentId, studentName) => {
    try {
      await api.post('/faculty/invite', { student_id: studentId });
      setNotice({ type: 'success', text: `${studentName} icin dogrudan teklif gonderildi.` });
      setStudents((current) => current.filter((student) => student.id !== studentId));
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.error || 'Teklif gonderilemedi.' });
    }
  };

  return (
    <div className="stack-layout animate-fade-in">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Danisman Modulu</p>
          <h1>{user?.full_name}</h1>
          <p className="muted-copy">
            {profile?.department_name} bolumunde kayitli danisman profili. Dogrudan teklif sureci,
            aktiflik durumu ve mevcut kontenjan bu panelden takip edilir.
          </p>
        </div>

        <div className="meta-grid">
          <article className="stat-card">
            <span>Kontenjan</span>
            <strong>{profile?.current_quota || 0} / {profile?.base_quota || '?'}</strong>
          </article>
          <article className="stat-card">
            <span>Durum</span>
            <strong>{profile?.is_active === 1 ? 'Aktif' : 'Pasif'}</strong>
          </article>
          <article className="stat-card">
            <span>Ilgi alani</span>
            <strong>{profile?.expertise_keywords || '-'}</strong>
          </article>
        </div>
      </section>

      {notice.text && <div className={`notice notice-${notice.type}`}>{notice.text}</div>}

      {profile?.is_active !== 1 && (
        <div className="notice notice-info">
          Danisman kaydiniz pasif durumda. Yeni teklif gonderemezsiniz; mevcut ogrenci listeniz goruntulenmeye devam eder.
        </div>
      )}

      <div className="duo-grid align-start">
        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Kayitli Ogrenciler</p>
              <h2>Danismanliginiz altindaki ogrenciler</h2>
            </div>
          </div>

          {assigned.length === 0 ? (
            <p className="empty-state">Henuz atanmis bir ogrenciniz bulunmuyor.</p>
          ) : (
            <div className="card-list">
              {assigned.map((student) => (
                <article key={student.id} className="list-card">
                  <div>
                    <h3>{student.full_name}</h3>
                    <p>{student.email}</p>
                    <span>{student.department_name}</span>
                  </div>
                  <div className="compact-metric">
                    <span>GANO</span>
                    <strong>{student.gano}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Dogrudan Teklif</p>
              <h2>Uygun ogrencileri filtreleyin</h2>
            </div>
          </div>

          <p className="muted-copy">
            Yalnizca aktif ve atanmamis ogrenciler listelenir. Teklif kabul edilirse ogrencinin danisman kaydi dogrudan kesinlesir.
          </p>

          <form onSubmit={handleSearch} className="inline-form">
            <label className="field-block field-inline">
              <span>Minimum GANO</span>
              <input
                type="number"
                step="0.01"
                className="app-input"
                value={searchGano}
                onChange={(event) => setSearchGano(event.target.value)}
                disabled={profile?.is_active !== 1}
              />
            </label>

            <button type="submit" className="btn btn-outline" disabled={loading || profile?.is_active !== 1}>
              <Search size={16} />
              Filtrele
            </button>
          </form>

          {students.length === 0 ? (
            <p className="empty-state">Kosullara uyan atanmamis ogrenci bulunmuyor.</p>
          ) : (
            <div className="card-list">
              {students.map((student) => (
                <article key={student.id} className="list-card">
                  <div>
                    <h3>{student.full_name}</h3>
                    <p>{student.department_name}</p>
                    <span>GANO: {student.gano} | Giris yili: {student.entry_year}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={profile?.is_active !== 1}
                    onClick={() => sendInvite(student.id, student.full_name)}
                  >
                    <Send size={16} />
                    Teklif gonder
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <PasswordPanel />
    </div>
  );
}
