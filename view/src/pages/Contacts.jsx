// view/src/pages/Contacts.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';
const headers = () => ({ 'x-auth-token': localStorage.getItem('token') });

export default function Contacts() {
    const [contacts, setContacts]       = useState([]);
    const [requests, setRequests]       = useState([]);
    const [logs, setLogs]               = useState([]);
    const [tab, setTab]                 = useState('contacts');   // 'contacts' | 'requests' | 'logs'
    const [form, setForm]               = useState({
        contactName: '', contactEmail: '', relationship: '',
        accessLevel: 'Emergency', accessExpiresAt: ''
    });
    const [editId, setEditId]           = useState(null);
    const [msg, setMsg]                 = useState('');

    const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    const fetchAll = async () => {
        const [c, r, l] = await Promise.all([
            axios.get(`${API}/contacts`,                  { headers: headers() }),
            axios.get(`${API}/contacts/emergency-requests`, { headers: headers() }),
            axios.get(`${API}/contacts/access-logs`,      { headers: headers() }),
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

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
            <h2>Contact, Security & Monitoring</h2>

            {msg && <div style={{ background: '#1e40af', color: '#fff', padding: '8px 16px', borderRadius: 6, marginBottom: 12 }}>{msg}</div>}

            {/* ─── Tabs ─── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['contacts', 'requests', 'logs'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        style={{ padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: tab === t ? '#6366f1' : '#e5e7eb', color: tab === t ? '#fff' : '#111' }}>
                        {t === 'contacts' ? 'Manage Contacts' : t === 'requests' ? 'Emergency Requests' : 'Access History'}
                    </button>
                ))}
            </div>

            {/* ─── Contacts Tab ─── */}
            {tab === 'contacts' && (
                <>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24,
                        background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                        <h3 style={{ gridColumn: '1/-1', margin: 0 }}>{editId ? 'Edit Contact' : 'Add New Contact'}</h3>
                        {[['contactName','Name'],['contactEmail','Email'],['relationship','Relationship']].map(([k,p]) => (
                            <input key={k} placeholder={p} value={form[k]}
                                onChange={e => setForm({...form, [k]: e.target.value})}
                                required={k !== 'relationship'}
                                style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
                        ))}
                        <select value={form.accessLevel} onChange={e => setForm({...form, accessLevel: e.target.value})}
                            style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
                            <option>Emergency</option><option>Partial</option><option>Full</option>
                        </select>
                        <div>
                            <label style={{ fontSize: 12, color: '#6b7280' }}>Access Expires (leave blank = never)</label>
                            <input type="date" value={form.accessExpiresAt}
                                onChange={e => setForm({...form, accessExpiresAt: e.target.value})}
                                style={{ display: 'block', width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
                            <button type="submit" style={{ padding: '8px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                                {editId ? 'Update' : 'Add Contact'}
                            </button>
                            {editId && <button type="button" onClick={() => { setEditId(null); setForm({ contactName:'',contactEmail:'',relationship:'',accessLevel:'Emergency',accessExpiresAt:'' }); }}
                                style={{ padding: '8px 24px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>}
                        </div>
                    </form>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f3f4f6' }}>
                                {['Name','Email','Relationship','Access Level','Expires','Status','Actions'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 13 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map(c => (
                                <tr key={c._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '8px 10px' }}>{c.contactName}</td>
                                    <td style={{ padding: '8px 10px', fontSize: 13, color: '#6b7280' }}>{c.contactEmail}</td>
                                    <td style={{ padding: '8px 10px', fontSize: 13 }}>{c.relationship || '—'}</td>
                                    <td style={{ padding: '8px 10px' }}>
                                        <select value={c.accessLevel}
                                            onChange={e => changePermission(c._id, e.target.value)}
                                            style={{ padding: '4px 8px', borderRadius: 4, border: `2px solid ${levelColor[c.accessLevel]}`, background: 'transparent', fontWeight: 600, color: levelColor[c.accessLevel] }}>
                                            <option>Emergency</option><option>Partial</option><option>Full</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '8px 10px', fontSize: 13 }}>
                                        {c.accessExpiresAt ? new Date(c.accessExpiresAt).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td style={{ padding: '8px 10px' }}>
                                        <span style={{ background: c.isExpired ? '#fee2e2' : '#dcfce7', color: c.isExpired ? '#dc2626' : '#16a34a',
                                            padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                                            {c.isExpired ? 'Expired' : 'Active'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                                        <button onClick={() => startEdit(c)}
                                            style={{ padding: '4px 10px', background: '#dbeafe', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Edit</button>
                                        <button onClick={() => deleteContact(c._id)}
                                            style={{ padding: '4px 10px', background: '#fee2e2', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {contacts.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>No contacts yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}

            {/* ─── Emergency Requests Tab ─── */}
            {tab === 'requests' && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                            {['From','Email','Reason','Status','Date','Action'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 13 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(r => (
                            <tr key={r._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '8px 10px' }}>{r.requester?.name || '—'}</td>
                                <td style={{ padding: '8px 10px', fontSize: 13, color: '#6b7280' }}>{r.requester?.email}</td>
                                <td style={{ padding: '8px 10px', fontSize: 13 }}>{r.reason}</td>
                                <td style={{ padding: '8px 10px' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                                        background: r.status === 'Pending' ? '#fef9c3' : r.status === 'Approved' ? '#dcfce7' : '#fee2e2',
                                        color:      r.status === 'Pending' ? '#854d0e' : r.status === 'Approved' ? '#16a34a' : '#dc2626' }}>
                                        {r.status}
                                    </span>
                                </td>
                                <td style={{ padding: '8px 10px', fontSize: 13 }}>{new Date(r.requestDate).toLocaleDateString()}</td>
                                <td style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                                    {r.status === 'Pending' && (<>
                                        <button onClick={() => resolveRequest(r._id, 'Approved')}
                                            style={{ padding: '4px 10px', background: '#dcfce7', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Approve</button>
                                        <button onClick={() => resolveRequest(r._id, 'Denied')}
                                            style={{ padding: '4px 10px', background: '#fee2e2', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Deny</button>
                                    </>)}
                                    {r.status !== 'Pending' && <span style={{ fontSize: 13, color: '#9ca3af' }}>Resolved</span>}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>No emergency requests.</td></tr>
                        )}
                    </tbody>
                </table>
            )}

            {/* ─── Access History Log Tab ─── */}
            {tab === 'logs' && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                            {['Time','Actor','Action','Contact','Details'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 13 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(l => (
                            <tr key={l._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '8px 10px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                                    {new Date(l.timestamp).toLocaleString()}
                                </td>
                                <td style={{ padding: '8px 10px', fontSize: 13 }}>{l.actor?.name || '—'}</td>
                                <td style={{ padding: '8px 10px' }}>
                                    <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                                        {l.actionType.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '8px 10px', fontSize: 13 }}>{l.contact?.contactName || '—'}</td>
                                <td style={{ padding: '8px 10px', fontSize: 13, color: '#6b7280' }}>{l.details}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>No logs yet.</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}