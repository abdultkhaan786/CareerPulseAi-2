const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        company: {
            type: String,
            required: true,
            trim: true
        },
        location: {
            type: String,
            default: "Remote"
        },
        jobType: {
            type: String,
            enum: ["Full-time", "Part-time", "Internship", "Contract"],
            default: "Full-time"
        },
        experience: {
            type: String,
            default: "Entry Level"
        },
        salary: {
            type: String,
            default: "Not specified"
        },
        skills: {
            type: [String],
            default: []
        },
        description: {
            type: String,
            default: ""
        },
        applyUrl: {
            type: String,
            default: ""
        },
        postedDate: {
            type: Date,
            default: Date.now
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Job", jobSchema);