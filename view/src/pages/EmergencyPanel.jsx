// view/src/pages/EmergencyPanel.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

const API     = 'http://localhost:5000/api';
const headers = () => ({ 'x-auth-token': localStorage.getItem('token') });

export default function EmergencyPanel() {
    const [myRequests, setMyRequests] = useState([]);
    const [ownerEmail, setOwnerEmail] = useState('');
    const [reason, setReason]         = useState('');
    const [msg, setMsg]               = useState('');

    const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

    const fetchMyRequests = async () => {
        const res = await axios.get(`${API}/contacts/my-emergency-requests`, { headers: headers() });
        setMyRequests(res.data);
    };

    useEffect(() => { fetchMyRequests(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/contacts/emergency-request`, { ownerEmail, reason }, { headers: headers() });
            flash('Emergency access request submitted.');
            setOwnerEmail(''); setReason('');
            fetchMyRequests();
        } catch (err) {
            flash(err.response?.data?.msg || 'Error submitting request');
        }
    };

    const statusStyle = (status) => ({
        padding: '2px 10px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        background: status === 'Pending'  ? 'rgba(250,204,21,0.15)'
                  : status === 'Approved' ? 'rgba(74,222,128,0.15)'
                  : 'rgba(248,113,113,0.15)',
        color:      status === 'Pending'  ? '#facc15'
                  : status === 'Approved' ? '#4ade80'
                  : '#f87171',
    });

    return (
        <div className="widget" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Header ── */}
            <div className="widget-header">
                <span>Emergency Access Request</span>
            </div>

            {/* ── Flash message ── */}
            {msg && (
                <div style={{
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid var(--primary)',
                    color: 'var(--text)',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                }}>
                    {msg}
                </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                    type="email"
                    placeholder="Memory Owner's email"
                    value={ownerEmail}
                    onChange={e => setOwnerEmail(e.target.value)}
                    required
                    style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--input-bg, rgba(255,255,255,0.05))',
                        color: 'var(--text)',
                        fontSize: 14,
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}
                />
                <textarea
                    placeholder="Reason for emergency access..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    required
                    rows={3}
                    style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--input-bg, rgba(255,255,255,0.05))',
                        color: 'var(--text)',
                        fontSize: 14,
                        outline: 'none',
                        resize: 'vertical',
                        width: '100%',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: '10px 0',
                        background: 'var(--danger)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                        letterSpacing: 0.3,
                    }}
                >
                    Submit Request
                </button>
            </form>

            {/* ── Divider ── */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                    My Past Requests
                </p>

                {myRequests.length === 0 ? (
                    <p className="text-sm text-muted">No requests yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {myRequests.map(r => (
                            <div key={r._id} style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                padding: '10px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                                        {r.owner?.name}
                                    </span>
                                    <span style={statusStyle(r.status)}>{r.status}</span>
                                </div>
                                <span className="text-sm text-muted">{r.owner?.email}</span>
                                <span className="text-sm" style={{ color: 'var(--text)', marginTop: 2 }}>{r.reason}</span>
                                <span className="text-sm text-muted">{new Date(r.requestDate).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}