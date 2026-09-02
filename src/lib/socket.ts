import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Returns the shared Socket.IO client, creating it lazily with the given auth
 * token. The connection is a singleton so multiple callers share one socket.
 */
export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

/**
 * Tears down the shared socket connection. Call on logout or when the auth
 * token changes so a stale, previously-authenticated connection is not reused.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}
