import userModel from "../models/user.model.js";

export function requireRole(...allowedRoles) {
    return async function authorizeRole(req, res, next) {
        if (!req.auth?.userId) {
            return res.status(401).json({ message: "Authentication is required" });
        }

        const user = await userModel.findById(req.auth.userId).select("role");

        if (!user) {
            return res.status(401).json({ message: "Authenticated user no longer exists" });
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: "You do not have permission to access this resource" });
        }

        return next();
    };
}
