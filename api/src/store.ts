import { Analysis } from "./analysis";
import { Video } from "./mongo_types";
import Youtube from "./youtube";

export class Store {
    youtube: Youtube;
    analysis: Analysis;

    constructor() {
        this.youtube = new Youtube();
        this.analysis = new Analysis();
    }

    async list() {
        const query = {};

        return await Video.find(query).sort({ "stats.lexicon": "asc" });
    }

    async acquire(videoId: string, refresh = false) {
        // Return from database if it exists
        if (!refresh) {
            const query = { videoId: videoId };

            const matches = await Video.find(query);
            if (matches.length == 1) {
                return matches[0];
            }
        }

        // Otherwise acquire, store, and return the video details
        const data = await this.youtube.getVideo(videoId);
        if (!data) throw new Error("Youtube video not found");

        const transcript = await this.youtube.getVideoTranscript(videoId);
        if (!transcript) throw new Error("Video transcript not found");

        const stats = await this.analysis.getStats(transcript);

        const document = await Video.findOneAndUpdate(
            { videoId: videoId },
            {
                videoId: videoId,
                data: data,
                transcript: transcript,
                stats: stats
            },
            { new: true, upsert: true }
        );
        if (!document) throw new Error("Database could not be updated");

        return document;
    }
}
