import { google, youtube_v3 } from "googleapis";
import { ITranscription } from "./mongo_types";
import YoutubeTranscript from "youtube-transcript";

export default class Youtube {
    api: youtube_v3.Youtube;

    constructor() {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) throw new Error("No youtube api key");

        this.api = google.youtube({ version: "v3", auth: apiKey });
    }

    async getVideo(id: string) {
        const result = await this.api.videos.list({
            part: [
                "contentDetails",
                "localizations",
                "snippet",
                "topicDetails"
            ],
            id: [id]
        });
        return result.data?.items?.[0];
    }

    async getVideoTranscript(videoId: string): Promise<ITranscription[]> {
        // A Python version of this module also exists
        const trs = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: "es"
        });
        return trs.map((e) => ({
            text: e.text,
            start: e.offset,
            duration: e.duration
        }));
    }

    async getChannel(id: string) {
        const result = await this.api.channels.list({
            part: ["contentDetails"],
            id: [id]
        });
        return result.data?.items?.[0];
    }

    async getVideosInChannel(id: string) {
        const uploadsPlaylist = await this.getUploadsPlaylist(id);

        if (uploadsPlaylist)
            return await this.getVideosInPlaylist(uploadsPlaylist);
    }

    async getUploadsPlaylist(channel_id: string) {
        const channel = await this.getChannel(channel_id);

        return channel?.contentDetails?.relatedPlaylists?.uploads;
    }

    async getVideosInPlaylist(playlist_id: string) {
        var videoIds = [];
        var totalResults = 0;
        var resultsSoFar = 0;
        var nextPageToken = undefined;

        do {
            const parameters = {
                part: ["snippet"],
                playlistId: playlist_id,
                maxResults: 50
            };
            var playlistItems;

            if (nextPageToken) {
                playlistItems = await this.api.playlistItems.list(parameters);
            } else {
                playlistItems = await this.api.playlistItems.list({
                    pageToken: nextPageToken,
                    ...parameters
                });
            }

            if (
                playlistItems.data.items &&
                playlistItems.data.pageInfo?.totalResults
            ) {
                totalResults = playlistItems.data.pageInfo.totalResults;
                resultsSoFar += playlistItems.data.items.length;

                for (const item of playlistItems.data.items) {
                    console.log(item.snippet?.resourceId);

                    if (item.snippet?.resourceId?.kind == "youtube#video") {
                        if (item.snippet?.resourceId?.videoId)
                            videoIds.push(item.snippet?.resourceId?.videoId);
                    }
                }
            } else {
                break;
            }

            if (playlistItems.data.nextPageToken)
                nextPageToken = playlistItems.data.nextPageToken;
            else break;
        } while (resultsSoFar < totalResults - 1);

        return videoIds;
    }
}
