const dns = require("dns");
const mongoose = require("mongoose");

// Some Wi-Fi/ISP DNS servers can't answer the lookup that "mongodb+srv://" needs.
// Use Google and Cloudflare DNS for this app instead.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection failed");
        console.log(error.message);
        process.exit(1);
    }
};

module.exports = connectDB;