import userModel from "../models/user.model.js";

export async function getMe(req, res) {
    const user = await userModel.findById(req.auth.userId).select("username email role");

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
        message: "User fetched successfully",
        user: {
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
}

export async function updateMe(req, res) {
    const updates = req.body;
    const allowedFields = ["username", "email"];

    if (
        !updates ||
        typeof updates !== "object" ||
        Array.isArray(updates) ||
        Object.keys(updates).length === 0 ||
        Object.keys(updates).some((field) => !allowedFields.includes(field))
    ) {
        return res.status(400).json({
            message: "Provide username and/or email to update"
        });
    }

    for (const field of Object.keys(updates)) {
        if (typeof updates[field] !== "string" || !updates[field].trim()) {
            return res.status(400).json({
                message: `${field} must be a non-empty string`
            });
        }
    }

    if (
        updates.email !== undefined &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email.trim())
    ) {
        return res.status(400).json({ message: "Email address is invalid" });
    }

    const user = await userModel.findById(req.auth.userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    for (const field of Object.keys(updates)) {
        user[field] = updates[field].trim();
    }

    try {
        await user.save();
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Username or email is already in use"
            });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        throw error;
    }

    return res.status(200).json({
        message: "Profile updated successfully",
        user: {
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
}
