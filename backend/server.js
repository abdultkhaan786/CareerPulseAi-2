const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");
const analyticsRoutes = require("./routes/analytics");
const recommendationRoutes = require("./routes/recommendations");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "CareerPulse AI Backend is Running"
    });
});

// Unknown API routes and malformed JSON bodies get JSON errors instead of HTML pages
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        message: err.type === "entity.parse.failed" ? "Request body is not valid JSON" : "Something went wrong on the server",
        error: err.message
    });
});

app.listen(process.env.PORT, () => {
    console.log(`CareerPulse AI server running on port ${process.env.PORT}`);
});