import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";

export async function authenticate(req, res, next) {
    const authorization = req.get("Authorization");
    const [scheme, token, ...extra] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token || extra.length > 0) {
        return res.status(401).json({ message: "A valid access token is required" });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, config.JWT_SECRET);
    } catch {
        return res.status(401).json({ message: "Invalid or expired access token" });
    }

    if (
        typeof decoded !== "object" ||
        decoded === null ||
        typeof decoded.id !== "string" ||
        typeof decoded.sessionId !== "string"
    ) {
        return res.status(401).json({ message: "Invalid access token" });
    }

    const session = await sessionModel.findOne({
        _id: decoded.sessionId,
        user: decoded.id,
        revoked: false
    });

    if (!session) {
        return res.status(401).json({ message: "Session is invalid or revoked" });
    }

    req.auth = { userId: decoded.id };
    next();
}
