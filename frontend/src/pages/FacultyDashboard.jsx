import { useState, useEffect } from 'react';
import { Search, Send, Users, Activity } from 'lucide-react';
import api from '../api';

export default function FacultyDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [searchGano, setSearchGano] = useState('3.0');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadProfileInfo = async () => {
    try {
      const profRes = await api.get('/faculty/me');
      setProfile(profRes.data);
      
      const assignedRes = await api.get('/faculty/assigned');
      setAssigned(assignedRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/faculty/students?minGano=${searchGano}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileInfo();
    handleSearch();
  }, []);

  const sendInvite = async (studentId, studentName) => {
    try {
      await api.post('/faculty/invite', { student_id: studentId });
      setMessage({ text: `${studentName} adlı öğrenciye davet gönderildi.`, type: 'success' });
      // Remove from list
      setStudents(students.filter(s => s.id !== studentId));
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Davet gönderilemedi.', type: 'error' });
    }
    
    setTimeout(() => setMessage({text:'', type:''}), 4000);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Hoş Geldiniz, {user.full_name}</h2>
          <p className="text-muted">{profile?.department_name} | İlgi Alanları: {profile?.expertise_keywords}</p>
        </div>
      </div>

      {message.text && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '2rem',
          borderRadius: '8px',
          background: message.type === 'success' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(211, 47, 47, 0.2)',
          color: message.type === 'success' ? '#81c784' : '#ff5252',
          border: `1px solid ${message.type === 'success' ? 'rgba(46,125,50,0.5)' : 'rgba(211,47,47,0.5)'}`
        }}>
          {message.text}
        </div>
      )}

      <div className="grid-cards mb-4">
        <div className="glass-panel text-center">
          <h3 className="text-secondary mb-1">Mevcut Kontenjan</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f5f5f5' }}>
            {profile?.current_quota || 0} / {profile?.base_quota || '?'}
          </div>
          <p className="text-muted mt-1">Kesinleşen Öğrenci Sayısı</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Atanmis Ogrenciler */}
        <div className="glass-panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <Users size={20} className="text-accent" /> Danışmanlığını Aldığınız Öğrenciler
          </h3>
          
          {assigned.length === 0 ? (
            <p className="text-muted" style={{ padding: '2rem 0', textAlign: 'center' }}>Henüz atanmış bir öğrenciniz bulunmuyor.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {assigned.map((s) => (
                <li key={s.id} style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 500 }}>{s.full_name}</h4>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>{s.email} | {s.department_name}</p>
                  </div>
                  <div className="badge badge-success">GANO: {s.gano}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ogrenci Arama (Pre-Selection) */}
        <div className="glass-panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <Search size={20} className="text-accent" /> Öğrenci Ara (Ön Teklif)
          </h3>
          <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
            Merkezi atama öncesi yüksek not ortalamasına sahip öğrencilere "Danışmanlık Teklifi" gönderebilirsiniz. 
            Teklif kabul edilirse kontenjanınızdan otomatik düşülür.
          </p>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <input 
              type="number" 
              step="0.01" 
              className="glass-input" 
              placeholder="Minimum GANO (Örn: 3.5)" 
              value={searchGano} 
              onChange={e => setSearchGano(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-outline" disabled={loading}>Filtrele</button>
          </form>

          {students.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '1rem' }}>Eşleşen atanmamış öğrenci bulunamadı.</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {students.map(s => (
                <div key={s.id} style={{ 
                  background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', 
                  marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{s.full_name}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#ffb74d', fontWeight: 'bold' }}>GANO: {s.gano}</span>
                    <span className="text-muted" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>| Giriş: {s.entry_year}</span>
                  </div>
                  <button 
                    onClick={() => sendInvite(s.id, s.full_name)} 
                    className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    <Send size={14} /> Teklif Gönder
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
