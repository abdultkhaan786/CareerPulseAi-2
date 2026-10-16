const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Comma-separated list in .env, e.g. ADMIN_EMAILS=you@example.com,other@example.com
const adminEmails = () =>
    (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);

const isAdmin = user => Boolean(user && adminEmails().includes(user.email));

// Requires "Authorization: Bearer <token>"; sets req.user (without password)
async function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Please log in to continue" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Your account no longer exists" });
        }

        req.user = user;
        req.isAdmin = isAdmin(user);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Your session has expired. Please log in again" });
    }
}

module.exports = { requireAuth, isAdmin };
