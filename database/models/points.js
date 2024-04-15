const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Points: Number
});

module.exports = mongoose.model("points", Schema);