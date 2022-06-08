import { WebSocket } from 'ws';

const url = 'ws://localhost:8013'
const connection = new WebSocket(url)

connection.onopen = () => {
    connection.send('5ULtWJAUZIA')
}

connection.onerror = (error) => {
    console.log(`WebSocket error: ${error}`)
}

connection.onmessage = (e) => {
    console.log(e.data)
}
