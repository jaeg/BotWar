var outputDiv = document.getElementById('output')
var debugDiv = document.getElementById('debug')
var ide = document.getElementById('ide')
var canvas = document.getElementById("main");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
var ctx = canvas.getContext("2d");

var engine = {
  init: function() {
    clearDebug()
    clearOutput()

    var program = ide.value.split(/\r?\n/)
    var tokenizer = new Tokenizer()
    tokenizedProgram = tokenizer.tokenize(program)
    var parser = new Parser()
    var parsed = parser.prepare(tokenizedProgram)
    this.interpreter = new Interpreter(parsed)
  },
  update: function() {
    this.interpreter.step()
  },
  draw: function() {
    /*
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
    ctx.stroke();*/

  }
}

var stop = false
function run(){
  engine.init()
  stop = false
  step()
}


function stopProgram(){
  stop = true
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
  if (!stop) {
    window.requestAnimationFrame(step);
  }
}
