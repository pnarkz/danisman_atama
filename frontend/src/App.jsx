import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import api from './api';

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" />;
  }
  
  const user = JSON.parse(userStr);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      
      // Auto redirect if on home
      if (window.location.pathname === '/') {
        if (u.role === 'admin') navigate('/admin');
        else if (u.role === 'hoca') navigate('/faculty');
        else if (u.role === 'ogrenci') navigate('/student');
      }
    }
  }, [navigate]);

  return (
    <div className="app-layout">
      {user && <Navbar user={user} onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      }} />}
      
      <main className={user ? "app-container" : ""}>
        <Routes>
          <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
          
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['ogrenci']}>
              <StudentDashboard user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/faculty" element={
            <ProtectedRoute allowedRoles={['hoca']}>
              <FacultyDashboard user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={
            <div className="glass-panel text-center mt-4">
              <h2>404 - Sayfa Bulunamadı</h2>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
