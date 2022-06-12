import express from "express";
import { Store } from "./store";
import { connect } from "mongoose";
import cors from "cors";
import { IVideo } from "./mongo_types";
import dotenv from "dotenv";

function apiVideoFromDbVideo(video: IVideo) {
    return {
        videoId: video.videoId,
        title: video.data.snippet?.title,
        sample: video.transcript[0]?.text,
        stats: {
            diversity: video.stats?.diversity,
            lexicon: video.stats?.lexicon,
            speed: video.stats?.speed
        }
    };
}

async function init() {
    console.log("Initializing");

    dotenv.config();

    const mongoPort = process.env.MONGO_PORT;
    const mongoDb = process.env.MONGO_DATABASE;
    if (!mongoDb || !mongoPort) throw new Error("No mongodb origin defined");
    const mongoUri = `mongodb://localhost:${mongoPort}/${mongoDb}`;

    await connect(mongoUri);
    console.log("Connected to mongodb");

    const store = new Store();

    const app = express();

    if (process.env.DEBUG == "1") {
        const reactServerPort = process.env.REACT_SERVER_PORT;
        app.use(cors({ origin: `http://localhost:${reactServerPort}` }));
    }

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

        const refresh = req.query.refresh ? true : false;

        try {
            const result = await store.acquire(videoId, refresh);
            console.log(result);
            const response = apiVideoFromDbVideo(result);
            res.json(response);
        } catch (error: any) {
            res.status(500);
            res.json({ error: error.toString() });
        }
    });

    const port = process.env.API_PORT;
    app.listen(port, () => {
        console.log(`Listening on port ${port}.`);
    });
}

init().catch((err) => console.log(err));
