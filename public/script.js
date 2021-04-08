const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.style.display = "block";
myVideo.classList.add("mystyle");
myVideo.setAttribute("id", "myvid");
myVideo.style.width = "100%";
myVideo.style.margin = "auto";
const text = document.createElement("h1");
text.setAttribute("id", "status");
myVideo.muted = true;

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

let myVideoStream,
  userList = [],
  myuserId,
  userEmotionList = [],
  myuserEmotion = "happy";

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;



  (async () => {
    navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    myVideo.srcObject = stream;
    myVideo.addEventListener("loadedmetadata", () => {
      myVideo.play();
    });
    document.getElementById("myroom").append(myVideo);
    emotionalDrama();
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.style.display = "block";
      console.log("blabladata: ",userList,myuserId);
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (inuserList) => {
      var myuserlist = inuserList.split(",");
      connectToNewUser(myuserlist[myuserlist.length - 1], stream);
      userList = myuserlist;
      var vdgrid = document.getElementById("video-grid");
      var adder = vdgrid.childElementCount/2;
      var count = vdgrid.childElementCount/2-1;
      console.log("uc: ",vdgrid.childElementCount/2);
      if(userList.length-1==vdgrid.childElementCount/2)
  {
    var itr = 0;
    for(var i=count;i>=0;i--)
    {
      if(userList[itr]==myuserId)
        itr++;
      vdgrid.childNodes[i+adder].id = userList[itr];
      itr++;
    }
  }
    });

    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    socket.on("createMessage", (msg) => {
      let li = document.createElement("li");
      li.innerHTML = msg;
      all_messages.append(li);
      main__chat__window.scrollTop = main__chat__window.scrollHeight;
    });
  });
  })();
peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        socket.emit("news", ROOM_ID, (response) => {
          userList = response.status.split(",");
        });
        addVideoStream(video, remoteStream);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

function emotionSendFunc(){
  var x = document.getElementById("emotionstatus").textContent;
  if(x!==myuserEmotion)
  {
    myuserEmotion = x;
    let formData = new FormData();
		formData.append('image' , myuserEmotion+".jpeg");
    $.ajax({
      url: "http://localhost:5000/image", // fix this to your liking
      type:"POST",
      data: formData,
      cache: false,
      processData:false,
      contentType:false,
      error: function(data){
        console.log("upload error" , data);
      },
      success: function(data){
        // alert("hello"); // if it's failing on actual server check your server FIREWALL + SET UP CORS
        bytestring = data['status']
        image = bytestring.split('\'')[1]
        gotdatauri = 'data:image/jpeg;base64,' + image;
        document.getElementById("showEmoji").src = gotdatauri;
      }
    });
    console.log(myuserEmotion);
    socket.emit("emotion-update", myuserId, myuserEmotion);
  }
  setTimeout(emotionSendFunc, 1000);
}

emotionSendFunc();

socket.on("take-emotion-list", (data)=> {
  userEmotionList = data;
});

socket.on("userList", (data) => {
  var tmp = data.split(",");
  userList = tmp;
  var vdgrid = document.getElementById("video-grid");
  var adder = vdgrid.childElementCount/2;
  var count = vdgrid.childElementCount/2-1;
  console.log("ul: ",vdgrid.childElementCount/2);
  if(userList.length-1==vdgrid.childElementCount/2)
  {
    var itr = 0;
    for(var i=count;i>=0;i--)
    {
      if(userList[itr]==myuserId)
        itr++;
      vdgrid.childNodes[i+adder].id = userList[itr];
      itr++;
    }
  }
});

socket.on("toggleTheUser", (userId) => {
  console.log("toggler!!!: ",userId);
  var vdgrid = document.getElementById("video-grid");
  var adder = vdgrid.childElementCount/2;
  var count = vdgrid.childElementCount/2-1;
  console.log("ttu: ",vdgrid.childElementCount/2);
  if(userList.length-1==vdgrid.childElementCount/2)
  {
    var itr = 0;
    for(var i=count;i>=0;i--)
    {
      if(userList[itr]==myuserId)
        itr++;
      vdgrid.childNodes[i+adder].id = userList[itr];
      itr++;
    }
  }
  if (userId != myuserId) toggleTheUser(userId);
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  myuserId = id;
});

// CHAT

const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  var video = document.createElement("video");
  video.id = userId;
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream);
  });
};

const capture = () => {
  var canvas = document.getElementById("tmpcanvas");
  var ctx = canvas.getContext("2d");
  ctx.drawImage(myVideo, 0, 0, canvas.width, canvas.height);

  //convert to desired file format
  var dataURI = canvas.toDataURL("image/jpeg"); // can also use 'image/png'
  socket.emit("request-prediction", dataURI, ROOM_ID, myuserId);
  console.log(dataURI);
  var imgs = document.getElementById("tmpimage");
  imgs.src = dataURI;
  imgs.style.display = "block";
};

const addVideoStream = (videoEl, stream) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoEl);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 2 && totalUsers <= 4) {
    for (let index = 0; index < totalUsers; index++) {
      if(!document.getElementsByTagName("video")[index].hasAttribute("id")||document.getElementsByTagName("video")[index].id != "myvid")
      document.getElementsByTagName("video")[index].style.width =
        100 / (totalUsers-1) + "%";
    }
  } else if (totalUsers > 4) {
    for (let index = 0; index < totalUsers; index++) {
      if(!document.getElementsByTagName("video")[index].hasAttribute("id")||document.getElementsByTagName("video")[index].id != "myvid")
      document.getElementsByTagName("video")[index].style.width = 100 / 3 + "%";
    }
  }
};

const insertAfter = (newNode, referenceNode) => {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

const playStop = () => {
  //let enabled = myVideoStream.getVideoTracks()[0].enabled;
  socket.emit("userStreamToggle", myuserId);
  if (myVideo.style.display=="block") {
    //myVideoStream.getVideoTracks()[0].enabled = false;
    myVideo.style.display = "none";
    if(document.getElementById("showEmoji").classList.contains("fushh"))
      document.getElementById("showEmoji").classList.remove("fushh");
    setPlayVideo();
  } else {
    setStopVideo();
    myVideo.style.display = "block";
    //myVideoStream.getVideoTracks()[0].enabled = true;
    if(!document.getElementById("showEmoji").classList.contains("fushh"))
      document.getElementById("showEmoji").classList.add("fushh");
  }
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const toggleTheUser = (userId) => {
  var x = document.getElementById(userId);
  if(x!=null)
  {
    if (x.classList.contains("fushh")) {
      x.classList.remove("fushh");
    } else {
      x.classList.add("fushh");
    }
}
};

const myconsole = () => {
  console.log(userList, myuserId);
};

const togglechatbox = () => {
  if (document.getElementById("chatroom").style.display === "none") {
    document.getElementById("chatroom").style.display = "flex";
    document.getElementById("videoroom").style.flex = 0.8;
  } else {
    document.getElementById("chatroom").style.display = "none";
    document.getElementById("videoroom").style.flex = 1;
  }
};

const leavemeeting = () => {
  console.log("Yet to be updated");
  window.close();
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
