const Discord = require('discord.js');
const fs = require('fs');

const { Manager } = require("erela.js");
const Spotify = require("erela.js-spotify");
const Facebook = require("erela.js-facebook");
const Deezer = require("erela.js-deezer");
const AppleMusic = require("erela.js-apple");

// Discord client
const client = new Discord.Client({
    allowedMentions: {
        parse: [
            'users',
            'roles'
        ],
        repliedUser: true
    },
    autoReconnect: true,
    disabledEvents: [
        "TYPING_START"
    ],
    partials: [
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.Message,
        Discord.Partials.Reaction,
        Discord.Partials.User,
        Discord.Partials.GuildScheduledEvent
    ],
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildBans,
        Discord.GatewayIntentBits.GuildEmojisAndStickers,
        Discord.GatewayIntentBits.GuildIntegrations,
        Discord.GatewayIntentBits.GuildWebhooks,
        Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.GuildMessageTyping,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.DirectMessageReactions,
        Discord.GatewayIntentBits.DirectMessageTyping,
        Discord.GatewayIntentBits.GuildScheduledEvents,
        Discord.GatewayIntentBits.MessageContent
    ],
    restTimeOffset: 0
});


const clientID = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
if (clientID && clientSecret) {
    // Lavalink client
    client.player = new Manager({
        plugins: [
            new AppleMusic(),
            new Deezer(),
            new Facebook(),
            new Spotify({
                clientID,
                clientSecret,
            })
        ],
        nodes: [
            {
                host: process.env.LAVALINK_HOST || "lava.link",
                port: parseInt(process.env.LAVALINK_PORT) || 80,
                password: process.env.LAVALINK_PASSWORD || "CorwinDev",
                secure: Boolean(process.env.LAVALINK_SECURE) || false
            },
            {
                host: "lavalink.techpoint.world",
                port: 80,
                password: "techpoint"
            },
        ],
        send(id, payload) {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        },
    })

} else {
    // Lavalink client
    client.player = new Manager({
        plugins: [
            new AppleMusic(),
            new Deezer(),
            new Facebook(),
        ],
        nodes: [
            {
                host: process.env.LAVALINK_HOST || "lava.link",
                port: parseInt(process.env.LAVALINK_PORT) || 80,
                password: process.env.LAVALINK_PASSWORD || "CorwinDev",
                secure: Boolean(process.env.LAVALINK_SECURE) || false
            },
        ],
        send(id, payload) {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        }
    })
}

// Connect to database
require("./database/connect")();

// Client settings
client.config = require('./config/bot');
client.changelogs = require('./config/changelogs');
client.emotes = require("./config/emojis.json");
client.webhooks = require("./config/webhooks.json");
const webHooksArray = ['startLogs', 'shardLogs', 'errorLogs', 'dmLogs', 'voiceLogs', 'serverLogs', 'serverLogs2', 'commandLogs', 'consoleLogs', 'warnLogs', 'voiceErrorLogs', 'creditLogs', 'evalLogs', 'interactionLogs'];
// Check if .env webhook_id and webhook_token are set
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    for (const webhookName of webHooksArray) {
        client.webhooks[webhookName].id = process.env.WEBHOOK_ID;
        client.webhooks[webhookName].token = process.env.WEBHOOK_TOKEN;
    }
}

client.commands = new Discord.Collection();
client.playerManager = new Map();
client.triviaManager = new Map();
client.queue = new Map();

// Webhooks
const consoleLogs = new Discord.WebhookClient({
    id: client.webhooks.consoleLogs.id,
    token: client.webhooks.consoleLogs.token,
});

const warnLogs = new Discord.WebhookClient({
    id: client.webhooks.warnLogs.id,
    token: client.webhooks.warnLogs.token,
});

// Load handlers
fs.readdirSync('./src/handlers').forEach((dir) => {
    fs.readdirSync(`./src/handlers/${dir}`).forEach((handler) => {
        require(`./handlers/${dir}/${handler}`)(client);
    });
});

client.login(process.env.DISCORD_TOKEN);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    if (error) if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
    if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
    if(!error.stack) return
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・Unhandled promise rejection`)
        .addFields([
            {
                name: "Error",
                value: error ? Discord.codeBlock(error) : "No error",
            },
            {
                name: "Stack error",
                value: error.stack ? Discord.codeBlock(error.stack) : "No stack error",
            }
        ])
        .setColor(client.config.colors.normal)
    consoleLogs.send({
        username: 'Bot Logs | Akemi',
        embeds: [embed],
    }).catch(() => {
        console.log('Error sending unhandledRejection to webhook')
        console.log(error)
    })
});

process.on('warning', warn => {
    console.warn("Warning:", warn);
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・New warning found`)
        .addFields([
            {
                name: `Warn`,
                value: `\`\`\`${warn}\`\`\``,
            },
        ])
        .setColor(client.config.colors.normal)
    warnLogs.send({
        username: 'Bot Logs | Akemi',
        embeds: [embed],
    }).catch(() => {
        console.log('Error sending warning to webhook')
        console.log(warn)
    })
});

client.on(Discord.ShardEvents.Error, error => {
    console.log(error)
    if (error) if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
    if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
    if (!error.stack) return
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・A websocket connection encountered an error`)
        .addFields([
            {
                name: `Error`,
                value: `\`\`\`${error}\`\`\``,
            },
            {
                name: `Stack error`,
                value: `\`\`\`${error.stack}\`\`\``,
            }
        ])
        .setColor(client.config.colors.normal)
    consoleLogs.send({
        username: 'Bot Logs | Akemi',
        embeds: [embed],
    });
});

const userStats = require('./database/models/userStats');
const crypto = require('crypto');
const Code = require('./database/models/code');

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;

    if (message.content.startsWith(',blacklist')) {
        if (!message.member.roles.cache.some(role => role.name === 'Admin')) {
            return message.reply('You do not have permission to use this command.');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('You need to mention a user to blacklist.');
        }

        const userStatus = await userStats.findOne({ User: user.id });
        if (!userStatus) {
            return message.reply('This user does not have any stats in the database.');
        }

        userStatus.Blacklisted = true;
        await userStatus.save();

        message.channel.send(`${user.tag} has been blacklisted.`);
    } else if (message.content.startsWith(',generateCode')) {
        if (!message.member.roles.cache.some(role => role.name === 'Admin')) {
            return message.reply('You do not have permission to use this command.');
        }

        const args = message.content.split(' ');
        const redeemLimit = parseInt(args[1]);
        if (isNaN(redeemLimit) || redeemLimit < 1) {
            return message.reply('You need to specify a valid redeem limit.');
        }

        function generateRandomCode() {
            const uniqueCodePart1 = crypto.randomBytes(3).toString('base64').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
            const uniqueCodePart2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `${uniqueCodePart1}-${uniqueCodePart2}`;
        }

        const code = generateRandomCode(); // Replace with your code generation function

        const newCode = new Code({
            Code: code,
            GeneratedBy: message.author.id,
            Limit: redeemLimit,
            Admin: true,
            RedeemCount: 0
        });
        await newCode.save();

        const embed = new Discord.EmbedBuilder()
        .setTitle(`Admin Code Generated`)
        .setColor(12746)
        .addFields([{ name: 'Your admin referral code:', value: `\`${code}\`` }])
        .setFooter({text: 'If you need help please read <#1228470295401201686>'});

        message.channel.send({ embeds: [embed] });
    }
});