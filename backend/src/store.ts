import { connect, disconnect } from "mongoose";
import { Video } from "./mongo_types";
import Youtube from "./youtube";

export async function getStore() {
    const uri = process.env.MONGO_ORIGIN;
    if (!uri) throw new Error("No mongodb origin defined");

    await connect(uri);
    console.log("Connected to mongodb");

    return new Store();
}

class Store {
    youtube: Youtube;

    constructor() {
        this.youtube = new Youtube();
    }

    async list() {
        const query = {};

        return await Video.find(query);
    }

    async acquire(videoId: string) {
        // Return from database if it exists
        const query = { videoId: videoId };

        const matches = await Video.find(query);
        if (matches.length == 1) {
            return matches[0];
        }

        // Otherwise acquire, store, and return the video details
        const data = await this.youtube.getVideo(videoId);
        if (!data) throw new Error("Youtube video not found");

        const transcript = await this.youtube.getVideoTranscript(videoId);
        if (!transcript) throw new Error("Video transcript not found");

        const document = await Video.findOneAndUpdate(
            { videoId: videoId },
            {
                videoId: videoId,
                data: data,
                transcript: transcript
            },
            { new: true, upsert: true }
        );
        if (!document) throw new Error("Database could not be updated");

        return document;
    }
}

/*
async function push(videoId: string) {
    const video = new Video({
        videoId: videoId,
        transcript: [],
        acquired: false,
        processed: false
    });
    await video.save();
}

async function fetch(videoId: string | null) {
    const query = videoId == null ? { acquired: false } : { videoId: videoId };

    const pending: Array<IVideo> = await Video.find(query);

    for (const video of pending) {
        try {
            const transcript = await lookupTranscript(video.videoId);
            await Video.findOneAndUpdate(
                { videoId: video.videoId },
                { transcript: transcript, acquired: true }
            );
            console.log(`Updated transcript for ${video.videoId}`);
        } catch (e) {
            console.log(e);
            console.log(`[!] Couldn't get transcript for ${video.videoId}`);
            await Video.findOneAndUpdate(
                { videoId: video.videoId },
                { transcript: [], acquired: true }
            );
        }
    }
}

export async function mongoDisconnect() {
    console.log("Closing connection");
    await disconnect();
}
*/
