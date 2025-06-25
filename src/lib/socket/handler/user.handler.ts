import { Socket } from 'socket.io'
import { EUserSocketEvents } from '~/constrains/socket.enums.js'

export const userLoginHandler = (socket: Socket) => {
  socket.on(EUserSocketEvents.setup, (userId, displayName) => {
    if (!userId) {
      console.error('Invalid parameters for setup user event', {
        userId
      })
      return
    }
    socket.join(userId)
    socket.emit(EUserSocketEvents.online, displayName)
  })
}
