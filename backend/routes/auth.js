const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { EMAIL_RE, cleanSkills } = require("../utils/validation");

const router = express.Router();

const publicUser = (user, isAdmin = false) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    skills: user.skills,
    education: user.education,
    experience: user.experience,
    preferredRole: user.preferredRole,
    isAdmin,
    createdAt: user.createdAt
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (!EMAIL_RE.test(String(email).trim())) {
            return res.status(400).json({ message: "Enter a valid email address" });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email: String(email).trim().toLowerCase() });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: String(email).trim().toLowerCase() });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                skills: user.skills,
                preferredRole: user.preferredRole
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

// Current user's full profile
router.get("/me", requireAuth, (req, res) => {
    res.json({ user: publicUser(req.user, req.isAdmin) });
});

// Update name, skills, education, experience, preferredRole
router.put("/profile", requireAuth, async (req, res) => {
    try {
        const { name, skills, education, experience, preferredRole } = req.body;
        const user = await User.findById(req.user._id);

        if (name !== undefined) {
            if (!String(name).trim()) {
                return res.status(400).json({ message: "Name can't be empty" });
            }
            user.name = String(name).trim().slice(0, 80);
        }
        if (skills !== undefined) {
            if (!Array.isArray(skills)) {
                return res.status(400).json({ message: "Skills must be a list" });
            }
            user.skills = cleanSkills(skills);
        }
        if (education !== undefined) user.education = String(education).trim().slice(0, 120);
        if (preferredRole !== undefined) user.preferredRole = String(preferredRole).trim().slice(0, 80);
        if (experience !== undefined) {
            const years = Number(experience);
            if (!Number.isFinite(years) || years < 0 || years > 60) {
                return res.status(400).json({ message: "Experience must be between 0 and 60 years" });
            }
            user.experience = years;
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: publicUser(user, req.isAdmin)
        });
    } catch (error) {
        res.status(500).json({
            message: "Profile update failed",
            error: error.message
        });
    }
});

// Change password (requires the current one)
router.put("/password", requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }
        if (String(newPassword).length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Password change failed",
            error: error.message
        });
    }
});

module.exports = router;
