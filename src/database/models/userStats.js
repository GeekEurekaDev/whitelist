const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Invites: Number,
    GeneratedCodes: Number,
    RedeemedCodes: Number,
    Blacklisted: Boolean,
});

module.exports = mongoose.model("userStats", Schema);