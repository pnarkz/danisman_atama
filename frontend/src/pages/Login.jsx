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
      setError(requestError.response?.data?.error || 'Oturum acilamadi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-grid animate-fade-in">
      <section className="login-brand">
        <p className="eyebrow">Kurumsal Erisim</p>
        <h1>Danismanlik atama surecini tek merkezden yonetin.</h1>
        <p className="muted-copy">
          Ogrenci tercihleri, danisman teklifleri, kontenjan kararlarI ve merkezi yerlestirme
          adimlari ayni operasyon akisi icinde izlenir.
        </p>

        <div className="feature-stack">
          <article className="feature-card">
            <ShieldCheck size={18} />
            <div>
              <strong>Yetkilendirme</strong>
              <p className="muted-copy">Oturumlar rol bazli dogrulama ile korunur.</p>
            </div>
          </article>
          <article className="feature-card">
            <ArrowRight size={18} />
            <div>
              <strong>Merkezi Akis</strong>
              <p className="muted-copy">Otomatik siralama asamasinda tek kriter GANO'dur.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="panel login-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Giris</p>
            <h2>Sisteme erisin</h2>
          </div>
        </div>

        <p className="muted-copy">
          Kurumsal e-posta adresiniz ve sifreniz ile oturum acin.
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
                placeholder="ornek@ankara.edu.tr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </label>

          <label className="field-block">
            <span>Sifre</span>
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
            {loading ? 'Oturum aciliyor' : 'Devam et'}
          </button>
        </form>

        <div className="demo-box">
          <p><strong>Demo hesaplari</strong></p>
          <p>Admin: admin@ankara.edu.tr / admin123</p>
          <p>Danisman: ahmet.yilmaz@ankara.edu.tr / hoca123</p>
          <p>Ogrenci: ogrenci01@ankara.edu.tr / ogrenci123</p>
        </div>
      </section>
    </div>
  );
}
