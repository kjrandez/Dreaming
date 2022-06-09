import { Schema, model, Types } from 'mongoose'

export interface ITranscription {
    text: string;
    start: number;
    duration: number;
}

export interface IVideo {
    videoId: string;
    transcript: Types.Array<ITranscription>;
    acquired: boolean;
    processed: boolean
}

const transcriptionSchema = new Schema<ITranscription>({
    text: { type: String, required: true },
    start: { type: Number, required: true },
    duration: { type: Number, required: true}
})

const videoSchema = new Schema<IVideo>({
    videoId: { type: String, required: true },
    transcript: { type: [transcriptionSchema], required: true },
    acquired: { type: Boolean, required: true },
    processed: { type: Boolean, required: true }
})

export const Video = model<IVideo>("videos", videoSchema)
