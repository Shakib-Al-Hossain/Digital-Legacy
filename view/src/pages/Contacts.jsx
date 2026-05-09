// view/src/pages/Contacts.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';
const headers = () => ({ 'x-auth-token': localStorage.getItem('token') });

export default function Contacts() {
    const [contacts, setContacts]   = useState([]);
    const [requests, setRequests]   = useState([]);
    const [logs, setLogs]           = useState([]);
    const [tab, setTab]             = useState('contacts');
    const [form, setForm]           = useState({
        contactName: '', contactEmail: '', relationship: '',
        accessLevel: 'Emergency', accessExpiresAt: ''
    });
    const [editId, setEditId]       = useState(null);
    const [msg, setMsg]             = useState('');

    const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    const fetchAll = async () => {
        const [c, r, l] = await Promise.all([
            axios.get(`${API}/contacts`,                    { headers: headers() }),
            axios.get(`${API}/contacts/emergency-requests`, { headers: headers() }),
            axios.get(`${API}/contacts/access-logs`,        { headers: headers() }),
        ]);
        setContacts(c.data);
        setRequests(r.data);
        setLogs(l.data);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await axios.put(`${API}/contacts/${editId}`, form, { headers: headers() });
                flash('Contact updated.');
            } else {
                await axios.post(`${API}/contacts`, form, { headers: headers() });
                flash('Contact added.');
            }
            setForm({ contactName: '', contactEmail: '', relationship: '', accessLevel: 'Emergency', accessExpiresAt: '' });
            setEditId(null);
            fetchAll();
        } catch (err) {
            flash(err.response?.data?.msg || 'Error');
        }
    };

    const startEdit = (c) => {
        setEditId(c._id);
        setForm({
            contactName:     c.contactName,
            contactEmail:    c.contactEmail,
            relationship:    c.relationship || '',
            accessLevel:     c.accessLevel,
            accessExpiresAt: c.accessExpiresAt ? c.accessExpiresAt.slice(0, 10) : ''
        });
    };

    const deleteContact = async (id) => {
        if (!window.confirm('Delete this contact?')) return;
        await axios.delete(`${API}/contacts/${id}`, { headers: headers() });
        flash('Contact deleted.');
        fetchAll();
    };

    const changePermission = async (id, accessLevel) => {
        await axios.patch(`${API}/contacts/${id}/permission`, { accessLevel }, { headers: headers() });
        flash('Permission updated.');
        fetchAll();
    };

    const resolveRequest = async (id, status) => {
        await axios.patch(`${API}/contacts/emergency-requests/${id}`, { status }, { headers: headers() });
        flash(`Request ${status.toLowerCase()}.`);
        fetchAll();
    };

    const levelColor = { Full: '#4ade80', Partial: '#facc15', Emergency: '#f87171' };

    const inputStyle = {
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        background: 'var(--input-bg)',
        color: 'var(--text-main)',
        fontSize: 13,
        width: '100%',
        boxSizing: 'border-box',
    };

    const thStyle = {
        textAlign: 'left',
        padding: '10px 12px',
        fontSize: 12,
        color: 'var(--text-muted)',
        fontWeight: 600,
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--item-bg)',
    };

    const tdStyle = {
        padding: '10px 12px',
        fontSize: 13,
        color: 'var(--text-main)',
        borderBottom: '1px solid var(--border-color)',
    };

    const statusBadge = (status) => ({
        padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
        background: status === 'Pending'  ? 'rgba(250,204,21,0.15)'
                  : status === 'Approved' ? 'rgba(74,222,128,0.15)'
                  : 'rgba(248,113,113,0.15)',
        color:      status === 'Pending'  ? '#facc15'
                  : status === 'Approved' ? '#4ade80'
                  : '#f87171',
    });

    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 24, fontFamily: 'inherit', color: 'var(--text-main)' }}>
            <h2 style={{ marginBottom: 4 }}>Contact, Security & Monitoring</h2>
            <p className="text-muted" style={{ marginBottom: 20 }}>Manage your legacy contacts, review emergency requests, and monitor access history.</p>

            {msg && (
                <div style={{
                    background: 'rgba(99,102,241,0.15)', border: '1px solid var(--primary)',
                    color: 'var(--text-main)', padding: '8px 16px',
                    borderRadius: 8, marginBottom: 16, fontSize: 14
                }}>{msg}</div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {['contacts', 'requests', 'logs'].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: tab === t ? 'linear-gradient(135deg, var(--primary), #4f46e5)' : 'var(--item-bg)',
                        color: tab === t ? '#fff' : 'var(--text-muted)',
                        fontWeight: tab === t ? 600 : 400, fontSize: 13,
                    }}>
                        {t === 'contacts' ? 'Manage Contacts' : t === 'requests' ? 'Emergency Requests' : 'Access History'}
                    </button>
                ))}
            </div>

            {/* Contacts Tab */}
            {tab === 'contacts' && (
                <>
                    <form onSubmit={handleSubmit} style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24,
                        background: 'var(--panel-bg)', border: '1px solid var(--border-color)',
                        padding: 20, borderRadius: 12,
                    }}>
                        <h3 style={{ gridColumn: '1/-1', margin: '0 0 4px', color: 'var(--text-main)', fontSize: 15 }}>
                            {editId ? 'Edit Contact' : 'Add New Contact'}
                        </h3>
                        {[['contactName','Name'],['contactEmail','Email'],['relationship','Relationship']].map(([k,p]) => (
                            <input key={k} placeholder={p} value={form[k]}
                                onChange={e => setForm({...form, [k]: e.target.value})}
                                required={k !== 'relationship'} style={inputStyle} />
                        ))}
                        <select value={form.accessLevel}
                            onChange={e => setForm({...form, accessLevel: e.target.value})}
                            style={inputStyle}>
                            <option>Emergency</option><option>Partial</option><option>Full</option>
                        </select>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                                Access Expires (leave blank = never)
                            </label>
                            <input type="date" value={form.accessExpiresAt}
                                onChange={e => setForm({...form, accessExpiresAt: e.target.value})}
                                style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, marginTop: 4 }}>
                            <button type="submit" className="btn" style={{ width: 'auto', padding: '8px 24px' }}>
                                {editId ? 'Update Contact' : 'Add Contact'}
                            </button>
                            {editId && (
                                <button type="button" style={{
                                    padding: '8px 24px', background: 'var(--item-bg)', color: 'var(--text-muted)',
                                    border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', fontSize: 13
                                }} onClick={() => { setEditId(null); setForm({ contactName:'', contactEmail:'', relationship:'', accessLevel:'Emergency', accessExpiresAt:'' }); }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>{['Name','Email','Relationship','Access Level','Expires','Status','Actions'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody>
                                {contacts.map(c => (
                                    <tr key={c._id}>
                                        <td style={tdStyle}><strong>{c.contactName}</strong></td>
                                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{c.contactEmail}</td>
                                        <td style={tdStyle}>{c.relationship || '—'}</td>
                                        <td style={tdStyle}>
                                            <select value={c.accessLevel}
                                                onChange={e => changePermission(c._id, e.target.value)}
                                                style={{ padding: '4px 8px', borderRadius: 6, border: `2px solid ${levelColor[c.accessLevel]}`, background: 'transparent', fontWeight: 700, color: levelColor[c.accessLevel], cursor: 'pointer' }}>
                                                <option>Emergency</option><option>Partial</option><option>Full</option>
                                            </select>
                                        </td>
                                        <td style={tdStyle}>{c.accessExpiresAt ? new Date(c.accessExpiresAt).toLocaleDateString() : 'Never'}</td>
                                        <td style={tdStyle}>
                                            <span style={{ background: c.isExpired ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)', color: c.isExpired ? '#f87171' : '#4ade80', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                                                {c.isExpired ? 'Expired' : 'Active'}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, display: 'flex', gap: 6 }}>
                                            <button onClick={() => startEdit(c)} style={{ padding: '4px 12px', background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
                                            <button onClick={() => deleteContact(c._id)} style={{ padding: '4px 12px', background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid #f87171', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {contacts.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No contacts yet. Add your first legacy contact above.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Emergency Requests Tab */}
            {tab === 'requests' && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>{['From','Email','Reason','Status','Date','Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {requests.map(r => (
                                <tr key={r._id}>
                                    <td style={tdStyle}><strong>{r.requester?.name || '—'}</strong></td>
                                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{r.requester?.email}</td>
                                    <td style={tdStyle}>{r.reason}</td>
                                    <td style={tdStyle}><span style={statusBadge(r.status)}>{r.status}</span></td>
                                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{new Date(r.requestDate).toLocaleDateString()}</td>
                                    <td style={{ ...tdStyle, display: 'flex', gap: 6 }}>
                                        {r.status === 'Pending' && (<>
                                            <button onClick={() => resolveRequest(r._id, 'Approved')} style={{ padding: '4px 12px', background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid #4ade80', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Approve</button>
                                            <button onClick={() => resolveRequest(r._id, 'Denied')} style={{ padding: '4px 12px', background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid #f87171', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Deny</button>
                                        </>)}
                                        {r.status !== 'Pending' && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Resolved</span>}
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No emergency requests.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Access History Log Tab */}
            {tab === 'logs' && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>{['Time','Actor','Action','Contact','Details'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l._id}>
                                    <td style={{ ...tdStyle, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(l.timestamp).toLocaleString()}</td>
                                    <td style={tdStyle}>{l.actor?.name || '—'}</td>
                                    <td style={tdStyle}>
                                        <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                                            {l.actionType.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{l.contact?.contactName || '—'}</td>
                                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{l.details}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No logs yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
