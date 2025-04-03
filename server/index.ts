import { staticPlugin } from '@elysiajs/static'
import { Elysia } from 'elysia'

const sockets = new Map()

const app = new Elysia()
  .use(
    staticPlugin({
      assets: `${import.meta.dirname}/../client/dist`,
      prefix: '/',
    }),
  )
  .ws('/api', {
    open(ws) {
      sockets.set(ws.id, ws)
    },
    close(ws) {
      sockets.delete(ws.id)
    },
    message(ws, message) {
      for (const [id, socket] of sockets) {
        if (ws.id === id) continue

        socket.send(message)
      }
    },
  })
  .listen(4567)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
