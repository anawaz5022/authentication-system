import userModel from "../models/user.model.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SKIP = 2_147_483_647;

function parsePositiveInteger(value, fallback) {
    if (value === undefined) {
        return fallback;
    }

    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        return null;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function listUsers(req, res) {
    const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE);
    const requestedLimit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT);

    if (page === null || requestedLimit === null) {
        return res.status(400).json({
            message: "Page and limit must be positive integers"
        });
    }

    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip) || skip > MAX_SKIP) {
        return res.status(400).json({ message: "Page is too large" });
    }

    const [users, total] = await Promise.all([
        userModel.find()
            .select("username email role")
            .sort({ _id: 1 })
            .skip(skip)
            .limit(limit),
        userModel.countDocuments()
    ]);

    return res.status(200).json({
        users: users.map(({ username, email, role }) => ({
            username,
            email,
            role
        })),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
}
