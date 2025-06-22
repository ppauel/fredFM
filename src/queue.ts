import { AudioPlayer, createAudioResource } from "@discordjs/voice";
import { Collection } from "discord.js";
import Soundcloud, { SoundcloudTrack } from "soundcloud.ts";

export class Queue {
  urls: Collection<number, SoundcloudTrack> = new Collection();
  queue: Collection<number, SoundcloudTrack> = new Collection();
  current: number | undefined;
  sc: Soundcloud;

  constructor(sc: Soundcloud) {
    this.sc = sc;
  }

  async queueSongs(urls: string[]) {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const track = await this.sc.tracks.getAlt(url); // getAlt() is necessary when using private Soundcloud URLs
      this.urls.set(track.id, track);
      console.log(`[Queue] Queued ${track.user.username} - ${track.title}`);
    }
  }

  queueAll() {
    this.queue = this.urls.clone();
  }

  nextTrack(): SoundcloudTrack | null {
    if (this.urls.size == 0) {
      console.log("[Queue] No songs provided");
      return null;
    }

    if (this.current) {
      this.queue.delete(this.current);
    }

    this.current = this.queue.randomKey();

    if (!this.current) {
      console.log("[Queue] Restarting queue");
      this.queueAll();
      return this.nextTrack();
    }

    return this.queue.get(this.current) ?? null;
  }

  async playNext(player: AudioPlayer) {
    const track = this.nextTrack();
    if (!track) {
      console.error("[Queue] Nothing to play");
    } else {
      const stream = await this.sc.util.streamLink(track);
      if (stream) {
        const resource = createAudioResource(stream, {
          inlineVolume: true,
          metadata: {
            title: track.title,
          },
        });
        resource.volume?.setVolume(0.5);
        console.log(`[Queue] Playing ${track.user.username} - ${track.title}`);
        player.play(resource);
      } else {
        console.error("[Queue] Cannot get stream");
        this.playNext(player);
      }
    }
  }
}
