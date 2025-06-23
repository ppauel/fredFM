import {
    generateDependencyReport,
    VoiceConnectionStatus,
    AudioPlayerStatus,
    entersState,
    createAudioPlayer,
    NoSubscriberBehavior,
} from "@discordjs/voice";
import {
    ActivityType,
    Client,
    Events,
    GatewayIntentBits as Intents,
    Options,
} from "discord.js";
import { connectToVoiceChannel } from "./connection";
import { config } from "dotenv";
import Soundcloud from "soundcloud.ts";
import { Queue } from "./queue";

// Read .env file
config();

if (
    !process.env.GUILD ||
    !process.env.CHANNEL ||
    !process.env.TOKEN ||
    !process.env.URLS
) throw new Error("Missing environment variables");

// Create Discord client
const client = new Client({
    intents: [Intents.Guilds, Intents.GuildVoiceStates, Intents.GuildMembers],
    presence: {
        activities: [{ name: "24/7 Community Radio", type: ActivityType.Playing }],
    },
    makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,

        // Cache
        VoiceStateManager: 64,
        StageInstanceManager: 64,

        // No cache
        GuildMemberManager: {
            maxSize: 0,
            keepOverLimit: (member) => member.id === member.client.user.id,
        },
        UserManager: {
            maxSize: 0,
            keepOverLimit: (user) => user.id === user.client.user.id,
        },
        ApplicationCommandManager: 0,
        ApplicationEmojiManager: 0,
        AutoModerationRuleManager: 0,
        BaseGuildEmojiManager: 0,
        DMMessageManager: 0,
        EntitlementManager: 0,
        GuildBanManager: 0,
        GuildEmojiManager: 0,
        GuildForumThreadManager: 0,
        GuildInviteManager: 0,
        GuildMessageManager: 0,
        GuildScheduledEventManager: 0,
        GuildStickerManager: 0,
        GuildTextThreadManager: 0,
        MessageManager: 0,
        PresenceManager: 0,
        ReactionManager: 0,
        ReactionUserManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
    }),
});

client.on(Events.ClientReady, async (c) => {
    const sc = new Soundcloud();
    const queue = new Queue(sc);
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });
    const connection = await connectToVoiceChannel(c);

    player.on("stateChange", (oldState, newState) => {
        console.log(`[Audio player] ${oldState.status} -> ${newState.status}`);
    });

    player.on("error", (err) => {
        console.error(`[Audio player] Error: ${err.message} with resource ${err.resource}`);
        queue.playNext(player);
    });

    player.on(AudioPlayerStatus.Idle, async (_oldState, _newState) => {
        queue.playNext(player);
    });

    connection.on("stateChange", (oldState, newState) => {
        console.log(`[Connection] ${oldState.status} -> ${newState.status}`);
    });

    connection.on("error", (err) => {
        console.error(`[Connection] ERROR: ${err}`);
    });

    connection.on("debug", (deb) => {
        console.debug(`[Connection] DEBUG: ${deb}`);
    });

    // Handling disconnects
    connection.on(VoiceConnectionStatus.Disconnected, async (_oldState, _newState) => {
        try {
            console.log("[Connection] Recovering ...");
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
        } catch {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            console.log("[Connection] Disconnect timeout! Connection destroyed");
            connection.destroy();
        }
    },
    );

    // Connection ready
    connection.on(VoiceConnectionStatus.Ready, async (_oldState, _newState) => {
        connection.subscribe(player);
        const urls = process.env.URLS!.split(" ");
        await queue.queueSongs(urls);
        queue.playNext(player);
    });
});

console.log(generateDependencyReport());
client.login(process.env.TOKEN);
