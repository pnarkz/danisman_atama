import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserRound, Lock } from 'lucide-react';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      if (onLogin) onLogin(res.data.user);
      
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'hoca') navigate('/faculty');
      else navigate('/student');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(45deg, #1a237e, #c62828)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', margin: '0 auto 1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}>
            AÜ
          </div>
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Ankara Üniversitesi</h2>
          <p className="text-muted">Danışman Atama Sistemi (DAS)</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(211, 47, 47, 0.2)', color: '#ff5252', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(211,47,47,0.4)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#b0bec5', fontSize: '0.9rem' }}>E-posta Adresi</label>
            <div style={{ position: 'relative' }}>
              <UserRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#78909c' }} />
              <input 
                type="email" 
                className="glass-input" 
                style={{ paddingLeft: '2.5rem' }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@ankara.edu.tr"
                required 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#b0bec5', fontSize: '0.9rem' }}>Şifre</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#78909c' }} />
              <input 
                type="password" 
                className="glass-input" 
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-2" disabled={loading} style={{ width: '100%', padding: '1rem' }}>
            {loading ? 'Giriş Yapılıyor...' : <><LogIn size={20} /> Giriş Yap</>}
          </button>
        </form>
        
        <p className="text-muted text-center mt-4" style={{ fontSize: '0.85rem' }}>
          Demo Hesapları:<br/>
          Admin: admin@ankara.edu.tr | Sifre: admin123<br/>
          Hoca: ahmet.yilmaz@ankara.edu.tr | Sifre: hoca123<br/>
          Ogrenci: ogrenci01@ankara.edu.tr | Sifre: ogrenci123
        </p>
      </div>
    </div>
  );
}
