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
  robot: new Robot(""),
  init: function() {
    clearDebug()
    clearOutput()

    var program = ide.value.split(/\r?\n/)

    this.robot = new Robot(program, parseInt(cpus.value), parseInt(freq.value), 100, 75, 0)

    this.robot.start()
  },
  update: function() {

  },
  draw: function() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'red'; // Stroke in white
    ctx.beginPath();
    ctx.arc(this.robot.x, this.robot.y, 5, 0, 2 * Math.PI);
    ctx.stroke();

    var aX = this.robot.x + 6 * Math.sin(this.robot.direction * Math.PI / 180);
    var aY = this.robot.y + 6 * Math.cos(this.robot.direction * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(this.robot.x,this.robot.y);
    ctx.lineTo(aX,aY);
    ctx.stroke();

  },
  stop: function() {
    this.robot.stop()
  }
}

function run(){
  engine.stop()
  engine.init()
}


function stopProgram(){
  engine.stop()
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


function step() {
  engine.update();
  engine.draw();
  window.requestAnimationFrame(step);
}

step()
