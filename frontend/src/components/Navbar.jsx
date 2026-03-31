import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav style={{ 
      background: 'rgba(26, 35, 126, 0.4)', 
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
           onClick={() => navigate('/')}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(45deg, #c62828, #ff5f52)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
        }}>
          AÜ
        </div>
        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>Danışman Atama Sistemi</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b0bec5' }}>
          <User size={18} />
          <span>{user?.full_name} ({user?.role})</span>
        </div>
        
        <button onClick={onLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Çıkış
        </button>
      </div>
    </nav>
  );
}
