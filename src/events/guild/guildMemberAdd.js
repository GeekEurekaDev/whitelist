const discord = require('discord.js');

const roleSchema = require("../../database/models/joinRole");
const points = require('../../database/models/points');
const pointsMemberAdd = require('../../database/models/pointsMemberAdd');
const { Collection } = require('discord.js');
// Create a Map to store the guild's invites
const invites = new Collection();

module.exports = async (client, member) => {
   
};