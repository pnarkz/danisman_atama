import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, ShieldCheck, UserRound } from 'lucide-react';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (onLogin) {
        onLogin(response.data.user);
      }

      if (response.data.user.role === 'admin') navigate('/admin');
      else if (response.data.user.role === 'hoca') navigate('/faculty');
      else navigate('/student');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Oturum açılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-grid animate-fade-in">
      <section className="login-brand">
        <p className="eyebrow">Kurumsal Erişim</p>
        <h1>Danışmanlık atama sürecini tek merkezden yönetin.</h1>
        <p className="muted-copy">
          Öğrenci tercihleri, danışman teklifleri, kontenjan kararları ve merkezi yerleştirme
          adımları aynı operasyon akışı içinde izlenir.
        </p>

        <div className="feature-stack">
          <article className="feature-card">
            <ShieldCheck size={18} />
            <div>
              <strong>Yetkilendirme</strong>
              <p className="muted-copy">Oturumlar rol bazlı doğrulama ile korunur.</p>
            </div>
          </article>
          <article className="feature-card">
            <ArrowRight size={18} />
            <div>
              <strong>Merkezi Akış</strong>
              <p className="muted-copy">Otomatik sıralama aşamasında tek kriter GANO'dur.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="panel login-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Giriş</p>
            <h2>Sisteme erişin</h2>
          </div>
        </div>

        <p className="muted-copy">
          Kurumsal e-posta adresiniz ve şifreniz ile oturum açın.
        </p>

        {error && <div className="notice notice-error">{error}</div>}

        <form className="stack-form" onSubmit={handleLogin}>
          <label className="field-block">
            <span>E-posta adresi</span>
            <div className="field-with-icon">
              <UserRound size={16} />
              <input
                type="email"
                className="app-input"
                placeholder="örnek@ankara.edu.tr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </label>

          <label className="field-block">
            <span>Şifre</span>
            <div className="field-with-icon">
              <Lock size={16} />
              <input
                type="password"
                className="app-input"
                placeholder="En az 8 karakter"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </label>

          <button type="submit" className="btn btn-primary btn-wide" disabled={loading}>
            <ArrowRight size={16} />
            {loading ? 'Oturum açılıyor' : 'Devam et'}
          </button>
        </form>

        <div className="demo-box">
          <p><strong>Demo hesapları</strong></p>
          <p>Admin: admin@ankara.edu.tr / admin123</p>
          <p>Danışman: ahmet.yilmaz@ankara.edu.tr / hoca123</p>
          <p>Öğrenci: ogrenci01@ankara.edu.tr / ogrenci123</p>
        </div>
      </section>
    </div>
  );
}
