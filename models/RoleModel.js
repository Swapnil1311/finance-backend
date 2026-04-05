const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Three built-in roles:
 *  - viewer    → read only
 *  - analyst   → read + write (create/update transactions)
 *  - admin     → full access including delete & user management
 */
const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      enum: {
        values: ["viewer", "analyst", "admin"],
        message: "Role must be viewer, analyst, or admin",
      },
      lowercase: true,
      trim: true,
    },

    permissions: {
      type: [String],
      enum: {
        values: ["read", "write", "delete", "manage_users"],
        message: "Invalid permission value",
      },
      default: [],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    // So frontend can easily check permissions: role.can('delete')
    methods: {
      can(permission) {
        return this.permissions.includes(permission);
      },
    },
  }
);

roleSchema.statics.DEFAULT_PERMISSIONS = {
  viewer: ["read"],
  analyst: ["read", "write"],
  admin: ["read", "write", "delete", "manage_users"],
};

module.exports = mongoose.model("Role", roleSchema);
