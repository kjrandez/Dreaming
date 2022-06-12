import express, { response } from "express";
import { getStore } from "./store";
import cors from "cors";
import { IVideo } from "./mongo_types";
import dotenv from "dotenv";

function apiVideoFromDbVideo(video: IVideo) {
    return {
        videoId: video.videoId,
        title: video.data.snippet?.title,
        sample: video.transcript[0]?.text,
        score: 0.1
    };
}

async function init() {
    console.log("Initializing");

    dotenv.config();

    const app = express();
    const store = await getStore();

    app.use(cors({ origin: process.env.CORS_ORIGIN }));

    app.get("/list", async (req, res) => {
        try {
            const result = await store.list();
            const response = result.map(apiVideoFromDbVideo);
            res.json(response);
        } catch (error) {
            res.status(500);
            res.json({ error });
        }
    });

    app.get("/lookup", async (req, res) => {
        const videoId = req.query.videoId?.toString();
        if (!videoId) {
            res.status(500);
            res.json({ error: "bad request" });
            return;
        }

        try {
            const result = await store.acquire(videoId);
            console.log(result);
            const response = apiVideoFromDbVideo(result);
            res.json(response);
        } catch (error: any) {
            res.status(500);
            res.json({ error: error.toString() });
        }
    });

    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`Listening on port ${port}.`);
    });
}

init().catch((err) => console.log(err));
