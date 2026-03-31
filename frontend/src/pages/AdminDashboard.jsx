import { useState, useEffect } from 'react';
import { Play, Calculator, Users, Download, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');

  const loadData = async () => {
    try {
      const statsRes = await api.get('/admin/get_dashboard_data');
      setStats(statsRes.data);
      const logsRes = await api.get('/admin/logs');
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (endpoint, successMsg) => {
    setLoading(true);
    setNotification('');
    try {
      const res = await api.post(`/admin/${endpoint}`);
      setNotification(`${successMsg}: ${JSON.stringify(res.data)}`);
      loadData();
    } catch(err) {
      setNotification(`Hata: ${err.response?.data?.error || 'Sistem hatası'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'atama_sonuclari.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Yönetici Paneli</h2>
          <p className="text-muted">Tüm atama süreçlerini ve kontenjanları yönetin.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleExport} className="btn btn-outline" disabled={loading}>
            <Download size={18} /> Excel (CSV) İndir
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '1rem', background: 'rgba(2, 119, 189, 0.2)', color: '#4fc3f7', border: '1px solid rgba(2, 119, 189, 0.6)', borderRadius: '8px', marginBottom: '2rem' }}>
          {notification}
        </div>
      )}

      {stats && (
        <div className="grid-cards mb-4">
          <div className="glass-panel text-center">
            <h3 className="text-secondary mb-1">Toplam Öğrenci</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f5f5f5' }}>{stats.studentCount}</div>
          </div>
          <div className="glass-panel text-center">
            <h3 className="text-secondary mb-1">Atanan Öğrenci</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#81c784' }}>{stats.assignedStudentCount}</div>
            <p className="text-muted mt-1">%{Math.round((stats.assignedStudentCount / stats.studentCount) * 100) || 0} Tamamlandı</p>
          </div>
          <div className="glass-panel text-center">
            <h3 className="text-secondary mb-1">Toplam Danışman</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ffb74d' }}>{stats.facultyCount}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
        <div className="glass-panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <AlertTriangle size={20} className="text-accent" /> Operasyonlar
          </h3>
          <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
            Aşağıdaki işlemler atama durumunu kalıcı olarak etkiler. Lütfen sırayla ve dikkatli kullanın.
          </p>
          
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', marginBottom: '1rem', justifyContent: 'flex-start' }}
            onClick={() => handleAction('calculate-quotas', 'Kontenjanlar Hesaplandı')}
            disabled={loading}
          >
            <Calculator size={18} className="text-accent" /> 1. Kontenjanları Hesapla
          </button>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => handleAction('run-assignment', 'Gale-Shapley Ataması Tamamlandı')}
            disabled={loading}
          >
            <Play size={18} /> 2. Merkezi Atamayı Çalıştır (ÖSYM)
          </button>
        </div>

        <div className="glass-panel">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Sistem Logları (Son İşlemler)</h3>
          {logs.length === 0 ? (
            <p className="text-muted">Kayıtlı log bulunmuyor.</p>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Eylem</th>
                    <th>Öğrenci</th>
                    <th>Hoca</th>
                    <th>Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 15).map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: '#b0bec5' }}>{new Date(log.timestamp).toLocaleString('tr-TR')}</td>
                      <td>
                        <span className={`badge ${log.action.includes('ASSIGN') ? 'badge-success' : 'badge-info'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.student_name || '-'}</td>
                      <td>{log.faculty_name || '-'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#b0bec5' }}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
