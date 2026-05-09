import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Archive, Shield, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await axios.get('http://127.0.0.1:5000/api/admin/analytics', {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                setAnalytics(res.data);
            } catch (err) {
                alert(err.response?.data?.msg || 'Unauthorized');
                navigate('/login');
            }
        };

        fetchAnalytics();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!analytics) return <div className="main-content">Loading admin dashboard...</div>;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">Admin Panel</div>
                <ul className="nav-links">
                    <li className="nav-item active"><Shield size={20} /> Analytics</li>
                    <li className="nav-item" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={handleLogout}>
                        <LogOut size={20} /> Logout
                    </li>
                </ul>
            </aside>

            <main className="main-content">
                <h1>Administrator Dashboard</h1>
                <p className="text-muted">System analytics and monitoring overview.</p>

                <div className="dashboard-grid">
                    <div className="widget">
                        <div className="widget-header"><span>Total Users</span><Users size={20} /></div>
                        <h2>{analytics.totalUsers}</h2>
                    </div>

                    <div className="widget">
                        <div className="widget-header"><span>Total Vaults</span><Archive size={20} /></div>
                        <h2>{analytics.totalVaults}</h2>
                    </div>

                    <div className="widget">
                        <div className="widget-header"><span>Total Memories</span><Activity size={20} /></div>
                        <h2>{analytics.totalMemories}</h2>
                    </div>

                    <div className="widget">
                        <div className="widget-header"><span>Active Sessions</span><Shield size={20} /></div>
                        <h2>{analytics.activeSessions}</h2>
                    </div>
                </div>

                <div className="widget mt-4">
                    <div className="widget-header"><span>User Role Breakdown</span></div>
                    <p>Memory Owners: {analytics.memoryOwners}</p>
                    <p>Legacy Contacts: {analytics.legacyContacts}</p>
                    <p>Administrators: {analytics.administrators}</p>
                    <p>Active Users: {analytics.activeUsers}</p>
                </div>

                <div className="widget mt-4">
                    <div className="widget-header"><span>Recent Users</span></div>
                    {analytics.recentUsers.map(user => (
                        <div key={user._id} className="session-item">
                            <div>
                                <strong>{user.name}</strong>
                                <div className="text-sm text-muted">{user.email} • {user.role}</div>
                            </div>
                            <span className={`status-badge ${user.isActive ? 'status-active' : ''}`}>
                                {user.isActive ? 'active' : 'inactive'}
                            </span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}