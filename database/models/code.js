const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    GeneratedBy: String,
    Code: String,
    GeneratedAt: Date,
    ReedemedBy: String,
    ReedemedAt: Date,
    Notify: Boolean,
    Limit: Number,
    Redeemed: Boolean,
    Admin: Boolean,
    RedeemCount: Number,
    Redeems: Array
});

module.exports = mongoose.model("code", Schema);