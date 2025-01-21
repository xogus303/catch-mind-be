import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { fetchWord } from "./getRandomWord.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 5000,
  },
});

const gameSize = 2;
let rooms = {}; // {roomId: [{id: '', name: '', ready?: false}, user2], roomId: [user3, user4]}
console.log("rooms", rooms);
io.on("connection", (socket) => {
  if (socket.recovered) {
    console.log("is recovered");
  } else {
    console.log("is not Recovered");
  }

  // 유저 입장
  socket.on("joinRandomRoom", (userName, userType) => {
    let roomFound = false;
    // 1. 기존 방에 여유 공간 있는지 확인
    for (const roomId in rooms) {
      console.log("rooms[roomId]", rooms[roomId]);
      if (Object.keys(rooms[roomId]).length < gameSize) {
        // 출제자 타입인 경우 방에 출제자가 없는지 체크
        if (userType === "master") {
          console.log("join master");
          let hasSmaeType = false;
          for (const [key, value] of Object.entries(rooms[roomId])) {
            if (value.type === userType) hasSmaeType = true;
            break;
          }
          if (hasSmaeType) {
            break;
          }
        } else {
          // 문제 풀이자의 경우 출제자 자리를 제외한 인원수로 입장가능 여부 체크
          if (gameSize - Object.keys(rooms[roomId]).length < 2) {
            // 2인이상 자리가 있는 경우 문제풀이자는 항상 해당 룸 입장 가능
            let hasMaster = false;
            for (const [key, value] of Object.entries(rooms[roomId])) {
              if (value.type === "master") {
                hasMaster = true;
              }
              break;
            }
            if (hasMaster === false) {
              // 남은 1자리가 제출자면 다음방 조회
              continue;
            }
          }
        }

        rooms[roomId] = {
          ...rooms[roomId],
          [socket.id]: { name: userName, type: userType },
        };
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
        const userList = [];
        for (const [key, value] of Object.entries(rooms[roomId])) {
          userList.push({
            id: key,
            name: value.name,
            type: value.type,
            answer: "",
          });
        }
        io.to(roomId).emit("user update", userList);
        roomFound = true;
        console.log("roomFound");
        break;
      }
    }

    // 2. 빈 방이 없으면 새 방 생성
    if (!roomFound) {
      console.log("no roomFound");
      const newRoomId = `room-${Object.keys(rooms).length + 1}`;
      rooms[newRoomId] = { [socket.id]: { name: userName, type: userType } };
      // rooms[newRoomId] = [{ id: socket.id, name: userName }];
      socket.join(newRoomId);
      socket.emit("roomJoined", socket.id, newRoomId, 1, gameSize);
      socket.emit("user update", [
        { id: socket.id, name: userName, type: userType, answer: "" },
      ]);
    }
    console.log("joinRandomRoom rooms", rooms);
  });

  socket.on("chat message", (roomId, msg, userName) => {
    io.to(roomId).emit("chat message", msg, socket.id, userName);
  });

  socket.on("ready", (roomId) => {
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
      console.log("allReady", allReady);
      if (allReady) {
        io.to(roomId).emit("loading start");
        fetchWord().then((res) => {
          console.log("fetchWord res", res);
        });
        // io.to(roomId).emit("game start");
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("disconnect socket.id:", socket.id);
    console.log("disconnect rooms", rooms);
    for (const roomId in rooms) {
      console.log(
        "rooms[roomId].hasOwnProperty(socket.id)",
        rooms[roomId].hasOwnProperty(socket.id)
      );
      if (!rooms[roomId].hasOwnProperty(socket.id)) continue;
      const leaveUser = rooms[roomId][socket.id];
      console.log("leaveUser", leaveUser);
      delete rooms[roomId][socket.id];
      console.log("leaveUser", leaveUser);
      if (Object.keys(rooms[roomId]).length === 0) {
        delete rooms[roomId]; // 빈 방 삭제
      } else {
        if (
          leaveUser !== undefined &&
          Object.keys(rooms[roomId]).length < gameSize
        ) {
          io.to(roomId).emit(
            "leave",
            leaveUser.name,
            Object.keys(rooms[roomId]).length - 1,
            gameSize
          );
        }
        const userList = [];
        for (const [key, value] of Object.entries(rooms[roomId])) {
          console.log("key", key);
          console.log("value", value);
          userList.push({
            id: key,
            name: value.name,
            type: value.type,
            answer: "",
          });
        }
        io.to(roomId).emit("user update", userList);
      }
    }
  });
});

server.listen(3001, () => {});
server.on("close", () => {
  console.log("server close. rooms", rooms);
});
