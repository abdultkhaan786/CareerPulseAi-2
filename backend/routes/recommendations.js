const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Job = require("../models/Job");

const router = express.Router();

router.get("/:userId", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.userId)) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const jobs = await Job.find();

        const requiredSkills = [];

        jobs.forEach(job => {
            job.skills.forEach(skill => {
                if (!requiredSkills.includes(skill)) {
                    requiredSkills.push(skill);
                }
            });
        });

        const userSkills = user.skills.map(skill => skill.toLowerCase());

        const missingSkills = requiredSkills.filter(
            skill => !userSkills.includes(skill.toLowerCase())
        );

        res.json({
            user: user.name,
            currentSkills: user.skills,
            recommendedSkills: missingSkills
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to generate recommendations",
            error: error.message
        });
    }
});

module.exports = router;