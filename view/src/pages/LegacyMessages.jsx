import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Archive, User, LogOut, Mail, Clock, Send, Trash2, RefreshCw, ChevronDown, ChevronRight, Plus, X, Package, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

const API = 'http://127.0.0.1:5000/api';
const headers = () => ({ 'x-auth-token': localStorage.getItem('token') });

export default function LegacyMessages() {
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [memories, setMemories] = useState([]);
    const [distributions, setDistributions] = useState([]);
    const [stats, setStats] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showDistLog, setShowDistLog] = useState(false);
    const [activeTab, setActiveTab] = useState('messages');
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '', message: '', messageType: 'Text',
        scheduledDate: '', releaseCondition: 'Scheduled Date',
        selectedRecipients: [], assetAssignments: []
    });
    const [attachmentFile, setAttachmentFile] = useState(null);

    const [assignForm, setAssignForm] = useState({ contactId: '', memoryIds: [], personalNote: '' });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [msgRes, conRes, memRes, distRes, statRes] = await Promise.all([
                axios.get(`${API}/legacy`, { headers: headers() }),
                axios.get(`${API}/profile/contact`, { headers: headers() }),
                axios.get(`${API}/legacy/memories`, { headers: headers() }),
                axios.get(`${API}/legacy/distributions`, { headers: headers() }),
                axios.get(`${API}/legacy/stats`, { headers: headers() })
            ]);
            setMessages(msgRes.data);
            setContacts(conRes.data);
            setMemories(memRes.data);
            setDistributions(distRes.data);
            setStats(statRes.data);
        } catch (err) {
            if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('message', form.message);
            formData.append('messageType', form.messageType);
            formData.append('scheduledDate', form.scheduledDate);
            formData.append('releaseCondition', form.releaseCondition);
            formData.append('recipients', JSON.stringify(form.selectedRecipients));
            formData.append('assetAssignments', JSON.stringify(form.assetAssignments));
            if (attachmentFile) {
                formData.append('attachment', attachmentFile);
            }
            await axios.post(`${API}/legacy/create`, formData, {
                headers: { 'x-auth-token': localStorage.getItem('token'), 'Content-Type': 'multipart/form-data' }
            });
            setForm({ title: '', message: '', messageType: 'Text', scheduledDate: '', releaseCondition: 'Scheduled Date', selectedRecipients: [], assetAssignments: [] });
            setAttachmentFile(null);
            setShowCreate(false);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to create');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this legacy message?')) return;
        await axios.delete(`${API}/legacy/message/${id}`, { headers: headers() });
        fetchAll();
    };

    const handleRelease = async (id) => {
        if (!window.confirm('Release this message now? It will be sent to all recipients immediately.')) return;
        try {
            await axios.post(`${API}/legacy/release/${id}`, {}, { headers: headers() });
            alert('Message released successfully!');
            fetchAll();
        } catch (err) { alert(err.response?.data?.msg || 'Release failed'); }
    };

    const handleRetry = async (id) => {
        try {
            await axios.post(`${API}/legacy/retry/${id}`, {}, { headers: headers() });
            alert('Retry successful!');
            fetchAll();
        } catch (err) { alert(err.response?.data?.msg || 'Retry failed'); }
    };

    const toggleRecipient = (id) => {
        setForm(f => ({
            ...f,
            selectedRecipients: f.selectedRecipients.includes(id)
                ? f.selectedRecipients.filter(r => r !== id)
                : [...f.selectedRecipients, id]
        }));
    };

    const addAssetAssignment = () => {
        if (!assignForm.contactId || assignForm.memoryIds.length === 0) return;
        const contact = contacts.find(c => c._id === assignForm.contactId);
        setForm(f => ({
            ...f,
            assetAssignments: [...f.assetAssignments, {
                contactId: assignForm.contactId,
                contactName: contact?.contactName,
                memoryIds: assignForm.memoryIds,
                personalNote: assignForm.personalNote
            }]
        }));
        setAssignForm({ contactId: '', memoryIds: [], personalNote: '' });
    };

    const removeAssignment = (idx) => {
        setForm(f => ({ ...f, assetAssignments: f.assetAssignments.filter((_, i) => i !== idx) }));
    };

    const toggleAssignMemory = (memId) => {
        setAssignForm(f => ({
            ...f,
            memoryIds: f.memoryIds.includes(memId) ? f.memoryIds.filter(m => m !== memId) : [...f.memoryIds, memId]
        }));
    };

    const statusColor = (s) => {
        const map = { Scheduled: '#3b82f6', Released: '#10b981', Delivered: '#10b981', Failed: '#ef4444', Pending: '#f59e0b', Draft: '#6b7280' };
        return map[s] || '#6b7280';
    };

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">Digital Legacy</div>
                <ul className="nav-links">
                    <Link to="/dashboard" className="nav-item"><Activity size={20} /> Dashboard</Link>
                    <Link to="/vault" className="nav-item"><Archive size={20} /> My Vaults</Link>
                    <Link to="/legacy-messages" className="nav-item active"><Mail size={20} /> Legacy Messages</Link>
                    <Link to="/profile" className="nav-item"><User size={20} /> Profile</Link>
                    <Link to="/contacts" className="nav-item"><Shield size={20} /> Contacts & Security</Link>
                    <li className="nav-item" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={handleLogout}><LogOut size={20} /> Logout</li>
                </ul>
            </aside>

            <main className="main-content">
                <h1>Scheduled Legacy & Distribution</h1>
                <p className="text-muted">Create future legacy messages, schedule releases, assign assets, and track delivery.</p>

                {/* Stats */}
                {stats && (
                    <div className="dashboard-grid mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="widget"><div className="widget-header"><span>Total Messages</span><Mail size={20} style={{ color: 'var(--primary)' }} /></div><h2>{stats.messages.total}</h2></div>
                        <div className="widget"><div className="widget-header"><span>Scheduled</span><Clock size={20} style={{ color: '#3b82f6' }} /></div><h2>{stats.messages.scheduled}</h2></div>
                        <div className="widget"><div className="widget-header"><span>Delivered</span><CheckCircle size={20} style={{ color: '#10b981' }} /></div><h2>{stats.messages.released}</h2></div>
                        <div className="widget"><div className="widget-header"><span>Failed</span><AlertTriangle size={20} style={{ color: '#ef4444' }} /></div><h2>{stats.messages.failed}</h2></div>
                    </div>
                )}

                {/* Tab Bar */}
                <div className="flex-between mt-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['messages', 'distributions'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className="btn" style={{
                                    width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem',
                                    background: activeTab === tab ? 'linear-gradient(135deg, var(--primary), #4f46e5)' : 'var(--item-bg)',
                                    color: activeTab === tab ? '#fff' : 'var(--text-muted)'
                                }}>
                                {tab === 'messages' ? 'Legacy Messages' : 'Distribution Log'}
                            </button>
                        ))}
                    </div>
                    {activeTab === 'messages' && (
                        <button className="btn" style={{ width: 'auto' }} onClick={() => setShowCreate(!showCreate)}>
                            <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} />Create Legacy Message
                        </button>
                    )}
                </div>

                {/* CREATE FORM */}
                {showCreate && activeTab === 'messages' && (
                    <div className="glass-panel mt-4" style={{ padding: '1.5rem' }}>
                        <h3 className="mb-4">Create Legacy Message</h3>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="input-group"><label>Title</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                            <div className="input-group"><label>Message</label>
                                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required
                                    style={{ width: '100%', minHeight: '120px', padding: '0.875rem 1rem', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-main)', fontFamily: 'Inter, sans-serif', resize: 'vertical' }} /></div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div className="input-group" style={{ flex: 1, minWidth: '200px' }}><label>Type</label>
                                    <select className="profile-input" style={{ width: '100%' }} value={form.messageType} onChange={e => setForm({ ...form, messageType: e.target.value })}>
                                        {['Text', 'Letter', 'Instructions', 'Will', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select></div>
                                <div className="input-group" style={{ flex: 1, minWidth: '200px' }}><label>Scheduled Date & Time {form.releaseCondition !== 'Manual Release' && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
                                    <input type="datetime-local" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} required={form.releaseCondition !== 'Manual Release'} /></div>
                                <div className="input-group" style={{ flex: 1, minWidth: '200px' }}><label>Release Condition</label>
                                    <select className="profile-input" style={{ width: '100%' }} value={form.releaseCondition} onChange={e => setForm({ ...form, releaseCondition: e.target.value })}>
                                        {['Scheduled Date', 'Dead-Man Trigger', 'Manual Release'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select></div>
                            </div>

                            {/* Recipients */}
                            <div style={{ background: 'var(--item-bg)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Select Recipients</label>
                                {contacts.length === 0 ? <p className="text-sm text-muted">No contacts. Add them in Profile first.</p> :
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {contacts.map(c => (
                                            <button type="button" key={c._id} onClick={() => toggleRecipient(c._id)}
                                                style={{
                                                    padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                                    background: form.selectedRecipients.includes(c._id) ? 'var(--primary)' : 'transparent',
                                                    color: form.selectedRecipients.includes(c._id) ? '#fff' : 'var(--text-muted)',
                                                    borderColor: form.selectedRecipients.includes(c._id) ? 'var(--primary)' : 'var(--border-color)'
                                                }}>{c.contactName} ({c.contactEmail})</button>
                                        ))}
                                    </div>}
                            </div>

                            {/* Asset Assignment */}
                            <div style={{ background: 'var(--item-bg)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                                    <Package size={16} style={{ display: 'inline', marginRight: '6px' }} />Assign Assets to Contacts (Optional)
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    <select className="profile-input" style={{ flex: 1, minWidth: '150px' }} value={assignForm.contactId} onChange={e => setAssignForm({ ...assignForm, contactId: e.target.value })}>
                                        <option value="">Select Contact</option>
                                        {contacts.map(c => <option key={c._id} value={c._id}>{c.contactName}</option>)}
                                    </select>
                                    <input className="profile-input" placeholder="Personal note..." style={{ flex: 1, minWidth: '150px' }}
                                        value={assignForm.personalNote} onChange={e => setAssignForm({ ...assignForm, personalNote: e.target.value })} />
                                    <button type="button" className="btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={addAssetAssignment}>Add</button>
                                </div>
                                {memories.length > 0 && assignForm.contactId && (
                                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {memories.map(m => (
                                            <button type="button" key={m._id} onClick={() => toggleAssignMemory(m._id)}
                                                style={{
                                                    padding: '0.3rem 0.7rem', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontSize: '0.75rem',
                                                    background: assignForm.memoryIds.includes(m._id) ? 'rgba(59,130,246,0.2)' : 'transparent',
                                                    color: assignForm.memoryIds.includes(m._id) ? 'var(--primary)' : 'var(--text-muted)',
                                                    borderColor: assignForm.memoryIds.includes(m._id) ? 'var(--primary)' : 'var(--border-color)'
                                                }}>{m.title} ({m.category})</button>
                                        ))}
                                    </div>
                                )}
                                {form.assetAssignments.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        {form.assetAssignments.map((a, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--panel-bg)', borderRadius: '8px', marginBottom: '0.3rem' }}>
                                                <span className="text-sm"><strong>{a.contactName}</strong> — {a.memoryIds.length} asset(s) {a.personalNote && `• "${a.personalNote}"`}</span>
                                                <button type="button" onClick={() => removeAssignment(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* File Attachment */}
                            <div style={{ background: 'var(--item-bg)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Attach File (Optional)</label>
                                <input type="file" onChange={e => setAttachmentFile(e.target.files[0] || null)}
                                    style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                {attachmentFile && <p className="text-sm text-muted" style={{ marginTop: '0.4rem' }}>Selected: {attachmentFile.name}</p>}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn">Create & Schedule</button>
                                <button type="button" className="btn btn-danger" onClick={() => setShowCreate(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MESSAGES TAB */}
                {activeTab === 'messages' && (
                    <div className="dashboard-grid mt-4">
                        {messages.map(msg => (
                            <div key={msg._id} className="widget">
                                <div className="widget-header">
                                    <span style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.title}</span>
                                    <span className="status-badge" style={{ background: `${statusColor(msg.status)}22`, color: statusColor(msg.status), border: `1px solid ${statusColor(msg.status)}44` }}>{msg.status}</span>
                                </div>
                                <p className="text-sm text-muted" style={{ marginBottom: '0.75rem', whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'hidden' }}>{msg.message}</p>
                                <div className="text-sm" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                    <span><Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />Scheduled: {new Date(msg.scheduledDate).toLocaleString()}</span>
                                    <span><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />Recipients: {msg.recipients?.length || 0}</span>
                                    <span><Package size={14} style={{ display: 'inline', marginRight: '4px' }} />Asset Assignments: {msg.assetAssignments?.length || 0}</span>
                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>Type: {msg.messageType} • Condition: {msg.releaseCondition}</span>
                                </div>
                                {msg.recipients?.length > 0 && (
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        {msg.recipients.map((r, i) => (
                                            <span key={i} style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '12px', background: 'var(--item-bg)', border: '1px solid var(--border-color)', fontSize: '0.7rem', marginRight: '0.3rem', marginBottom: '0.3rem' }}>{r.contactName}</span>
                                        ))}
                                    </div>
                                )}
                                {msg.releasedAt && <p className="text-sm text-muted">Released: {new Date(msg.releasedAt).toLocaleString()}</p>}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                                    {(msg.status === 'Scheduled' || msg.status === 'Draft') && (
                                        <button className="btn" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleRelease(msg._id)}>
                                            <Send size={14} style={{ display: 'inline', marginRight: '4px' }} />Release Now
                                        </button>
                                    )}
                                    <button className="btn btn-danger" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDelete(msg._id)}>
                                        <Trash2 size={14} style={{ display: 'inline', marginRight: '4px' }} />Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && <p className="text-muted">No legacy messages yet. Create one to get started!</p>}
                    </div>
                )}

                {/* DISTRIBUTION LOG TAB */}
                {activeTab === 'distributions' && (
                    <div className="mt-4">
                        <div className="session-list">
                            {distributions.map(d => (
                                <div key={d._id} className="session-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                                    <div className="flex-between">
                                        <div>
                                            <strong>{d.recipientName}</strong>
                                            <div className="text-sm text-muted">{d.recipientEmail}</div>
                                        </div>
                                        <span className="status-badge" style={{ background: `${statusColor(d.status)}22`, color: statusColor(d.status), border: `1px solid ${statusColor(d.status)}44` }}>{d.status}</span>
                                    </div>
                                    <div className="text-sm text-muted">
                                        Message: {d.legacyMessage?.title || 'N/A'} • Type: {d.distributionType}
                                        {d.sentAt && ` • Sent: ${new Date(d.sentAt).toLocaleString()}`}
                                        {d.deliveredAt && ` • Delivered: ${new Date(d.deliveredAt).toLocaleString()}`}
                                    </div>
                                    {d.assignedMemories?.length > 0 && (
                                        <div className="text-sm">Assets: {d.assignedMemories.map(m => m.title || m).join(', ')}</div>
                                    )}
                                    {d.failureReason && <div className="text-sm" style={{ color: 'var(--danger)' }}>Error: {d.failureReason}</div>}
                                    {d.status === 'Failed' && (
                                        <button className="btn" style={{ width: 'auto', padding: '0.3rem 0.7rem', fontSize: '0.8rem', alignSelf: 'flex-end' }} onClick={() => handleRetry(d._id)}>
                                            <RefreshCw size={14} style={{ display: 'inline', marginRight: '4px' }} />Retry
                                        </button>
                                    )}
                                </div>
                            ))}
                            {distributions.length === 0 && <p className="text-muted mt-4">No distribution records yet.</p>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
