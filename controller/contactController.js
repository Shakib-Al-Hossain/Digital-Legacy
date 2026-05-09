// controller/contactController.js
const Contact   = require('../model/Contact');
const AccessLog = require('../model/AccessLog');
const EmergencyAccessRequest = require('../model/EmergencyAccessRequest');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: write one access log entry
// ─────────────────────────────────────────────────────────────────────────────
const log = async (actor, owner, contactId, actionType, details) => {
    try {
        await AccessLog.create({ actor, owner, contact: contactId, actionType, details });
    } catch (e) {
        console.error('AccessLog write failed:', e.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Add / manage legacy contacts  (Memory Owner only)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/contacts  — list all contacts for logged-in owner
exports.getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({ user: req.user.id }).sort({ createdAt: -1 });

        // Flag contacts whose access has expired
        const now = new Date();
        const result = contacts.map(c => ({
            ...c.toObject(),
            isExpired: c.accessExpiresAt && c.accessExpiresAt < now
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// POST /api/contacts  — add a new legacy contact
exports.addContact = async (req, res) => {
    try {
        const { contactEmail, contactName, relationship, accessLevel, accessExpiresAt } = req.body;

        const contact = new Contact({
            user:            req.user.id,
            contactEmail,
            contactName,
            relationship,
            accessLevel:     accessLevel || 'Emergency',
            accessExpiresAt: accessExpiresAt || null,
        });
        await contact.save();

        await log(req.user.id, req.user.id, contact._id, 'CONTACT_ADDED',
            `Added contact ${contactName} (${contactEmail}) with access level ${contact.accessLevel}`);

        res.status(201).json(contact);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// PUT /api/contacts/:id  — update contact details
exports.updateContact = async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.id, user: req.user.id });
        if (!contact) return res.status(404).json({ msg: 'Contact not found' });

        const { contactName, relationship, accessLevel, accessExpiresAt, isTrusted } = req.body;

        const oldLevel = contact.accessLevel;
        contact.contactName     = contactName     ?? contact.contactName;
        contact.relationship    = relationship    ?? contact.relationship;
        contact.accessLevel     = accessLevel     ?? contact.accessLevel;
        contact.accessExpiresAt = accessExpiresAt !== undefined ? accessExpiresAt : contact.accessExpiresAt;
        contact.isTrusted       = isTrusted       !== undefined ? isTrusted       : contact.isTrusted;
        await contact.save();

        const actionType = oldLevel !== contact.accessLevel ? 'PERMISSION_CHANGED' : 'CONTACT_UPDATED';
        await log(req.user.id, req.user.id, contact._id, actionType,
            `Updated contact ${contact.contactName}. Access level: ${oldLevel} → ${contact.accessLevel}`);

        res.json(contact);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// DELETE /api/contacts/:id  — remove a contact
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.id, user: req.user.id });
        if (!contact) return res.status(404).json({ msg: 'Contact not found' });

        await log(req.user.id, req.user.id, contact._id, 'CONTACT_DELETED',
            `Deleted contact ${contact.contactName} (${contact.contactEmail})`);

        await Contact.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Contact removed' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Access Permission Control  (Memory Owner only)
// ─────────────────────────────────────────────────────────────────────────────

// PATCH /api/contacts/:id/permission
exports.updatePermission = async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.id, user: req.user.id });
        if (!contact) return res.status(404).json({ msg: 'Contact not found' });

        const { accessLevel } = req.body;
        if (!['Full', 'Partial', 'Emergency'].includes(accessLevel)) {
            return res.status(400).json({ msg: 'Invalid access level' });
        }

        const old = contact.accessLevel;
        contact.accessLevel = accessLevel;
        await contact.save();

        await log(req.user.id, req.user.id, contact._id, 'PERMISSION_CHANGED',
            `Permission changed for ${contact.contactName}: ${old} → ${accessLevel}`);

        res.json({ msg: 'Permission updated', contact });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Emergency Access Requests
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/contacts/emergency-request  — Legacy Contact submits a request
exports.submitEmergencyRequest = async (req, res) => {
    try {
        const { ownerEmail, reason } = req.body;

        // Find the owner by email
        const User = require('../model/User');
        const owner = await User.findOne({ email: ownerEmail, role: 'Memory Owner' });
        if (!owner) return res.status(404).json({ msg: 'Memory Owner not found with that email' });

        // Prevent duplicate pending requests
        const existing = await EmergencyAccessRequest.findOne({
            requester: req.user.id,
            owner:     owner._id,
            status:    'Pending'
        });
        if (existing) return res.status(400).json({ msg: 'You already have a pending request to this owner' });

        const request = await EmergencyAccessRequest.create({
            requester: req.user.id,
            owner:     owner._id,
            reason,
        });

        await log(req.user.id, owner._id, null, 'EMERGENCY_REQUEST_SUBMITTED',
            `Emergency access requested from owner ${ownerEmail}. Reason: ${reason}`);

        res.status(201).json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// GET /api/contacts/emergency-requests  — Memory Owner sees incoming requests
exports.getEmergencyRequests = async (req, res) => {
    try {
        const requests = await EmergencyAccessRequest
            .find({ owner: req.user.id })
            .populate('requester', 'name email')
            .sort({ requestDate: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// GET /api/contacts/my-emergency-requests  — Legacy Contact sees their own requests
exports.getMyEmergencyRequests = async (req, res) => {
    try {
        const requests = await EmergencyAccessRequest
            .find({ requester: req.user.id })
            .populate('owner', 'name email')
            .sort({ requestDate: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// PATCH /api/contacts/emergency-requests/:id  — Owner approves or denies
exports.resolveEmergencyRequest = async (req, res) => {
    try {
        const { status } = req.body;  // 'Approved' or 'Denied'
        if (!['Approved', 'Denied'].includes(status)) {
            return res.status(400).json({ msg: 'Status must be Approved or Denied' });
        }

        const request = await EmergencyAccessRequest.findOne({
            _id:   req.params.id,
            owner: req.user.id
        });
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        request.status       = status;
        request.resolvedDate = new Date();
        await request.save();

        const actionType = status === 'Approved'
            ? 'EMERGENCY_REQUEST_APPROVED'
            : 'EMERGENCY_REQUEST_DENIED';

        await log(req.user.id, req.user.id, null, actionType,
            `Emergency request ${request._id} ${status.toLowerCase()} by owner`);

        res.json({ msg: `Request ${status.toLowerCase()}`, request });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Access History Log  — read-only
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/contacts/access-logs  — Memory Owner sees all logs related to them
exports.getAccessLogs = async (req, res) => {
    try {
        const logs = await AccessLog
            .find({ $or: [{ actor: req.user.id }, { owner: req.user.id }] })
            .populate('actor', 'name email')
            .populate('contact', 'contactName contactEmail')
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};