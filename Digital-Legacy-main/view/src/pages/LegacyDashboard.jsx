import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Clock, Archive } from 'lucide-react';

export default function LegacyDashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">Legacy Contact</div>
                <ul className="nav-links">
                    <li className="nav-item active"><Shield size={20} /> Dashboard</li>
                    <li className="nav-item" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={handleLogout}>
                        <LogOut size={20} /> Logout
                    </li>
                </ul>
            </aside>

            <main className="main-content">
                <h1>Legacy Contact Dashboard</h1>
                <p className="text-muted">Access shared memories and monitor legacy permissions.</p>

                <div className="dashboard-grid">
                    <div className="widget">
                        <div className="widget-header"><span>Assigned Access</span><Archive size={20} /></div>
                        <h2>0</h2>
                        <p className="text-sm text-muted">No released assets yet.</p>
                    </div>

                    <div className="widget">
                        <div className="widget-header"><span>Emergency Requests</span><Clock size={20} /></div>
                        <h2>Pending Feature</h2>
                        <p className="text-sm text-muted">This will connect with Part-5 later.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}