const User = require('../model/User');
const Session = require('../model/Session');
const Contact = require('../model/Contact');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        let user = await User.findOne({ email });

        if (user) {
            if (user.isActive) {
                return res.status(400).json({ msg: 'User already exists' });
            } else {
                // If user is deactivated, delete old profile and associated data to allow re-registration
                await Session.deleteMany({ user: user._id });
                await Contact.deleteMany({ user: user._id });
                await User.findByIdAndDelete(user._id);
            }
        }

        user = new User({ email, name, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};

const nodemailer = require('nodemailer');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        if (!user.isActive) return res.status(400).json({ msg: 'Account deactivated' });

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactorSecret = otp;
        await user.save();

        
        try {
            // Configure Nodemailer for Gmail
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: '"Digital Legacy" <no-reply@digitallegacy.com>',
                to: email,
                subject: 'Your Login Verification Code',
                text: `Welcome to Digital Legacy. Your two-factor authentication code is: ${otp}. It will expire shortly.`
            };

            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.error("Non-fatal email send error (Ensure you use console OTP for testing):", mailError.message);
        }

        // Create a temporary token specifically for 2FA verification step
        const payload = { user: { id: user.id } };
        const tempToken = jsonwebtoken.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.json({ requires2FA: true, tempToken, msg: 'Verification code sent to email' });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.setup2FA = async (req, res) => {
    // In an email-based system, "setup" might just be verifying an email. 
    // Since we now inherently send emails on login, this QR setup route is deprecated.
    res.json({ msg: '2FA is now email-based. No QR code needed.' });
};

exports.verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.id);

        if (!user || user.twoFactorSecret !== token) {
            return res.status(400).json({ msg: 'Invalid verification code' });
        }

        // Clear the OTP to prevent reuse
        user.twoFactorSecret = '';
        user.isTwoFactorEnabled = true; // Mark as verified for tracking

        // Track Session Activity
        const newSession = new Session({
            user: user._id,
            ipAddress: req.ip || req.connection.remoteAddress,
            device: req.headers['user-agent']
        });
        await newSession.save();

        // Issue real access token
        const payload = { user: { id: user.id, role: user.role } };
        const authToken = jsonwebtoken.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        await user.save();
        res.json({ token: authToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error("Verify 2FA Error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getSessions = async (req, res) => {
    try {
        const sessions = await Session.find({ user: req.user.id }).sort({ loginTime: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return res.json({ msg: 'If that email exists, a password reset OTP has been sent.' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins expiry
        await user.save();

        console.log(`\n================================`);
        console.log(`[DEV MODE] Forgot Password OTP for ${email}: ${otp}`);
        console.log(`================================\n`);

        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: '"Digital Legacy" <no-reply@digitallegacy.com>',
                to: email,
                subject: 'Password Reset Verification Code',
                text: `Your password reset code is: ${otp}. It will expire in 15 minutes. If you didn't request this, please ignore this email.`
            };

            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.error("Non-fatal email send error:", mailError.message);
        }

        res.json({ msg: 'If that email exists, a password reset OTP has been sent.' });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        // Do not clear the OTP yet, we need it to verify the actual reset request
        res.json({ msg: 'Verification code accepted. Proceed to reset password.' });
    } catch (err) {
        console.error("Verify Reset OTP Error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ msg: 'Password has been reset successfully' });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
};
