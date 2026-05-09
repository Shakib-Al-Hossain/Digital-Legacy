import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Archive, Plus, FolderOpen, Upload, Trash2, Edit3, X, Activity, User, LogOut, File, ExternalLink, Image, Film } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Vault() {
    const [vaults, setVaults] = useState([]);
    const [selectedVault, setSelectedVault] = useState(null);
    const [memories, setMemories] = useState([]);
    
    // Form Inputs
    const [newVaultName, setNewVaultName] = useState('');
    const [showVaultForm, setShowVaultForm] = useState(false);
    const [showMemoryForm, setShowMemoryForm] = useState(false);
    
    const [memoryData, setMemoryData] = useState({
        title: '',
        description: '',
        category: 'Personal'
    });
    const [memoryFile, setMemoryFile] = useState(null);

    // Edit logic & Delete Modal overrides
    const [editingMemory, setEditingMemory] = useState(null);
    const [editData, setEditData] = useState({ title: '', description: '', category: '' });
    const [memoryToDelete, setMemoryToDelete] = useState(null);
    const [vaultToDelete, setVaultToDelete] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchVaults();
    }, []);

    const fetchVaults = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:5000/api/vault', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setVaults(res.data);
        } catch (err) {
            console.error('Error fetching vaults', err);
        }
    };

    const fetchMemories = async (vaultId) => {
        try {
            const res = await axios.get(`http://127.0.0.1:5000/api/vault/${vaultId}/memories`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setMemories(res.data);
            setSelectedVault(vaults.find(v => v._id === vaultId));
        } catch (err) {
            console.error('Error fetching memories', err);
        }
    };

    const createVault = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://127.0.0.1:5000/api/vault/create', 
                { vaultName: newVaultName }, 
                { headers: { 'x-auth-token': localStorage.getItem('token') } }
            );
            setNewVaultName('');
            setShowVaultForm(false);
            fetchVaults();
        } catch (err) {
            console.error('Error creating vault', err);
        }
    };

    const uploadMemory = async (e) => {
        e.preventDefault();
        if (!selectedVault || !memoryFile) return;

        const formData = new FormData();
        formData.append('file', memoryFile);
        formData.append('vault', selectedVault._id);
        formData.append('title', memoryData.title);
        formData.append('description', memoryData.description);
        formData.append('category', memoryData.category);

        try {
            await axios.post('http://127.0.0.1:5000/api/vault/upload', formData, {
                headers: { 
                    'x-auth-token': localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMemoryData({ title: '', description: '', category: 'Personal' });
            setMemoryFile(null);
            setShowMemoryForm(false);
            fetchMemories(selectedVault._id);
        } catch (err) {
            console.error('Error uploading memory', err);
        }
    };

    const confirmDelete = async () => {
        if (!memoryToDelete) return;
        try {
            await axios.delete(`http://127.0.0.1:5000/api/vault/memory/${memoryToDelete}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            fetchMemories(selectedVault._id);
        } catch (err) {
            console.error('Error deleting memory', err);
        }
        setMemoryToDelete(null);
    };

    const confirmVaultDelete = async () => {
        if (!vaultToDelete) return;
        try {
            await axios.delete(`http://127.0.0.1:5000/api/vault/${vaultToDelete}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            fetchVaults();
        } catch (err) {
            console.error('Error deleting vault', err);
        }
        setVaultToDelete(null);
    };

    const startEditing = (memory) => {
        setEditingMemory(memory._id);
        setEditData({ title: memory.title, description: memory.description, category: memory.category });
    };

    const saveEdit = async (id) => {
        try {
            await axios.put(`http://127.0.0.1:5000/api/vault/memory/${id}`, editData, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setEditingMemory(null);
            fetchMemories(selectedVault._id);
        } catch (err) {
            console.error('Error updating memory', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="dashboard-layout">
            {/* Custom Modal overlay for deletion */}
            {memoryToDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ width: '400px', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--danger)' }}>Warning</h3>
                        <p className="mt-4 mb-4 text-muted">Do you want to delete the content?</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn" style={{ width: '100px', background: 'var(--bg-gradient-1)' }} onClick={() => setMemoryToDelete(null)}>No</button>
                            <button className="btn btn-danger" style={{ width: '100px' }} onClick={confirmDelete}>Yes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Modal overlay for vault deletion */}
            {vaultToDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ width: '400px', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--danger)' }}>Warning</h3>
                        <p className="mt-4 mb-4 text-muted">Do you want to delete this vault and all its contents?</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn" style={{ width: '100px', background: 'var(--bg-gradient-1)' }} onClick={() => setVaultToDelete(null)}>No</button>
                            <button className="btn btn-danger" style={{ width: '100px' }} onClick={confirmVaultDelete}>Yes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reused Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">Digital Legacy</div>
                <ul className="nav-links">
                    <Link to="/dashboard" className="nav-item"><Activity size={20} /> Dashboard</Link>
                    <Link to="/vault" className="nav-item active"><Archive size={20} /> My Vaults</Link>
                    <Link to="/profile" className="nav-item"><User size={20} /> Profile</Link>
                    <li className="nav-item" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={handleLogout}>
                        <LogOut size={20} /> Logout
                    </li>
                </ul>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <h1>Digital Vault & Memory Management</h1>
                <p className="text-muted">Securely manage your legacy assets and memories.</p>

                {!selectedVault ? (
                    <>
                        <div className="flex-between mt-4">
                            <h2>Your Vaults</h2>
                            <button className="btn" style={{ width: 'auto' }} onClick={() => setShowVaultForm(!showVaultForm)}>
                                <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} /> Create Vault
                            </button>
                        </div>

                        {showVaultForm && (
                            <div className="glass-panel mt-4 mb-4" style={{ padding: '1.5rem' }}>
                                <form onSubmit={createVault} className="flex-between" style={{ gap: '1rem' }}>
                                    <div className="profile-input" style={{ flex: 1, border: 'none', background: 'transparent', padding: 0 }}>
                                        <input 
                                            type="text" 
                                            className="profile-input" 
                                            placeholder="Vault Name (e.g., Financial Documents)"
                                            value={newVaultName}
                                            onChange={(e) => setNewVaultName(e.target.value)}
                                            required
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <button type="submit" className="btn" style={{ width: 'auto' }}>Create</button>
                                    <button type="button" className="btn btn-danger" style={{ width: 'auto' }} onClick={() => setShowVaultForm(false)}>Cancel</button>
                                </form>
                            </div>
                        )}

                        <div className="dashboard-grid mt-4">
                            {vaults.map(vault => (
                                <div key={vault._id} className="widget" style={{ cursor: 'pointer' }} onClick={() => fetchMemories(vault._id)}>
                                    <div className="widget-header">
                                        <span>{vault.vaultName}</span>
                                        <Archive size={24} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <p className="text-sm text-muted">Created: {new Date(vault.createdAt).toLocaleDateString()}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button className="btn" style={{ background: 'var(--bg-gradient-1)', color: 'var(--primary)' }} onClick={(e) => { e.stopPropagation(); fetchMemories(vault._id); }}>
                                            <FolderOpen size={16} style={{ display: 'inline', marginRight: '6px' }} /> Open Vault
                                        </button>
                                        <button className="btn btn-danger" style={{ padding: '0.5rem', width: 'auto' }} onClick={(e) => { e.stopPropagation(); setVaultToDelete(vault._id); }}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {vaults.length === 0 && <p className="text-muted">No vaults created yet. Start by creating one!</p>}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex-between mt-4 mb-4">
                            <h2>
                                <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSelectedVault(null)}>Vaults / </span> 
                                {selectedVault.vaultName}
                            </h2>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn" style={{ width: 'auto' }} onClick={() => setShowMemoryForm(!showMemoryForm)}>
                                    <Upload size={16} style={{ display: 'inline', marginRight: '6px' }} /> Upload Content
                                </button>
                                <button className="btn" style={{ width: 'auto', background: 'var(--bg-gradient-1)', color: 'var(--text-main)' }} onClick={() => setSelectedVault(null)}>
                                    Back
                                </button>
                            </div>
                        </div>

                        {showMemoryForm && (
                            <div className="glass-panel mt-4 mb-4">
                                <h3 className="mb-4">Upload New Asset</h3>
                                <form onSubmit={uploadMemory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label>Title</label>
                                        <input type="text" value={memoryData.title} onChange={e => setMemoryData({...memoryData, title: e.target.value})} required className="profile-input" />
                                    </div>
                                    <div className="input-group">
                                        <label>Description</label>
                                        <input type="text" value={memoryData.description} onChange={e => setMemoryData({...memoryData, description: e.target.value})} required className="profile-input" />
                                    </div>
                                    <div className="input-group">
                                        <label>Category</label>
                                        <select 
                                            className="profile-input" 
                                            style={{ width: '100%' }}
                                            value={memoryData.category} 
                                            onChange={e => setMemoryData({...memoryData, category: e.target.value})}
                                        >
                                            <option value="Personal">Personal</option>
                                            <option value="Emotional">Emotional</option>
                                            <option value="Legal">Legal Document</option>
                                            <option value="Financial">Financial Document</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>File Attachment</label>
                                        <input type="file" onChange={e => setMemoryFile(e.target.files[0])} required style={{ border: 'none', background: 'transparent', padding: '0' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="submit" className="btn">Upload Content</button>
                                        <button type="button" className="btn btn-danger" onClick={() => setShowMemoryForm(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="dashboard-grid">
                            {memories.map(memory => (
                                <div key={memory._id} className="widget" style={{ position: 'relative' }}>
                                    
                                    {editingMemory === memory._id ? (
                                        <div className="edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <input className="profile-input" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="Title" />
                                            <input className="profile-input" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} placeholder="Description" />
                                            <select className="profile-input" value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})}>
                                                <option value="Personal">Personal</option>
                                                <option value="Emotional">Emotional</option>
                                                <option value="Legal">Legal Document</option>
                                                <option value="Financial">Financial Document</option>
                                            </select>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button className="btn" onClick={() => saveEdit(memory._id)}>Save</button>
                                                <button className="btn btn-danger" onClick={() => setEditingMemory(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="widget-header">
                                                <span style={{ fontSize: '1.1rem', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {memory.title}
                                                </span>
                                                <span className={`status-badge status-active`}>{memory.category}</span>
                                            </div>
                                            <p className="text-sm mt-2 mb-4">{memory.description}</p>
                                            
                                            {memory.filePath && (
                                                <div className="memory-asset" style={{ background: 'var(--item-bg)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                    {memory.filePath.match(/\.(mp4|mkv|webm)$/i) ? (
                                                        <>
                                                            <Film size={24} style={{ color: 'var(--primary)' }} />
                                                            <a href={`http://127.0.0.1:5000/${memory.filePath.replace('\\', '/')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                See/View Video <ExternalLink size={14} />
                                                            </a>
                                                        </>
                                                    ) : memory.filePath.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                        <>
                                                            <Image size={24} style={{ color: 'var(--primary)' }} />
                                                            <a href={`http://127.0.0.1:5000/${memory.filePath.replace('\\', '/')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                See/View Image <ExternalLink size={14} />
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <File size={24} style={{ color: 'var(--primary)' }} />
                                                            <a href={`http://127.0.0.1:5000/${memory.filePath.replace('\\', '/')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                View Document <ExternalLink size={14} />
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            <div className="text-xs text-muted mt-4">
                                                Version: {memory.version || 1} • Uploaded: {new Date(memory.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="mt-4" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button className="btn" title="Edit" style={{ padding: '0.5rem', width: 'auto', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={() => startEditing(memory)}>
                                                    <Edit3 size={16} />
                                                </button>
                                                <button className="btn btn-danger" title="Delete" style={{ padding: '0.5rem', width: 'auto' }} onClick={() => setMemoryToDelete(memory._id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {memories.length === 0 && <p className="text-muted">No content stored in this vault yet.</p>}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
