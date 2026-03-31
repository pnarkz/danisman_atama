import { useState, useEffect } from 'react';
import { Mail, Check, X, ArrowUp, ArrowDown, MoveRight, Save, Info } from 'lucide-react';
import api from '../api';

export default function StudentDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadData = async () => {
    try {
      const profRes = await api.get('/students/me');
      setProfile(profRes.data);
      
      const invRes = await api.get('/students/invitations');
      setInvitations(invRes.data);
      
      const facRes = await api.get('/students/faculty-list');
      setFacultyList(facRes.data);
      
      // If student is already assigned, fetch assigned professor... 
      // but it's part of profile (assigned_faculty_name)
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async (invId, status) => {
    if (!window.confirm(`Bu danışmanlık teklifini ${status === 'accepted' ? 'KABUL EDUYOR' : 'REDDEDİYOR'} sunuz. Emin misiniz?`)) return;
    
    try {
      await api.post(`/students/invitations/${invId}/respond`, { status });
      setMessage({ text: 'İşlem başarıyla gerçekleştirildi.', type: 'success' });
      loadData();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Bir hata oluştu.', type: 'error' });
    }
  };

  const addToPrefs = (faculty) => {
    if (preferences.find(p => p.id === faculty.id)) return;
    setPreferences([...preferences, faculty]);
  };

  const removeFromPrefs = (facultyId) => {
    setPreferences(preferences.filter(p => p.id !== facultyId));
  };

  const moveItem = (index, dir) => {
    const newPrefs = [...preferences];
    if (dir === 'up' && index > 0) {
      const temp = newPrefs[index - 1];
      newPrefs[index - 1] = newPrefs[index];
      newPrefs[index] = temp;
    } else if (dir === 'down' && index < newPrefs.length - 1) {
      const temp = newPrefs[index + 1];
      newPrefs[index + 1] = newPrefs[index];
      newPrefs[index] = temp;
    }
    setPreferences(newPrefs);
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const prefIds = preferences.map(p => p.id);
      await api.post('/students/preferences', { preferences: prefIds });
      setMessage({ text: 'Tercih listeniz başarıyla sisteme kaydedildi.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Kaydetme başarısız.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = profile?.is_assigned === 1;

  if (isAssigned) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <div className="glass-panel text-center">
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(46, 125, 50, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid #81c784'
          }}>
            <Check size={40} color="#81c784" />
          </div>
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>Tebrikler, Danışmanınız Atandı!</h2>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px', display: 'inline-block', minWidth: '300px' }}>
            <p className="text-secondary" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>DANIŞMAN</p>
            <h3 style={{ fontSize: '1.8rem', color: '#ffb74d', margin: 0 }}>{profile?.assigned_faculty_name}</h3>
            <p className="text-muted mt-2">{profile?.department_name}</p>
          </div>
          <p className="text-muted mt-4">
            Merkezi sistem veya ön eşleşme yoluyla danışmanınız kesinleşmiştir. Projenizde başarılar dileriz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Öğrenci Paneli</h2>
          <p className="text-muted">{profile?.department_name} | GANO: <strong style={{ color: '#ffb74d' }}>{profile?.gano}</strong></p>
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

      {/* Invitations Alert */}
      {invitations.filter(i => i.status === 'pending').map(inv => (
        <div key={inv.id} className="glass-panel mb-4" style={{ border: '1px solid rgba(255,183,77,0.4)', background: 'linear-gradient(45deg, rgba(26,30,41,0.9), rgba(62,39,35,0.9))' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,183,77,0.2)', padding: '1rem', borderRadius: '50%' }}>
              <Mail size={32} color="#ffb74d" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#f5f5f5', marginBottom: '0.2rem' }}>Öncelikli Danışmanlık Teklifi</h3>
              <p className="text-muted mb-2"><strong>{inv.faculty_name}</strong> adlı hoca sizinle çalışmak için davet gönderdi.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleInvite(inv.id, 'accepted')} className="btn" style={{ background: '#2e7d32', color: 'white' }}><Check size={16} /> Kabul Et (Kesin Kayıt)</button>
                <button onClick={() => handleInvite(inv.id, 'rejected')} className="btn" style={{ background: 'rgba(211,47,47,0.3)', color: '#ff5252', border: '1px solid #d32f2f' }}><X size={16} /> Reddet</button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="glass-panel mb-4" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(2, 119, 189, 0.1)', border: '1px solid rgba(2, 119, 189, 0.3)' }}>
        <Info size={24} color="#4fc3f7" />
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Danışman tercihlerinizi aşağıdan oluşturunuz. Havuzdaki hocaları sağdaki listeye ekleyin ve ok tuşlarıyla sıralamayı (1 En Yüksek) ayarlayın.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Hoca Havuzu */}
        <div className="glass-panel">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>Danışman Havuzu</h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {facultyList.filter(f => !preferences.find(p => p.id === f.id)).map(faculty => (
              <div key={faculty.id} style={{ 
                background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.05)', transition: '0.2s'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 500 }}>{faculty.full_name}</h4>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{faculty.expertise_keywords}</p>
                </div>
                <button onClick={() => addToPrefs(faculty)} className="btn btn-outline" style={{ padding: '0.5rem', color: '#81c784', borderColor: 'rgba(129,199,132,0.3)' }} title="Tercihlere Ekle">
                  <MoveRight size={18} />
                </button>
              </div>
            ))}
            {facultyList.length === 0 && <p className="text-muted text-center py-4">Havuzda hoca bulunamadı.</p>}
          </div>
        </div>

        {/* Tercih Listesi */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Tercih Listem</h3>
            <button onClick={savePreferences} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={loading || preferences.length === 0}>
              <Save size={16} /> Kaydet
            </button>
          </div>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {preferences.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.3)' }}>
                <p>Listeye hoca eklemek için soldaki paneli kullanın.</p>
              </div>
            ) : (
              preferences.map((pref, idx) => (
                <div key={pref.id} style={{ 
                  background: 'linear-gradient(90deg, rgba(26,35,126,0.3), rgba(0,0,0,0.2))', padding: '0.75rem 1rem', borderRadius: '8px', 
                  display: 'flex', gap: '1rem', alignItems: 'center', borderLeft: '3px solid #1a237e'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#78909c', width: '24px' }}>{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{pref.full_name}</h4>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="btn" style={{ padding: '0.25rem', background: 'transparent', color: idx === 0 ? '#455a64' : '#b0bec5' }}>
                      <ArrowUp size={18} />
                    </button>
                    <button onClick={() => moveItem(idx, 'down')} disabled={idx === preferences.length - 1} className="btn" style={{ padding: '0.25rem', background: 'transparent', color: idx === preferences.length - 1 ? '#455a64' : '#b0bec5' }}>
                      <ArrowDown size={18} />
                    </button>
                    <button onClick={() => removeFromPrefs(pref.id)} className="btn" style={{ padding: '0.25rem', background: 'transparent', color: '#ff5252', marginLeft: '0.5rem' }}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
