const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    actorRole: {
      type: String,
      default: null,
      trim: true
    },

    action: {
      type: String,
      required: true,
      trim: true
    },

    entityType: {
      type: String,
      required: true,
      trim: true
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    metadata: {
      ip: {
        type: String,
        default: null
      },
      userAgent: {
        type: String,
        default: null
      },
      route: {
        type: String,
        default: null
      },
      method: {
        type: String,
        default: null
      },
      source: {
        type: String,
        default: "api"
      },
      reason: {
        type: String,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);