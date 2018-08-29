"use strict";

(function () {

    let socket

    var outputDiv = document.getElementById('output')
    var debugDiv = document.getElementById('debug')
    var cpus = document.getElementById('cpus')
    var freq = document.getElementById('freq')
    var ide = document.getElementById('ide')
    var canvas = document.getElementById("main");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
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
      socket.emit("run")
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

        socket.on("update", (robots) => {
          engine.robots = robots
          engine.draw()
        })
    }

    /**
     * Client module init
     */
    function init() {
        socket = io({ upgrade: false, transports: ["websocket"] });
    }

    window.addEventListener("load", init, false);

})();
