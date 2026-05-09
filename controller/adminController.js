const User = require('../model/User');
const Vault = require('../model/Vault');
const Memory = require('../model/Memory');
const Session = require('../model/Session');

exports.getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const memoryOwners = await User.countDocuments({ role: 'Memory Owner' });
        const legacyContacts = await User.countDocuments({ role: 'Legacy Contact' });
        const administrators = await User.countDocuments({ role: 'Administrator' });
        const activeUsers = await User.countDocuments({ isActive: true });
        const totalVaults = await Vault.countDocuments();
        const totalMemories = await Memory.countDocuments();
        const activeSessions = await Session.countDocuments({ status: 'active' });

        const recentUsers = await User.find()
            .select('name email role isActive createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            totalUsers,
            memoryOwners,
            legacyContacts,
            administrators,
            activeUsers,
            totalVaults,
            totalMemories,
            activeSessions,
            recentUsers
        });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to load admin analytics' });
    }
};