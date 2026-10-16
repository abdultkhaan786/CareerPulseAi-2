const express = require("express");
const Job = require("../models/Job");

const router = express.Router();

router.get("/skills", async (req, res) => {
    try {
        const result = await Job.aggregate([
            { $unwind: "$skills" },
            {
                $group: {
                    _id: "$skills",
                    demand: { $sum: 1 }
                }
            },
            { $sort: { demand: -1 } }
        ]);

        const skills = result.map(item => ({
            skill: item._id,
            demand: item.demand
        }));

        res.json({
            count: skills.length,
            skills
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch skill analytics",
            error: error.message
        });
    }
});

module.exports = router;