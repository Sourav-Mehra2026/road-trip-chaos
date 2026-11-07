
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static("public"));

const rooms = new Map();
const makeCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();

function roomFor(code) {
  if (!rooms.has(code)) rooms.set(code, {
    players: {},
    vehicle: { x: 0, z: 0, yaw: 0, speed: 0, gear: "P" },
    driverId: null
  });
  return rooms.get(code);
}
function publicState(room) {
  return {
    players: Object.values(room.players),
    vehicle: room.vehicle,
    driverId: room.driverId
  };
}
function leaveRoom(socket) {
  const code = socket.data.room;
  if (!code || !rooms.has(code)) return;
  const room = rooms.get(code);
  delete room.players[socket.id];
  if (room.driverId === socket.id) room.driverId = Object.keys(room.players)[0] || null;
  socket.to(code).emit("state", publicState(room));
  socket.leave(code);
  if (!Object.keys(room.players).length) rooms.delete(code);
  socket.data.room = null;
}

io.on("connection", socket => {
  socket.on("createRoom", ({ username }, cb) => {
    leaveRoom(socket);
    let code = makeCode();
    while (rooms.has(code)) code = makeCode();
    const room = roomFor(code);
    room.players[socket.id] = {
      id: socket.id, username: String(username || "Player").slice(0, 18),
      x: 2, z: 3, yaw: 0, color: Math.floor(Math.random()*0xffffff),
      thrownUntil: 0, vx: 0, vz: 0
    };
    room.driverId = socket.id;
    socket.join(code); socket.data.room = code;
    cb({ ok: true, code, state: publicState(room) });
    io.to(code).emit("state", publicState(room));
  });

  socket.on("joinRoom", ({ code, username }, cb) => {
    leaveRoom(socket);
    code = String(code || "").toUpperCase().trim();
    if (!rooms.has(code)) return cb({ ok: false, error: "Room nahi mila. Code check karo." });
    const room = rooms.get(code);
    if (Object.keys(room.players).length >= 6) return cb({ ok: false, error: "Room full hai (maximum 6 players)." });
    room.players[socket.id] = {
      id: socket.id, username: String(username || "Player").slice(0, 18),
      x: 2 + Object.keys(room.players).length, z: 4, yaw: 0,
      color: Math.floor(Math.random()*0xffffff), thrownUntil: 0, vx: 0, vz: 0
    };
    socket.join(code); socket.data.room = code;
    cb({ ok: true, code, state: publicState(room) });
    io.to(code).emit("state", publicState(room));
  });

  socket.on("drive", controls => {
    const code = socket.data.room;
    if (!code || !rooms.has(code)) return;
    const room = rooms.get(code);
    if (room.driverId !== socket.id) return;
    const v = room.vehicle;
    const gear = ["P","R","N","1","2","3","4"].includes(controls.gear) ? controls.gear : "P";
    v.gear = gear;
    const throttle = Math.max(0, Math.min(1, Number(controls.throttle)||0));
    const brake = Math.max(0, Math.min(1, Number(controls.brake)||0));
    const steer = Math.max(-1, Math.min(1, Number(controls.steer)||0));
    const limits = { P:0, N:0, R:5, 1:4, 2:7, 3:10, 4:13 };
    const direction = gear === "R" ? -1 : 1;
    if (gear === "P" || gear === "N") v.speed *= 0.82;
    else {
      const target = throttle * limits[gear] * direction;
      v.speed += (target - v.speed) * 0.045;
      if (brake > 0) v.speed *= (1 - brake * 0.14);
    }
    if (Math.abs(v.speed) < 0.03) v.speed = 0;
    v.yaw += steer * Math.min(Math.abs(v.speed)/8, 1) * 0.025;
    v.x += Math.sin(v.yaw) * v.speed * 0.035;
    v.z += Math.cos(v.yaw) * v.speed * 0.035;
    io.to(code).emit("state", publicState(room));
  });

  socket.on("move", data => {
    const code = socket.data.room;
    if (!code || !rooms.has(code)) return;
    const p = rooms.get(code).players[socket.id];
    if (!p || Date.now() < p.thrownUntil) return;
    p.x = Math.max(-35, Math.min(35, Number(data.x)||0));
    p.z = Math.max(-35, Math.min(35, Number(data.z)||0));
    p.yaw = Number(data.yaw)||0;
    socket.to(code).emit("state", publicState(rooms.get(code)));
  });

  socket.on("throwPlayer", targetId => {
    const code = socket.data.room;
    if (!code || !rooms.has(code)) return;
    const room = rooms.get(code), target = room.players[targetId];
    if (!target || targetId === socket.id) return;
    const thrower = room.players[socket.id];
    if (!thrower) return;
    const dx = target.x - thrower.x, dz = target.z - thrower.z;
    const len = Math.hypot(dx,dz) || 1;
    target.vx = dx/len * 0.8; target.vz = dz/len * 0.8;
    target.thrownUntil = Date.now() + 900;
    target.x += target.vx * 5; target.z += target.vz * 5;
    io.to(code).emit("state", publicState(room));
    io.to(code).emit("toast", `${target.username} ko hawa mein bhej diya! 😂`);
  });

  socket.on("chat", message => {
    const code = socket.data.room;
    if (!code || !rooms.has(code)) return;
    const p = rooms.get(code).players[socket.id];
    if (!p) return;
    io.to(code).emit("chat", { username:p.username, message:String(message||"").slice(0,100) });
  });

  socket.on("disconnect", () => leaveRoom(socket));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`ROAD TRIP CHAOS running on port ${PORT}`));
