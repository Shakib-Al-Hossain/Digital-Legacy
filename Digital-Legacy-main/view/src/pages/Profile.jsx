import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Activity, LogOut, Settings, Save, UserPlus, AlertTriangle, Shield, Moon, Sun, Archive } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Profile() {
    const [profile, setProfile] = useState({ name: '', email: '', deadManTrigger: { enabled: false, triggerDurationDays: 30 } });
    const [contactForm, setContactForm] = useState({ contactName: '', contactEmail: '', relationship: '', accessLevel: 'Emergency' });
    const [contacts, setContacts] = useState([]);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        fetchProfile();
        fetchContacts();
    }, []);

    const fetchProfile = async () => {
        const res = await axios.get('http://127.0.0.1:5000/api/profile', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setProfile(res.data);
    };

    const fetchContacts = async () => {
        const res = await axios.get('http://127.0.0.1:5000/api/profile/contact', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setContacts(res.data);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        await axios.put('http://127.0.0.1:5000/api/profile', { name: profile.name }, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        alert('Profile updated successfully');
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        await axios.post('http://127.0.0.1:5000/api/profile/contact', contactForm, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setContactForm({ contactName: '', contactEmail: '', relationship: '', accessLevel: 'Emergency' });
        fetchContacts();
        alert('Legacy Contact added');
    };

    const handleDeadManTrigger = async (enabled) => {
        const res = await axios.put('http://127.0.0.1:5000/api/profile/deadman',
            { enabled, triggerDurationDays: profile.deadManTrigger.triggerDurationDays },
            { headers: { 'x-auth-token': localStorage.getItem('token') } }
        );
        setProfile({ ...profile, deadManTrigger: res.data });
    };

    const handleDeactivate = async () => {
        if (window.confirm("Are you sure you want to deactivate your account? Data export will be prepared.")) {
            const res = await axios.put('http://127.0.0.1:5000/api/profile/deactivate', {}, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            alert(res.data.msg);
            localStorage.removeItem('token');
            navigate('/login');
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">Digital Legacy</div>
                <ul className="nav-links">
                    <Link to="/dashboard" className="nav-item"><Activity size={20} /> Dashboard</Link>
                    <Link to="/vault" className="nav-item"><Archive size={20} /> My Vaults</Link>
                    <Link to="/profile" className="nav-item active"><User size={20} /> Profile</Link>
                    <li className="nav-item" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>
                        <LogOut size={20} /> Logout
                    </li>
                </ul>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <h1>Profile Management</h1>

                <div className="dashboard-grid">

                    {/* Profile Update */}
                    <div className="widget" style={{ gridColumn: 'span 1' }}>
                        <div className="widget-header">
                            <span>Update Profile</span>
                            <Settings size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="input-group">
                                <label>Email Address (Immutable)</label>
                                <input type="email" value={profile.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                            </div>
                            <div className="input-group">
                                <label>Full Name</label>
                                <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                            </div>
                            <button type="submit" className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Save size={18} /> Save Changes
                            </button>
                        </form>

                        <div style={{ marginTop: '3rem' }}>
                            <div className="widget-header" style={{ color: 'var(--danger)' }}>
                                <span>Danger Zone</span>
                                <AlertTriangle size={20} />
                            </div>
                            <p className="text-sm mb-4 text-muted">Deactivate account and export your data archive.</p>
                            <button onClick={handleDeactivate} className="btn btn-danger">Deactivate & Export</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', gridColumn: 'span 1' }}>
                        {/* Legacy Contacts */}
                        <div className="widget">
                            <div className="widget-header">
                                <span>Trusted Legacy Contacts</span>
                                <UserPlus size={20} style={{ color: 'var(--primary)' }} />
                            </div>
                            <form onSubmit={handleAddContact} style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                                    <input type="text" placeholder="Name" required value={contactForm.contactName} onChange={e => setContactForm({ ...contactForm, contactName: e.target.value })} className="profile-input" />
                                    <input type="email" placeholder="Email" required value={contactForm.contactEmail} onChange={e => setContactForm({ ...contactForm, contactEmail: e.target.value })} className="profile-input" />
                                </div>
                                <button type="submit" className="btn text-sm" style={{ padding: '0.75rem' }}>Add Contact</button>
                            </form>

                            <div className="session-list">
                                {contacts.map(c => (
                                    <div key={c._id} className="session-item">
                                        <div>
                                            <strong>{c.contactName}</strong>
                                            <div className="text-sm text-muted mt-1">{c.contactEmail} - {c.accessLevel}</div>
                                        </div>
                                    </div>
                                ))}
                                {contacts.length === 0 && <p className="text-sm text-muted">No contacts added yet.</p>}
                            </div>
                        </div>

                        {/* Dead-Man Trigger */}
                        <div className="widget">
                            <div className="widget-header">
                                <span>Dead-Man Trigger System</span>
                                <Shield size={20} style={{ color: 'var(--primary)' }} />
                            </div>
                            <p className="text-sm text-muted mb-4">
                                Automatically release your legacy entries if you don't login for {profile.deadManTrigger?.triggerDurationDays || 30} days.
                            </p>
                            <div className="flex-between">
                                <span style={{ fontWeight: 500 }}>Enable Trigger</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={profile.deadManTrigger?.enabled || false}
                                        onChange={(e) => handleDeadManTrigger(e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
