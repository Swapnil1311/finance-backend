/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Usage:
 *   router.delete('/:id', protect, requirePermission('delete'), controller)
 *   router.get('/', protect, requireRole('admin', 'analyst'), controller)
 */

/**
 * requirePermission — checks if logged-in user's role has the given permission
 * @param {string} permission - 'read' | 'write' | 'delete' | 'manage_users'
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    // req.user is attached by the protect middleware
    const role = req.user?.role;

    if (!role) {
      return res.status(403).json({
        message: "No role assigned to this user. Contact admin.",
        flag: -1,
      });
    }

    if (!role.permissions.includes(permission)) {
      return res.status(403).json({
        message: `Access denied. Your role '${role.name}' does not have '${permission}' permission.`,
        flag: -1,
        requiredPermission: permission,
        yourPermissions: role.permissions,
      });
    }

    next();
  };
};

/**
 * requireRole — restricts access to specific role(s) by name
 * @param {...string} roles - e.g. 'admin' or 'admin', 'analyst'
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.name;

    if (!userRole) {
      return res.status(403).json({
        message: "No role assigned to this user.",
        flag: -1,
      });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${userRole}.`,
        flag: -1,
      });
    }

    next();
  };
};

/**
 * isOwnerOrAdmin — allows access if user owns the resource OR is admin
 * Useful for "edit your own transaction" type rules
 * @param {string} resourceUserField - field on req that holds the creator's userId
 */
const isOwnerOrAdmin = (getCreatorId) => {
  return async (req, res, next) => {
    try {
      const creatorId = await getCreatorId(req);
      const isAdmin = req.user?.role?.name === "admin";
      const isOwner = creatorId?.toString() === req.user?._id?.toString();

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          message: "Access denied. You can only modify your own records.",
          flag: -1,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Authorization check failed",
        flag: -1,
        error: error.message,
      });
    }
  };
};

module.exports = { requirePermission, requireRole, isOwnerOrAdmin };
