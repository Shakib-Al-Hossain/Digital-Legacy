import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login({ title = 'Welcome to Digital Legacy', expectedRole = null }) {
    const [isLogin, setIsLogin] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter otp, 3 = enter new password
    const [forgotOtp, setForgotOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [show2FA, setShow2FA] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [tempToken, setTempToken] = useState('');

    const navigate = useNavigate();


    const handleAuth = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        try {
            if (isLogin) {
                const reqBody = { email, password };
                if (expectedRole) reqBody.expectedRole = expectedRole;
                const res = await axios.post('http://127.0.0.1:5000/api/auth/login', reqBody);
                if (res.data.requires2FA) {
                    setTempToken(res.data.tempToken);
                    setShow2FA(true);
                } else {
                    localStorage.setItem('token', res.data.token);
                    navigate('/dashboard');
                }
            } else {
                if (password !== confirmPassword) {
                    return setErrorMsg("Passwords do not match");
                }
                await axios.post('http://127.0.0.1:5000/api/auth/register', { name, email, password });
                setSuccessMsg('Account created successfully! Please sign in.');
                setIsLogin(true); // Switch to login screen
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Error signing in');
        }
    };

    const handle2FAVerify = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/auth/2fa/verify',
                { token: twoFactorToken },
                { headers: { 'x-auth-token': tempToken } }
            );
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'Administrator') {
                navigate('/admin-dashboard');
            } else if (res.data.user.role === 'Legacy Contact') {
                navigate('/legacy-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Invalid verification code');
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await axios.post('http://127.0.0.1:5000/api/auth/forgot-password', { email });
            setSuccessMsg('If that email exists, an OTP has been sent. Please check your inbox.');
            setForgotStep(2);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Error sending password reset email');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            await axios.post('http://127.0.0.1:5000/api/auth/verify-reset-otp', { email, otp: forgotOtp });
            setForgotStep(3);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Invalid or expired OTP');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        if (newPassword !== confirmPassword) {
            return setErrorMsg("Passwords do not match");
        }
        try {
            await axios.post('http://127.0.0.1:5000/api/auth/reset-password', {
                email,
                otp: forgotOtp,
                newPassword
            });
            setSuccessMsg('Password reset successfully! Please log in with your new password.');
            setIsForgotPassword(false);
            setForgotStep(1);
            setForgotOtp('');
            setNewPassword('');
            setConfirmPassword('');
            setPassword('');
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Invalid or expired OTP');
        }
    };

    return (
        <div className="auth-container">
            {errorMsg && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ width: '400px', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--danger)' }}>Access Denied</h3>
                        <p className="mt-4 mb-4 text-muted">{errorMsg}</p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button className="btn" style={{ width: '100px', background: 'var(--bg-gradient-1)' }} onClick={() => setErrorMsg('')}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            
            {successMsg && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ width: '400px', textAlign: 'center' }}>
                        <h3 style={{ color: '#10b981' }}>Success</h3>
                        <p className="mt-4 mb-4 text-muted">{successMsg}</p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button className="btn" style={{ width: '100px', background: 'var(--bg-gradient-1)' }} onClick={() => setSuccessMsg('')}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-panel auth-box">
                {isForgotPassword ? (
                    <div>
                        <h2>Reset Password</h2>
                        {forgotStep === 1 && (
                            <form onSubmit={handleForgotPassword}>
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
                                </div>
                                <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Send Verification Code</button>
                                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => { setIsForgotPassword(false); setForgotStep(1); }}>
                                        Back to Login
                                    </span>
                                </p>
                            </form>
                        )}
                        {forgotStep === 2 && (
                            <form onSubmit={handleVerifyOtp}>
                                <p className="text-sm text-muted mb-4 text-center">Enter the code sent to your email.</p>
                                <div className="input-group">
                                    <label>Verification Code</label>
                                    <input type="text" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} placeholder="123456" required />
                                </div>
                                <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Verify Code</button>
                            </form>
                        )}
                        {forgotStep === 3 && (
                            <form onSubmit={handleResetPassword}>
                                <p className="text-sm text-muted mb-4 text-center">Set your new password.</p>
                                <div className="input-group" style={{ position: 'relative' }}>
                                    <label>New Password</label>
                                    <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required />
                                    <span
                                        style={{ position: 'absolute', right: '10px', top: '38px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </span>
                                </div>
                                <div className="input-group">
                                    <label>Confirm Password</label>
                                    <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                                </div>
                                <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Reset Password</button>
                            </form>
                        )}
                    </div>
                ) : show2FA ? (
                    <div>
                        <h2>Email Verification</h2>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <p className="text-sm text-muted mt-4">We've sent a 6-digit code to <strong>{email}</strong>.</p>
                        </div>
                        <form onSubmit={handle2FAVerify}>
                            <div className="input-group">
                                <label>Enter verification code</label>
                                <input
                                    type="text"
                                    value={twoFactorToken}
                                    onChange={(e) => setTwoFactorToken(e.target.value)}
                                    placeholder="123456"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn">Verify Code</button>
                        </form>
                    </div>
                ) : (
                    <div>
                        <h2 style={isLogin ? { marginBottom: '0.25rem' } : {}}>{isLogin ? 'Welcome to Digital Legacy' : 'Create Account'}</h2>
                        {isLogin && <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem', fontWeight: 500 }}>{title}</p>}
                        <form onSubmit={handleAuth}>
                            {!isLogin && (
                                <div className="input-group">
                                    <label>Full Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                                </div>
                            )}
                            <div className="input-group">
                                <label>Email Address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
                            </div>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <label>Password</label>
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                                <span
                                    style={{ position: 'absolute', right: '10px', top: '38px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </span>
                            </div>

                            {!isLogin && (
                                <div className="input-group">
                                    <label>Confirm Password</label>
                                    <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                                </div>
                            )}

                            {isLogin && (
                                <div style={{ textAlign: 'right', marginTop: '0.5rem', marginBottom: '1rem' }}>
                                    <span
                                        style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}
                                        onClick={() => setIsForgotPassword(true)}
                                    >
                                        Forgot Password?
                                    </span>
                                </div>
                            )}

                            <button type="submit" className="btn" style={{ marginTop: isLogin ? '0' : '1rem' }}>{isLogin ? 'Sign In' : 'Sign Up'}</button>
                        </form>
                        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span
                                style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
