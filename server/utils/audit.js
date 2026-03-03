const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user, action, module, metadata = {} }) => {
  try {
    await AuditLog.create({ user, action, module, metadata });
  } catch (error) {
    // Avoid blocking primary operation due to logging issues.
  }
};

module.exports = { logAudit };