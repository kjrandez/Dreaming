import { google, youtube_v3 } from "googleapis";
import { WebSocket } from "ws";
import { ITranscription } from "./mongo_types";
import { spawn } from "child_process";
import YoutubeTranscript from "youtube-transcript";

export default class Youtube {
    api: youtube_v3.Youtube;
    //scriptsOrigin: string;

    constructor() {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) throw new Error("No youtube api key");

        //const scriptsPort = process.env.SCRIPTS_PORT;
        //if (!scriptsPort) throw new Error("No scripts port");
        //this.scriptsOrigin = `ws://localhost:${scriptsPort}`;

        this.api = google.youtube({ version: "v3", auth: apiKey });

        //spawn("python3", ["scripts/fetch_captions.py", `${scriptsPort}`], {
        //    detached: true
        //});
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

    /*async getVideoTranscript(videoId: string) {
        return new Promise<ITranscription[] | undefined>((resolve, _) => {
            const connection = new WebSocket(this.scriptsOrigin);

            connection.onopen = () => {
                connection.send(videoId);
            };

            connection.onerror = (error) => {
                console.log(error);
                resolve(undefined);
            };

            connection.onmessage = (event) => {
                const res: any = JSON.parse(event.data.toString());
                if (res.success) {
                    resolve(res.transcript);
                } else {
                    console.log(event);
                    resolve(undefined);
                }
            };
        });
    }*/

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
