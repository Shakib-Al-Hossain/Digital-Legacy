module.exports = function roleAuth(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ msg: 'Unauthorized: user role missing' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied: insufficient role permission' });
        }

        next();
    };
};