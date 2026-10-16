// Adds sample job listings so the dashboard has data to show.
//   npm run seed          -> inserts samples only if there are no jobs yet
//   npm run seed -- --fresh -> deletes ALL jobs first, then inserts samples
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Job = require("./models/Job");

dotenv.config();

const days = n => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const jobs = [
    { title: "Frontend Developer", company: "Zentrix Labs", location: "Bengaluru", jobType: "Full-time", experience: "Entry Level", salary: "₹6–9 LPA", skills: ["JavaScript", "React", "HTML", "CSS", "Git"], description: "Build and ship UI features for a SaaS analytics product.", applyUrl: "https://example.com/apply/frontend", postedDate: days(1) },
    { title: "MERN Stack Developer", company: "Codeleaf", location: "Remote", jobType: "Full-time", experience: "Mid Level", salary: "₹10–14 LPA", skills: ["MongoDB", "Express", "React", "Node.js", "JavaScript", "REST APIs"], description: "Own features end to end across a React frontend and Node/Express services.", applyUrl: "https://example.com/apply/mern", postedDate: days(2) },
    { title: "Backend Developer (Node.js)", company: "Paysutra", location: "Pune", jobType: "Full-time", experience: "Mid Level", salary: "₹12–16 LPA", skills: ["Node.js", "Express", "MongoDB", "REST APIs", "Docker", "AWS"], description: "Design payment APIs that handle millions of requests a day.", postedDate: days(3) },
    { title: "Data Analyst Intern", company: "InsightGrid", location: "Hyderabad", jobType: "Internship", experience: "Entry Level", salary: "₹25,000 / month", skills: ["SQL", "Python", "Excel", "Power BI"], description: "Turn raw sales data into weekly dashboards for the leadership team.", postedDate: days(1) },
    { title: "Machine Learning Engineer", company: "NeuroNest AI", location: "Bengaluru", jobType: "Full-time", experience: "Senior Level", salary: "₹25–35 LPA", skills: ["Python", "TensorFlow", "PyTorch", "SQL", "Docker", "AWS"], description: "Train and deploy recommendation models in production.", postedDate: days(5) },
    { title: "Full Stack Developer", company: "Brightcart", location: "Chennai", jobType: "Full-time", experience: "Entry Level", salary: "₹7–10 LPA", skills: ["JavaScript", "React", "Node.js", "SQL", "Git"], description: "Work across our e-commerce storefront and admin tools.", postedDate: days(4) },
    { title: "React Native Developer", company: "Mobilio", location: "Remote", jobType: "Contract", experience: "Mid Level", salary: "₹1.2L / month", skills: ["React Native", "JavaScript", "TypeScript", "REST APIs"], description: "6-month contract to rebuild a fitness app.", postedDate: days(6) },
    { title: "DevOps Engineer", company: "CloudKraft", location: "Noida", jobType: "Full-time", experience: "Mid Level", salary: "₹14–20 LPA", skills: ["AWS", "Docker", "Kubernetes", "Linux", "Git"], description: "Run CI/CD and infrastructure for 40+ microservices.", postedDate: days(7) },
    { title: "Python Developer Intern", company: "Edutrack", location: "Remote", jobType: "Internship", experience: "Entry Level", salary: "₹15,000 / month", skills: ["Python", "Django", "SQL", "Git"], description: "Help build our learning-management backend.", postedDate: days(2) },
    { title: "UI Developer (Part-time)", company: "Studio Kaya", location: "Mumbai", jobType: "Part-time", experience: "Entry Level", salary: "₹30,000 / month", skills: ["HTML", "CSS", "JavaScript", "Figma"], description: "20 hours a week turning designs into accessible pages.", postedDate: days(8) },
    { title: "Software Engineer – TypeScript", company: "Ledgerly", location: "Bengaluru", jobType: "Full-time", experience: "Mid Level", salary: "₹15–22 LPA", skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"], description: "Build accounting workflows used by 20k small businesses.", postedDate: days(3) },
    { title: "Java Backend Engineer", company: "FinEdge", location: "Gurugram", jobType: "Full-time", experience: "Senior Level", salary: "₹22–30 LPA", skills: ["Java", "Spring Boot", "SQL", "Microservices", "Docker"], description: "Scale lending services across three regions.", postedDate: days(9) }
];

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const fresh = process.argv.includes("--fresh");

        if (fresh) {
            const { deletedCount } = await Job.deleteMany({});
            console.log(`Removed ${deletedCount} existing jobs`);
        } else if (await Job.countDocuments()) {
            console.log("Jobs already exist, nothing inserted. Use `npm run seed -- --fresh` to replace them.");
            return;
        }

        await Job.insertMany(jobs);
        console.log(`Inserted ${jobs.length} sample jobs`);
    } catch (error) {
        console.error("Seeding failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
