const AuditLog = require("../models/Audit");

async function createAuditLog({
  req,
  action,
  entityType,
  entityId = null,
  before = null,
  after = null,
  source = "api",
  reason = null
}) {
  try {
    await AuditLog.create({
      actorId: req.user?._id || null,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.role || null,

      action,
      entityType,
      entityId,

      before,
      after,

      metadata: {
        ip: req.ip || null,
        userAgent: req.get("user-agent") || null,
        route: req.originalUrl || null,
        method: req.method || null,
        source,
        reason
      }
    });
  } catch (error) {
    console.error("createAuditLog error:", error.message);
  }
}

module.exports = createAuditLog;