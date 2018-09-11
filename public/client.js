"use strict";



    let socket

    var outputDiv = document.getElementById('output')
    var debugDiv = document.getElementById('debug')
    var cpus = document.getElementById('cpus')
    var freq = document.getElementById('freq')
    var ide = document.getElementById('ide')
    var canvas = document.getElementById("main");
    canvas.width = 640;
    canvas.height = 480;
    var ctx = canvas.getContext("2d");

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
          ctx.strokeStyle = 'red'; // Stroke in white
          ctx.beginPath();
          ctx.arc(robot.x, robot.y, 5, 0, 2 * Math.PI);
          ctx.stroke();

          var aX = robot.x + 6 * Math.sin(robot.direction * Math.PI / 180);
          var aY = robot.y + 6 * Math.cos(robot.direction * Math.PI / 180);
          ctx.beginPath();
          ctx.moveTo(robot.x,robot.y);
          ctx.lineTo(aX,aY);
          ctx.stroke();
        }

      }
    }

    function run(){
      socket.emit("start")
    }

    function addRobot(){
      socket.emit("addRobot",ide.value,cpus.value,freq.value)
    }


    function stopProgram(){
      socket.emit("stop")
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
      }
    }

    function joinRoom(room) {
      if (room !== "") {
        socket.emit("enterRoom", room)
        console.log(room)
      }
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
          docuemnt.getElementById("inRoom").style.display="none";
        });

        socket.on("update", (robots) => {
          engine.robots = robots
          engine.draw()
        });

        socket.on("alert",(msg) => {
          alert(msg)
        })

        socket.on("availableRooms", (rooms) => {
          var roomsDiv = document.getElementById("rooms");
          roomsDiv.innerHTML = ""
          for (var room in rooms) {
            roomsDiv.innerHTML += "<li>"+rooms[room]+"   <button onclick='joinRoom(\""+rooms[room]+"\")'>join</button></li>"
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
