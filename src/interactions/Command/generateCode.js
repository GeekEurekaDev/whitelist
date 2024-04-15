const { CommandInteraction, Client, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');
const axios = require('axios');
const moment = require('moment-timezone');
const crypto = require('crypto');
const userStats = require('../../database/models/userStats');
const code = require('../../database/models/code');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatecode')
        .setDescription('Generate a code.'),
    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true });
        
        const levels = ['1229133603217211544', '1229133625187111013', '1229133624348115014', '1229133652756004987', '1229133668706943006']
        
        let userLevel = 0;

        for (let i = 0; i < levels.length; i++) {
            if (interaction.member.roles.cache.has(levels[i])) {
                userLevel = i + 1;
                break;
            }
        }

        const userStatsData = await userStats.findOne({ User: interaction.user.id });

        if (userStatsData && userStatsData.Blacklisted) {
            return interaction.followUp({ content: 'You are blacklisted and cannot generate a code.', ephemeral: true });
        }

        if (userLevel < 2) {
            return interaction.followUp({ content: 'You must be level 2 or higher to generate a code.' , ephemeral: true});
        }
    
        const unclaimedCode = await code.findOne({ GeneratedBy: interaction.user.id, Redeemed: false });
        if (unclaimedCode) {
            return interaction.followUp({ content: 'You have an unclaimed code. You cannot generate a new one until it is claimed.' , ephemeral: true});
        }
    
        const levelLimits = [0, 0, 5, 10, 15, 20];
        const generatedCodes = await code.countDocuments({ GeneratedBy: interaction.user.id });
        if (generatedCodes >= levelLimits[userLevel]) {
            return interaction.followUp({ content: `You have reached your code generation limit for level ${userLevel}.`, ephemeral: true });
        }

        const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
            .setCustomId('notify_yes')
                .setLabel('Yes')
                .setStyle(1),
        )
        .addComponents(
            new Discord.ButtonBuilder()
            .setCustomId('notify_no')
                .setLabel('No')
                .setStyle(4),
        );

    const embed = new Discord.EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Code Generation')
        .setDescription('Do you want to be notified when your code is claimed?');
    
    await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });

    // Generate a unique code
    const uniqueCodePart1 = crypto.randomBytes(3).toString('base64').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const uniqueCodePart2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const uniqueCode = `${uniqueCodePart1}-${uniqueCodePart2}`;

    // Get the limit for the user's level
    const limit = levelLimits[userLevel];

    // Save the code to the database
    const newCode = new code({
        Guild: interaction.guild.id,
        Code: uniqueCode,
        GeneratedAt: new Date(),
        ReedeemedBy: '',
        ReedemedAt: null,
        Notify: false, // Set to false initially
        Limit: limit,
        GeneratedBy: interaction.user.id,
        Redeemed: false
    });
    await newCode.save();

   // Listen for interactionCreate event
   client.on('interactionCreate', async (buttonInteraction) => {
            if (!buttonInteraction.isButton()) return;
            if (buttonInteraction.user.id !== interaction.user.id) return; 

            if (buttonInteraction.customId === 'notify_yes') {
                await buttonInteraction.deferReply({ ephemeral: true });

                newCode.Notify = true;
                await newCode.save();

                const embed = new Discord.EmbedBuilder()
                    .setTitle('This code is valid for a single use only!')
                    .setDescription(`You have ${levelLimits[userLevel] - generatedCodes - 1} code generations remaining. Once redeemed, you will be able to generate a new code.`)
                    .setColor(12746)
                    .addFields([{ name: 'Your one-time referral code:', value: `\`${uniqueCode}\`` }])
                    .setFooter({text: 'If you need help please read <#1228470295401201686>'});

                await buttonInteraction.editReply({ embeds: [embed] });
        
            } else if (buttonInteraction.customId === 'notify_no') {
                await buttonInteraction.deferReply({ ephemeral: true });

                newCode.Notify = false;
                await newCode.save();

                const embed = new Discord.EmbedBuilder()
                    .setTitle('This code is valid for a single use only!')
                    .setDescription(`You have ${levelLimits[userLevel] - generatedCodes - 1} code generations remaining. Once redeemed, you will be able to generate a new code.`)
                    .setColor(12746)
                    .addFields([{ name: 'Your one-time referral code:', value: `\`${uniqueCode}\`` }])
                    .setFooter({text: 'If you need help please read <#1228470295401201686>'});

                await buttonInteraction.editReply({ embeds: [embed] });
            }
        });

        // If the user doesn't have stats yet, create a new document
        if (!userStatsData) {
            const newUserStats = new userStats({
                Guild: interaction.guild.id,
                User: interaction.user.id,
                GeneratedCodes: 1,
                RedeemedCodes: 0,
                Blacklisted: false
            });
            await newUserStats.save();
        } else {
            // Update the necessary fields
            userStatsData.GeneratedCodes += 1;
    
            // Save the updated stats back to the database
            await userStatsData.save();
        }
    }
};