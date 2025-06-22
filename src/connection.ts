import { joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { Client, VoiceChannel } from "discord.js";

export async function connectToVoiceChannel(
  client: Client,
): Promise<VoiceConnection> {
  const guildId = process.env.GUILD!;
  const channelId = process.env.CHANNEL!;
  const guild = await client.guilds.fetch(guildId);
  const channel = (await guild.channels.fetch(
    channelId,
  )) as VoiceChannel | null;
  if (!channel) throw new Error("Channel not found");

  return joinVoiceChannel({
    selfDeaf: false,
    channelId: channel.id,
    guildId: channel.guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
    debug: true,
  });
}
