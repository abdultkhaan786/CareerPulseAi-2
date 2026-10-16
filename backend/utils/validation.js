const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Trim, drop empties and de-duplicate case-insensitively (keeps the first spelling)
const cleanSkills = skills => {
    if (!Array.isArray(skills)) return [];
    const seen = new Set();
    return skills
        .map(s => String(s).trim())
        .filter(s => s && s.length <= 40 && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
        .slice(0, 50);
};

module.exports = { EMAIL_RE, escapeRegex, cleanSkills };
