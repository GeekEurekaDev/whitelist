const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Inviter: String,
    TimeJoined: Date,
});

module.exports = mongoose.model("pointsMemberAdd", Schema);