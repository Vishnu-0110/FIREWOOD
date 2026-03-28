const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user, action, module, metadata = {} }) => {
  try {
    await AuditLog.create({ user, action, module, metadata });
  } catch (error) {
    const reason = error?.message || 'Unknown audit log error';
    console.warn(`[AUDIT] Failed to persist action=${action} module=${module} user=${user || 'unknown'} reason=${reason}`);
  }
};

module.exports = { logAudit };
