import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Clock, Shield, User, LogOut, Moon, Sun, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
    const [sessions, setSessions] = useState([]);
    const [memoryTimeline, setMemoryTimeline] = useState([]);
    const [showTimeline, setShowTimeline] = useState(false);
    const [showSessions, setShowSessions] = useState(false);
    const [stats, setStats] = useState({
        totalVaults: 0,
        totalMemories: 0,
        memoriesByCategory: {
            Emotional: 0,
            Legal: 0,
            Financial: 0,
            Personal: 0
        }
    });
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch sessions
                const resSessions = await axios.get('http://127.0.0.1:5000/api/auth/sessions', {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                setSessions(resSessions.data);
                const resStats = await axios.get('http://127.0.0.1:5000/api/vault/dashboard/stats', {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                setStats(resStats.data);

                // Fetch vaults & cross-vault memories for timeline
                const resVaults = await axios.get('http://127.0.0.1:5000/api/vault', {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                
                let allMemories = [];
                for (let v of resVaults.data) {
                    const resMems = await axios.get(`http://127.0.0.1:5000/api/vault/${v._id}/memories`, {
                        headers: { 'x-auth-token': localStorage.getItem('token') }
                    });
                    allMemories = [...allMemories, ...resMems.data];
                }
                
                // Sort by date descending
                allMemories.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                const formattedTimeline = allMemories.map(m => ({
                    id: m._id,
                    date: new Date(m.createdAt).toLocaleDateString(),
                    title: m.title,
                    desc: m.description,
                    category: m.category
                }));
                setMemoryTimeline(formattedTimeline);

            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };
        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">Digital Legacy</div>
                <ul className="nav-links">
                    <Link to="/dashboard" className="nav-item active"><Activity size={20} /> Dashboard</Link>
                    <Link to="/vault" className="nav-item"><Archive size={20} /> My Vaults</Link>
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
                    
                    {/* Memory Owner Statistics */}
                    <div className="widget">
                        <div className="widget-header">
                            <span>Total Vaults</span>
                            <Archive size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        <h2>{stats.totalVaults}</h2>
                        <p className="text-sm text-muted">Vaults created by you</p>
                    </div>

                    <div className="widget">
                        <div className="widget-header">
                            <span>Total Memories</span>
                            <Activity size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        <h2>{stats.totalMemories}</h2>
                        <p className="text-sm text-muted">Memories uploaded across all vaults</p>
                    </div>

                    <div className="widget">
                        <div className="widget-header">
                            <span>Memories by Category</span>
                            <Shield size={20} style={{ color: 'var(--primary)' }} />
                        </div>

                        <p>Emotional: {stats.memoriesByCategory?.Emotional || 0}</p>
                        <p>Legal: {stats.memoriesByCategory?.Legal || 0}</p>
                        <p>Financial: {stats.memoriesByCategory?.Financial || 0}</p>
                        <p>Personal: {stats.memoriesByCategory?.Personal || 0}</p>
                    </div>
                   

                </div>

                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                    {/* Timeline Visualization */}
                    <div className="widget" style={{ cursor: showTimeline ? 'default' : 'pointer', alignSelf: 'start' }} onClick={() => !showTimeline && setShowTimeline(true)}>
                        <div className="widget-header" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowTimeline(!showTimeline); }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {showTimeline ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                <span>Memory Timeline</span>
                            </div>
                            <Clock size={20} style={{ color: 'var(--primary)' }} />
                        </div>

                        {showTimeline && (
                            <div className="timeline mt-4">
                                {memoryTimeline.map(item => (
                                    <div key={item.id} className="timeline-item">
                                        <div className="timeline-date">{item.date}</div>
                                        <div className="timeline-content">
                                            <div className="flex-between">
                                                <strong>{item.title}</strong>
                                                <span className="status-badge" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>{item.category}</span>
                                            </div>
                                            <p className="text-sm mt-1 text-muted">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                                {memoryTimeline.length === 0 && <p className="text-sm text-muted">No memories found. Upload content in your Vault.</p>}
                            </div>
                        )}
                    </div>

                    {/* Session Activity Monitoring */}
                    <div className="widget" style={{ cursor: showSessions ? 'default' : 'pointer', alignSelf: 'start' }} onClick={() => !showSessions && setShowSessions(true)}>
                        <div className="widget-header" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowSessions(!showSessions); }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {showSessions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                <span>Session Activity</span>
                            </div>
                            <Shield size={20} style={{ color: 'var(--primary)' }} />
                        </div>

                        {showSessions && (
                            <div className="session-list mt-4">
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
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
