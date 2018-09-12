"use strict";

    let socket

    var outputDiv = document.getElementById('output')
    var cpus = document.getElementById('cpus')
    var freq = document.getElementById('freq')
    var nameInput = document.getElementById('name')
    var ide = document.getElementById('ide')
    var canvas = document.getElementById("main");
    var ctx = canvas.getContext("2d");
    ctx.translate(0.5, 0.5);

    var colors = ['#882000', '#68d0a8', '#a838a0', '#50b818', '#181090','#f0e858','#a04800','#472b1b', '#c87870', '#98ff98', '#5090d0']

    var engine = {
      robots: [],
      width: canvas.width,
      height: canvas.height,
      init: function() {
        clearDebug()
        clearOutput()
      },
      draw: function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < this.robots.length; i++) {
          var robot = this.robots[i]
          var colorI = i
          if (colorI > colors.length - 1) {
            colorI = colorI % colors.length
          }
          ctx.strokeStyle = colors[colorI]
          ctx.beginPath();
          ctx.arc(robot.x, robot.y, robot.size, 0, 2 * Math.PI);
          ctx.stroke();

          var aX = robot.x + 6 * Math.sin(robot.direction * Math.PI / 180);
          var aY = robot.y + 6 * Math.cos(robot.direction * Math.PI / 180);
          ctx.beginPath();
          ctx.moveTo(robot.x,robot.y);
          ctx.lineTo(aX,aY);
          ctx.stroke();

          ctx.font = "8px Courier New";
          ctx.fillStyle = "white"
          ctx.fillText(robot.name + " : " + robot.energy,robot.x - robot.size,robot.y - robot.size - 5);
        }

      }
    }

    function run(){
      socket.emit("start")
    }

    function addRobot(){
      socket.emit("addRobot",ide.value,cpus.value,freq.value, nameInput.value)
    }

    function clearRoom() {
      socket.emit("clear")
    }

    function stopProgram(){
      socket.emit("stop")
    }

    function closeInstructions() {
      document.getElementById("instructions").style.display="none";
    }

    function openInstructions() {
      document.getElementById("instructions").style.display="block";
    }

    function errorOff(line) {
      addToOutput("Runtime error on line " + line)
    }

    function clearDebug(){
      debugDiv.innerHTML = ""
    }
    function clearOutput(){
      outputDiv.innerHTML = ""
    }

    function addToOutput(text) {
      outputDiv.innerHTML += "</br>"
      outputDiv.innerHTML += text
    }

    function addToDebug(text) {
      debugDiv.innerHTML += "</br>"
      debugDiv.innerHTML += text
    }

    function createRoom() {
      var roomName = document.getElementById("roomName").value
      if (roomName !== "") {
        socket.emit("createRoom", roomName, false);
      } else {
        alert("Please provide a room name.")
      }
    }

    function joinRoom(room) {
      if (room !== "") {
        socket.emit("enterRoom", room)
        console.log(room)
      }
    }

    function leaveRoom() {
      socket.emit("leaveRoom")
    }


    function bind() {
        socket.on("connect", () => {
        });

        socket.on("disconnect", () => {

        });

        socket.on("error", () => {

        });

        socket.on("message", (message) => {
          addToOutput(message)
        });

        socket.on("createdRoom", (name) => {
          console.log(name)
          socket.emit("enterRoom", name)
        });

        socket.on("enteredRoom", (name) => {
          console.log("Entered",name)
          document.getElementById("notInRoom").style.display="none";
          document.getElementById("inRoom").style.display="block";
        });

        socket.on("leftRoom", (name) => {
          document.getElementById("notInRoom").style.display="block";
          document.getElementById("inRoom").style.display="none";
        });

        socket.on("update", (robots) => {
          engine.robots = robots
          engine.draw()
        });

        socket.on("shoot", (shooter, shot) => {
          addToOutput(shooter + " shot " + shot)
          //play sound
        });

        socket.on("alert",(msg) => {
          alert(msg)
        })

        socket.on("availableRooms", (rooms) => {
          var roomsDiv = document.getElementById("rooms");
          roomsDiv.innerHTML = "<tr><th>Name</th><th>Number of Users</th><th></th></tr>"
          if (rooms.length === 0) {
            roomsDiv.innerHTML += "<tr><td colspan='3'> Data Unavailable.</td></tr>"
          }
          for (var i in rooms) {
            var room = rooms[i]
            roomsDiv.innerHTML += "<tr><td>"+room.name + "</td><td>" + room.numUsers + "</td><td>   <button onclick='joinRoom(\""+room.name+"\")'>join</button></td></tr>"

          }
        })
    }

    /**
     * Client module init
     */
    function init() {
        socket = io({ upgrade: false, transports: ["websocket"] });
        bind()
    }

    window.addEventListener("load", init, false);
