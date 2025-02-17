// pages/api/socketio.js
import { Server } from "socket.io";

export default function SocketHandler(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
  }
  res.end();
}
