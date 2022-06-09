import { WebSocket } from 'ws'
import { ITranscription } from './mongo_types'

export function lookupTranscript(videoId: string): Promise<ITranscription[]>
{
    const url = "ws://localhost:8013"

    return new Promise<ITranscription[]>((resolve, reject) => {
        const connection = new WebSocket(url)

        connection.onopen = () => {
            connection.send(videoId)
        }
    
        connection.onerror = (error) => {
            console.log(error)
            console.log("connection error")
            reject(error)
        }
    
        connection.onmessage = (e) => {
            const res: any = JSON.parse(e.data.toString())
            if (res.success) {
                resolve(res.transcript)
            }
            else {
                console.log("Non-success returned")
                reject(new Error("Couldn't fetch transcript"))
            }
        }
    })
}
