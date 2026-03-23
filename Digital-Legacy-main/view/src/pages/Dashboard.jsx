import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Clock, Shield, User, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
    const [sessions, setSessions] = useState([]);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await axios.get('http://127.0.0.1:5000/api/auth/sessions', {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                setSessions(res.data);
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };
        fetchSessions();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Mock data for Memory Timeline Visualization (Part-1 Feature 1)
    const memoryTimeline = [
        { id: 1, date: '2026-03-01', title: 'Graduation Album', desc: 'Uploaded 50 photos from university graduation.' },
        { id: 2, date: '2026-02-15', title: 'Legal Will Uploaded', desc: 'Securely stored legal documents for distribution.' },
        { id: 3, date: '2026-01-20', title: 'Legacy Message Drafted', desc: 'Created a future message for family members.' }
    ];

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">Digital Legacy</div>
                <ul className="nav-links">
                    <Link to="/dashboard" className="nav-item active"><Activity size={20} /> Dashboard</Link>
                    <Link to="/profile" className="nav-item"><User size={20} /> Profile</Link>
                    <li className="nav-item" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={handleLogout}>
                        <LogOut size={20} /> Logout
                    </li>
                </ul>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <h1>Dashboard Overview</h1>
                <p className="text-muted">Welcome to your Digital Legacy & Memory Preservation System.</p>

                <div className="dashboard-grid">

                    {/* Timeline Visualization */}
                    <div className="widget">
                        <div className="widget-header">
                            <span>Memory Timeline</span>
                            <Clock size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div className="timeline">
                            {memoryTimeline.map(item => (
                                <div key={item.id} className="timeline-item">
                                    <div className="timeline-date">{item.date}</div>
                                    <div className="timeline-content">
                                        <strong>{item.title}</strong>
                                        <p className="text-sm mt-1 text-muted">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Session Activity Monitoring */}
                    <div className="widget">
                        <div className="widget-header">
                            <span>Session Activity</span>
                            <Shield size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div className="session-list">
                            {sessions.map(session => (
                                <div key={session._id} className="session-item">
                                    <div>
                                        <div className="flex-between">
                                            <strong>{session.device || 'Unknown Device'}</strong>
                                        </div>
                                        <div className="text-sm text-muted mt-1">
                                            IP: {session.ipAddress} • {new Date(session.loginTime).toLocaleString()}
                                        </div>
                                    </div>
                                    <span className={`status-badge ${session.status === 'active' ? 'status-active' : ''}`}>
                                        {session.status}
                                    </span>
                                </div>
                            ))}
                            {sessions.length === 0 && <p className="text-sm text-muted">No session activity found.</p>}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
