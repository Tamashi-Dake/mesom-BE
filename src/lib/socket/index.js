import { parse as parseCookie } from 'cookie'
import { Server } from 'socket.io'
import { verifyAccessToken } from '../../util/jwt.js'
import { joinConversationHandler, leaveConversationHandler, newMessageHandler } from './handler/conversation.handler.js'

const setupSocket = (server) => {
  const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.NODE_ENV === 'production' ? process.env.PROD_FRONTEND_URL : process.env.DEV_FRONTEND_URL,
      credentials: true
    }
  })

  io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie || ''
    const cookies = parseCookie(rawCookie)
    const token = cookies['mesom-access']
    if (!token) return next(new Error('Unauthorized'))
    try {
      socket.data.user = verifyAccessToken(token)
      return next()
    } catch {
      return next(new Error('Token invalid or expired'))
    }
  })

  io.on('connection', (socket) => {
    const { userId } = socket.data.user
    socket.join(userId)
    console.log('🟢 New socket connected:', socket.id, 'user:', userId)

    joinConversationHandler(socket)
    leaveConversationHandler(socket)
    newMessageHandler(io, socket)

    socket.on('disconnect', () => {
      console.log('🔴 Disconnected:', socket.id)
    })
  })
}

export default setupSocket
