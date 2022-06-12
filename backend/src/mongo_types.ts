import { Schema, model } from "mongoose";
import { youtube_v3 } from "googleapis";

export interface ITranscription {
    text: string;
    start: number;
    duration: number;
}

export interface IVideoStats {
    diversity: number;
    lexicon: number;
    speed: number;
}

export interface IVideo {
    videoId: string;
    data: youtube_v3.Schema$Video;
    transcript: ITranscription[];
    stats?: IVideoStats;
}

const transcriptionSchema = new Schema<ITranscription>({
    text: { type: String, required: true },
    start: { type: Number, required: true },
    duration: { type: Number, required: true }
});

const videoStatsSchema = new Schema<IVideoStats>({
    diversity: { type: Number, required: true },
    lexicon: { type: Number, required: true },
    speed: { type: Number, required: true }
});

const videoSchema = new Schema<IVideo>({
    videoId: { type: String, required: true },
    data: { type: Object, required: true },
    transcript: { type: [transcriptionSchema], required: true },
    stats: { type: videoStatsSchema, required: false }
});

export const Video = model<IVideo>("videos", videoSchema);
