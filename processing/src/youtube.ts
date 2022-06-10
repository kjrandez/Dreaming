import { google, youtube_v3 } from 'googleapis'

export default class Youtube
{
    api: youtube_v3.Youtube
    channelCache: { [_: string]: youtube_v3.Schema$Channel | undefined } = {}

    constructor(api_key: string) {
        this.api = google.youtube({ version: "v3", auth: api_key })
    }

    async getChannel(id: string, refresh=false) {
        if (refresh || !(id in this.channelCache)) {
            const result = await this.api.channels.list({
                part: ["contentDetails"],
                id: [id]
            })
            const channel = result.data?.items?.[0]
            this.channelCache[id] = channel
        }

        return this.channelCache[id]
    }

    async getVideosInChannel(id: string, refresh=false) {
        const uploadsPlaylist = await this.getUploadsPlaylist(id, refresh)
        
        if (uploadsPlaylist)
            return await this.getVideosInPlaylist(uploadsPlaylist)
    }

    async getUploadsPlaylist(channel_id: string, refresh=false) {
        const channel = await this.getChannel(channel_id, refresh)

        return channel?.contentDetails?.relatedPlaylists?.uploads
    }

    async getVideosInPlaylist(playlist_id: string) {
        var videoIds = []
        var totalResults = 0
        var resultsSoFar = 0
        var nextPageToken = undefined

        do {
            const parameters = {
                part: ["snippet"],
                playlistId: playlist_id,
                maxResults: 50
            }
            var playlistItems

            if (nextPageToken) {
                playlistItems = await this.api.playlistItems.list(parameters)
            }
            else {
                playlistItems = await this.api.playlistItems.list({
                    pageToken: nextPageToken,
                    ...parameters
                })
            }

            if (playlistItems.data.items && playlistItems.data.pageInfo?.totalResults) {
                totalResults = playlistItems.data.pageInfo.totalResults
                resultsSoFar += playlistItems.data.items.length
            
                for (const item of playlistItems.data.items) {
                    console.log(item.snippet?.resourceId)

                    if (item.snippet?.resourceId?.kind == "youtube#video") {
                        if (item.snippet?.resourceId?.videoId)
                            videoIds.push(item.snippet?.resourceId?.videoId)
                    }
                }
            }
            else {
                break
            }

            if (playlistItems.data.nextPageToken)
                nextPageToken = playlistItems.data.nextPageToken
            else
                break
        }
        while(resultsSoFar < totalResults - 1)

        return videoIds
    }
}
