import asyncio
import websockets
import json
import sys

from youtube_transcript_api import YouTubeTranscriptApi

async def fetch(websocket, path):
    reply = None
    
    videoId = await websocket.recv()
    try:
        trs = YouTubeTranscriptApi.get_transcript(videoId, languages=['es'])
        reply = {
            "videoId": videoId,
            "success": True,
            "transcript": trs
        }
    except Exception:
        print(traceback.format_exc())
        reply = {
            "videoId": videoId,
            "success": False,
            "transcript": []
        }

    if reply["success"]:
        print(f"Transcript for {videoId} fetched")
    else:
        print(f"Error fetching transcript for {videoId}")
    
    await websocket.send(json.dumps(reply))

start_server = websockets.serve(fetch, "localhost", int(sys.argv[1]))

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
