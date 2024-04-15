const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');
const moment = require("moment");
require("moment-duration-format");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with the bot'),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId('Bot-helppanel')
                    .setPlaceholder('❌┆Nothing selected')
                    .addOptions([
                        {
                            label: `Commands`,
                            description: `Show the commands of Bot!`,
                            emoji: "💻",
                            value: "commands-Bothelp",
                        }
                    ]),
            );

        return client.embed({
            title: `❓・Help panel`,
            desc: `Welcome to Akemi's bot help panel! We have made a small overview to help you! Make a choice via the menu below`,
            fields: [
                {
                    name: `❌┆Menu doesn't work?`,
                    value: `Try resending the command. If you get no reaction, make sure you report the bug!`
                }
            ],
            components: [row],
            type: 'editreply'
        }, interaction)
    },
};

 