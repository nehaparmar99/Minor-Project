const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
// Peer

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, rsp) => {
  rsp.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

let userList = "";
let usersEmotion = {};

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    if (userList.length == 0) userList = userId;
    else userList = userList + "," + userId;
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userList);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });
    socket.to(roomId).emit("userList", userList);
    socket.on("emotion-update", (userid,emotion) => {
      usersEmotion[userid] = emotion;
      //console.log(usersEmotion);
      io.to(roomId).emit("take-emotion-list", usersEmotion);
    });
    socket.on("userStreamToggle", (userId) => {
      io.to(roomId).emit("toggleTheUser", userId);
    });
  });
  socket.on("news", (roomId, callback) => {
    callback({
      status: userList,
    });
  });
});

server.listen(process.env.PORT || 3030);
