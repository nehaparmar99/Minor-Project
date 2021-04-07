const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const path = require("path");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

connectDB();

const Userr = require("./models/Userr");

// Peer
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  console.log("in index");
  res.render("index");
});

app.get("/exit", (req, res) => {
  console.log("in exit");
  res.render("exitpage");
});
app.post("/sendData", async (req, res) => {
  const username = req.body.username;
  const predictedemo = req.body.emotions;
  const user = new Userr();
  user.name = username;
  user.emotion = predictedemo;
  let users = await Userr.find({ name: username });
  if (users.length) console.log("already present");
  else {
    user.save((err, doc) => {
      if (!err) console.log("user saved");
      else console.log(err);
    });
  }
  res.send({ message: "Exited" });
});

app.post("/getdata", async (req, res) => {
  const username = req.body.username;
  let users = await Userr.find({ name: username });
  const emotions = JSON.stringify(users[0].emotion);
  console.log(emotions);
  res.status(200).send({ emotions: emotions });
});

app.post("/main", async (req, res) => {
  let name = req.body.name;
  console.log(name);
  const uid = uuidv4();
  console.log("in main");
  // let users = await Userr.find({ name: name });

  // if (users.length) console.log("already present");
  // else {
  //   const user = new Userr();
  //   user.name = name;
  //   user.save((err, doc) => {
  //     if (!err) console.log("user saved");
  //     else console.log(err);
  //   });
  // }
  res.status(200).send({ code: uuidv4() });
  // rsp.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

let userList = "";

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
  });
  socket.on("news", (roomId, callback) => {
    callback({
      status: userList,
    });
  });
  socket.on("userStreamToggle", (roomId, userId, emotion) => {
    socket.to(roomId).broadcast.emit("toggleTheUser", userId, emotion);
  });
});

server.listen(process.env.PORT || 3030);
