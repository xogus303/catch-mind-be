import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const gameSize = 2;
let rooms = {}; // {roomId: [{id: '', name: '', ready?: false}, user2], roomId: [user3, user4]}

io.on("connection", (socket) => {
  // 유저 입장
  socket.on("joinRandomRoom", (userName) => {
    let roomFound = false;
    // 1. 기존 방에 여유 공간 있는지 확인
    for (const roomId in rooms) {
      if (Object.keys(rooms[roomId]).length < 2) {
        rooms[roomId] = { ...rooms[roomId], [socket.id]: { name: userName } };
        // rooms[roomId].push({ id: socket.id, name: userName });
        socket.join(roomId);
        socket.emit(
          "roomJoined",
          socket.id,
          roomId,
          Object.keys(rooms[roomId]).length,
          gameSize
        );
        socket
          .to(roomId)
          .emit(
            "welcome",
            userName,
            Object.keys(rooms[roomId]).length,
            gameSize
          );
        console.log(`${socket.id} joined Room ${roomId}`);
        roomFound = true;
        break;
      }
    }

    // 2. 빈 방이 없으면 새 방 생성
    if (!roomFound) {
      const newRoomId = `room-${Object.keys(rooms).length + 1}`;
      rooms[newRoomId] = { [socket.id]: { name: userName } };
      // rooms[newRoomId] = [{ id: socket.id, name: userName }];
      socket.join(newRoomId);
      socket.emit("roomJoined", socket.id, newRoomId, 1, gameSize);
      console.log(`${socket.id} created and joined Room ${newRoomId}`);
    }

    console.log("roomFound", roomFound);
    console.log("rooms", rooms);
  });

  socket.on("chat message", (msg) => {
    console.log("io.emit", msg);
    io.emit("chat message", msg, socket.id);
  });

  socket.on("ready", (roomId) => {
    console.log("ready roomId", roomId, rooms[roomId]);
    if (rooms[roomId] !== undefined) {
      rooms[roomId][socket.id] = { ...rooms[roomId][socket.id], ready: true };
      let allReady = true;
      for (const roomId in rooms) {
        for (const user in rooms[roomId]) {
          if (rooms[roomId][user]?.ready !== true) {
            allReady = false;
          }
        }
        break;
      }
      if (allReady) {
        io.emit("game start");
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");

    for (const roomId in rooms) {
      const leaveUser = rooms[roomId][socket.id];
      console.log("leaveUser", leaveUser);
      if (leaveUser !== undefined && Object.keys(rooms[roomId]).length === 2) {
        socket
          .to(roomId)
          .emit("leave", leaveUser.name, Object.keys(rooms[roomId]).length - 1);
      }
      delete rooms[roomId][socket.id];
      if (Object.keys(rooms[roomId]).length === 0) {
        delete rooms[roomId]; // 빈 방 삭제
      }
      console.log("rooms", rooms);
    }
  });
});

server.listen(3001, () => {
  console.log("server running at http://localhost:3001");
});
