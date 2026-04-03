import { useEffect, useMemo, useState } from 'react';
import { Calculator, Download, Play, RefreshCcw, ShieldCheck, Trash2, UserCog, Users } from 'lucide-react';
import api from '../api';
import PasswordPanel from '../components/PasswordPanel';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const loadData = async () => {
    try {
      const [
        statsResponse,
        logsResponse,
        usersResponse,
        facultyResponse,
        resultsResponse,
      ] = await Promise.all([
        api.get('/admin/get_dashboard_data'),
        api.get('/admin/logs'),
        api.get('/admin/users'),
        api.get('/admin/faculty-overview'),
        api.get('/admin/results'),
      ]);

      setStats(statsResponse.data);
      setLogs(logsResponse.data);
      setUsers(usersResponse.data);
      setFacultyList(facultyResponse.data);
      setResults(resultsResponse.data);
    } catch {
      setNotice({ type: 'error', text: 'Yonetici verileri yuklenemedi.' });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeFaculty = useMemo(
    () => facultyList.filter((faculty) => faculty.is_active === 1),
    [facultyList],
  );

  const assignedStudents = useMemo(
    () => users.filter((item) => item.role === 'ogrenci' && item.assigned_faculty_name),
    [users],
  );

  const unassignedStudents = useMemo(
    () => users.filter((item) => item.role === 'ogrenci' && !item.assigned_faculty_name),
    [users],
  );

  const handleAction = async (endpoint, successText) => {
    setLoading(true);
    setNotice({ type: '', text: '' });

    try {
      const response = await api.post(`/admin/${endpoint}`);
      setNotice({ type: 'success', text: `${successText}. ${response.data.message || ''}`.trim() });
      await loadData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.error || 'Islem tamamlanamadi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'atama-sonuclari.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setNotice({ type: 'error', text: 'CSV disa aktarma islemi basarisiz oldu.' });
    }
  };

  const handleFacultyStatus = async (facultyId, nextStatus) => {
    try {
      const response = await api.patch(`/admin/faculty/${facultyId}/status`, { is_active: nextStatus });
      setNotice({ type: 'success', text: response.data.message });
      await loadData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.error || 'Danisman durumu guncellenemedi.' });
    }
  };

  const handleDeleteUser = async (userId, fullName) => {
    const confirmed = window.confirm(`${fullName} kaydini sistemden kaldirmak istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await api.delete(`/admin/users/${userId}`);
      setNotice({ type: 'success', text: response.data.message });
      await loadData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.error || 'Kullanici silinemedi.' });
    }
  };

  const handleForceAssign = async (event) => {
    event.preventDefault();

    if (!selectedStudentId || !selectedFacultyId) {
      setNotice({ type: 'error', text: 'Manuel atama icin ogrenci ve danisman secin.' });
      return;
    }

    try {
      const response = await api.post('/admin/force-assign', {
        student_id: Number(selectedStudentId),
        faculty_id: Number(selectedFacultyId),
      });
      setNotice({ type: 'success', text: response.data.message });
      await loadData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.error || 'Manuel atama tamamlanamadi.' });
    }
  };

  return (
    <div className="stack-layout animate-fade-in">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Yonetici Modulu</p>
          <h1>Yerlestirme ve kullanici yonetimi</h1>
          <p className="muted-copy">
            Bu panel; kontenjan hesaplama, GANO merkezli merkezi yerlestirme, kullanici yasam dongusu
            ve donem ici danisman degisikligi islemleri icin kullanilir.
          </p>
        </div>

        <div className="action-row">
          <button type="button" className="btn btn-outline" onClick={handleExport}>
            <Download size={16} />
            Sonuclari indir
          </button>
          <button type="button" className="btn btn-outline" onClick={loadData}>
            <RefreshCcw size={16} />
            Verileri yenile
          </button>
        </div>
      </section>

      {notice.text && <div className={`notice notice-${notice.type}`}>{notice.text}</div>}

      {stats && (
        <section className="stat-grid">
          <article className="stat-card">
            <span>Toplam ogrenci</span>
            <strong>{stats.studentCount}</strong>
          </article>
          <article className="stat-card">
            <span>Atanan ogrenci</span>
            <strong>{stats.assignedStudentCount}</strong>
          </article>
          <article className="stat-card">
            <span>Aktif danisman</span>
            <strong>{activeFaculty.length}</strong>
          </article>
          <article className="stat-card">
            <span>Bekleyen ogrenci</span>
            <strong>{unassignedStudents.length}</strong>
          </article>
        </section>
      )}

      <div className="duo-grid align-start">
        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Operasyonlar</p>
              <h2>Yerlestirme akisi</h2>
            </div>
            <span className="icon-chip">
              <ShieldCheck size={18} />
            </span>
          </div>

          <p className="muted-copy">
            Kontenjan hesabi aktif danismanlara dengeli dagitilir. Merkezi yerlestirme, sistemde
            atanmamis tum ogrencileri yalnizca GANO sirasina gore isler.
          </p>

          <div className="action-stack">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleAction('calculate-quotas', 'Kontenjanlar guncellendi')}
              disabled={loading}
            >
              <Calculator size={16} />
              Kontenjanlari hesapla
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleAction('run-assignment', 'Merkezi yerlestirme tamamlandi')}
              disabled={loading}
            >
              <Play size={16} />
              Merkezi yerlestirmeyi calistir
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Manuel Danisman Degisikligi</p>
              <h2>Ogrenci yeniden ata</h2>
            </div>
            <span className="icon-chip">
              <UserCog size={18} />
            </span>
          </div>

          <form className="stack-form" onSubmit={handleForceAssign}>
            <label className="field-block">
              <span>Ogrenci</span>
              <select
                className="app-input"
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                required
              >
                <option value="">Ogrenci secin</option>
                {results.map((result) => (
                  <option key={result.student_id} value={result.student_id}>
                    {result.student_name} · {result.gano} · {result.faculty_name || 'Atanmadi'}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-block">
              <span>Danisman</span>
              <select
                className="app-input"
                value={selectedFacultyId}
                onChange={(event) => setSelectedFacultyId(event.target.value)}
                required
              >
                <option value="">Danisman secin</option>
                {activeFaculty.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.full_name} · {faculty.current_quota}/{faculty.base_quota}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="btn btn-primary">
              Atamayi guncelle
            </button>
          </form>
        </section>
      </div>

      <div className="duo-grid align-start">
        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Danisman Yonetimi</p>
              <h2>Aktif ve pasif durumlar</h2>
            </div>
            <span className="icon-chip">
              <Users size={18} />
            </span>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Danisman</th>
                  <th>Bolum</th>
                  <th>Kontenjan</th>
                  <th>Durum</th>
                  <th>Islem</th>
                </tr>
              </thead>
              <tbody>
                {facultyList.map((faculty) => (
                  <tr key={faculty.id}>
                    <td>
                      <strong>{faculty.full_name}</strong>
                      <span>{faculty.email}</span>
                    </td>
                    <td>{faculty.department_name}</td>
                    <td>{faculty.current_quota}/{faculty.base_quota}</td>
                    <td>
                      <span className={`pill ${faculty.is_active === 1 ? 'pill-success' : 'pill-warning'}`}>
                        {faculty.is_active === 1 ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-small"
                        onClick={() => handleFacultyStatus(faculty.id, faculty.is_active !== 1)}
                      >
                        {faculty.is_active === 1 ? 'Pasife al' : 'Aktif et'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Kullanici Dizini</p>
              <h2>Silme ve denetim</h2>
            </div>
            <span className="icon-chip">
              <Trash2 size={18} />
            </span>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Rol</th>
                  <th>Detay</th>
                  <th>Islem</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.full_name}</strong>
                      <span>{item.email}</span>
                    </td>
                    <td>{item.role}</td>
                    <td>
                      {item.role === 'ogrenci'
                        ? `${item.department_name || '-'} · ${item.gano || '-'}`
                        : item.role === 'hoca'
                          ? `${item.department_name || '-'} · ${item.is_active === 1 ? 'Aktif' : 'Pasif'}`
                          : 'Yonetici hesabi'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-danger btn-small"
                        onClick={() => handleDeleteUser(item.id, item.full_name)}
                      >
                        Kaldir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="duo-grid align-start">
        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Yerlestirme Ozeti</p>
              <h2>Ogrenci dagilimi</h2>
            </div>
            <span className="icon-chip">
              <Users size={18} />
            </span>
          </div>

          <div className="detail-stack">
            <div className="detail-row">
              <span>Atanmis ogrenci</span>
              <strong>{assignedStudents.length}</strong>
            </div>
            <div className="detail-row">
              <span>Atama bekleyen ogrenci</span>
              <strong>{unassignedStudents.length}</strong>
            </div>
            <div className="detail-row">
              <span>Toplam log kaydi</span>
              <strong>{logs.length}</strong>
            </div>
          </div>
        </section>

        <PasswordPanel />
      </div>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Islem Gunlugu</p>
            <h2>Son hareketler</h2>
          </div>
          <span className="icon-chip">
            <RefreshCcw size={18} />
          </span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Eylem</th>
                <th>Ogrenci</th>
                <th>Danisman</th>
                <th>Detay</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString('tr-TR')}</td>
                  <td>{log.action}</td>
                  <td>{log.student_name || '-'}</td>
                  <td>{log.faculty_name || '-'}</td>
                  <td>{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
