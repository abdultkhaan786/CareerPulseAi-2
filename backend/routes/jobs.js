const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const { requireAuth } = require("../middleware/auth");
const { escapeRegex, cleanSkills } = require("../utils/validation");

const router = express.Router();

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
const EDITABLE = ["title", "company", "location", "jobType", "experience", "salary", "skills", "description", "applyUrl"];

const SORTS = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    title: { title: 1 },
    company: { company: 1 }
};

// Picks allowed fields from the body and validates them. Returns { data } or { error }.
function parseJobInput(body, { partial = false } = {}) {
    const data = {};

    for (const key of EDITABLE) {
        if (body[key] === undefined) continue;
        data[key] = key === "skills" ? cleanSkills(body[key]) : String(body[key]).trim();
    }

    if (!partial || data.title !== undefined) {
        if (!data.title) return { error: "Job title is required" };
    }
    if (!partial || data.company !== undefined) {
        if (!data.company) return { error: "Company is required" };
    }
    if (data.jobType !== undefined && !JOB_TYPES.includes(data.jobType)) {
        return { error: `Job type must be one of: ${JOB_TYPES.join(", ")}` };
    }
    if (data.applyUrl && !/^https?:\/\/\S+$/i.test(data.applyUrl)) {
        return { error: "Application link must start with http:// or https://" };
    }
    if (data.salary === "") data.salary = "Not specified";
    if (data.location === "") data.location = "Remote";

    return { data };
}

const canManage = (req, job) =>
    req.isAdmin || (job.postedBy && String(job.postedBy) === String(req.user._id));

router.post("/", requireAuth, async (req, res) => {
    try {
        const { data, error } = parseJobInput(req.body);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const job = await Job.create({ ...data, postedBy: req.user._id });

        res.status(201).json({
            message: "Job created successfully",
            job
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create job",
            error: error.message
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });

        res.json({
            count: jobs.length,
            jobs
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch jobs",
            error: error.message
        });
    }
});

// Optional query: title, skill, location, jobType, experience, sort, page, limit.
// Without `page` every match is returned, as before.
router.get("/search", async (req, res) => {
    try {
        const { skill, location, title, jobType, experience, sort } = req.query;

        const filter = {};

        if (skill) {
            filter.skills = {
                $regex: escapeRegex(skill),
                $options: "i"
            };
        }

        if (location) {
            filter.location = {
                $regex: escapeRegex(location),
                $options: "i"
            };
        }

        if (title) {
            filter.title = {
                $regex: escapeRegex(title),
                $options: "i"
            };
        }

        if (jobType && JOB_TYPES.includes(jobType)) filter.jobType = jobType;
        if (experience) filter.experience = String(experience);

        const total = await Job.countDocuments(filter);
        let query = Job.find(filter).sort(SORTS[sort] || SORTS.newest);

        let page = 1;
        let limit = total;
        if (req.query.page !== undefined) {
            limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
            page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            query = query.skip((page - 1) * limit).limit(limit);
        }

        const jobs = await query;

        res.json({
            count: jobs.length,
            total,
            page,
            pages: limit ? Math.max(Math.ceil(total / limit), 1) : 1,
            jobs
        });
    } catch (error) {
        res.status(500).json({
            message: "Search failed",
            error: error.message
        });
    }
});

// Routes with :id come after /search so "search" isn't treated as an id
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Job not found" });
        }

        const job = await Job.findById(req.params.id).populate("postedBy", "name");

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.json({ job });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch job",
            error: error.message
        });
    }
});

router.put("/:id", requireAuth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Job not found" });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        if (!canManage(req, job)) {
            return res.status(403).json({ message: "You can only edit jobs you posted" });
        }

        const { data, error } = parseJobInput(req.body, { partial: true });

        if (error) {
            return res.status(400).json({ message: error });
        }

        Object.assign(job, data);
        await job.save();

        res.json({
            message: "Job updated successfully",
            job
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update job",
            error: error.message
        });
    }
});

router.delete("/:id", requireAuth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Job not found" });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        if (!canManage(req, job)) {
            return res.status(403).json({ message: "You can only delete jobs you posted" });
        }

        await Job.deleteOne({ _id: job._id });

        res.json({ message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete job",
            error: error.message
        });
    }
});

module.exports = router;
