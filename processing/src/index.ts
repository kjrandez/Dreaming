import { connect, disconnect } from 'mongoose'

import { lookupTranscript } from './transcripts'
import { IVideo, Video } from './mongo_types'

function main() {
    var command: string | null = null;
    var videoId: string | null = null;

    if (process.argv.length > 2) {
        command = process.argv[2]
    }

    if (process.argv.length > 3) {
        videoId = process.argv[3]
    }

    run(command, videoId).catch(err => console.log(err));
}

async function run(command: string | null, videoId: string | null) {
    if (command == null) {
        console.log("No command")
        return
    }

    mongoConnect()

    switch (command) {
        case "grab":
            if (videoId != null) {
                await push(videoId)
                await fetch(videoId)
            }
            else {
                console.log("Provide video ID")
            }
            break
        case "push":
            if (videoId != null) {
                await push(videoId)
            }
            else {
                console.log("Provide video ID")
            }
            break
        case "fetch":
            await fetch(null)
            break
        case "proc":
            await proc()
            break
        default:
            console.log(`Unknown command ${command}`)
    }

    mongoDisconnect()
}

async function push(videoId: string)
{
    const video = new Video({
        videoId: videoId,
        transcript: [],
        acquired: false,
        processed: false
    })
    await video.save()
}

async function fetch(videoId: string | null)
{
    const query = videoId == null ? { acquired: false } : { videoId: videoId }

    const pending: Array<IVideo> = await Video.find(query)
    
    for (const video of pending) {
        try {
            const transcript = await lookupTranscript(video.videoId)
            await Video.findOneAndUpdate(
                { videoId: video.videoId },
                { transcript: transcript, acquired: true }
            )
            console.log(`Updated transcript for ${video.videoId}`)
        }
        catch (e) {
            console.log(e)
            console.log(`[!] Couldn't get transcript for ${video.videoId}`)
            await Video.findOneAndUpdate(
                { videoId: video.videoId },
                { transcript: [], acquired: true }
            )
        }
    }
}

async function proc()
{
    console.log("Doing stuff")
}

async function mongoConnect()
{
    const uri = "mongodb://localhost:27017/dreamingdb"
    await connect(uri)
    console.log("Connected to mongodb")
}

async function mongoDisconnect()
{
    console.log("Closing connection")
    await disconnect()
}

main()
