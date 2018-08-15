var outputDiv = document.getElementById('output')
var debugDiv = document.getElementById('debug')
var ide = document.getElementById('ide')
var canvas = document.getElementById("main");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
var ctx = canvas.getContext("2d");


class Robot{
  constructor(program) {
    this.x = canvas.width / 2
    this.y = canvas.height / 2
    this.direction = 0
    this.program = program
    this.tokenizedProgram = []
    this.currentLine = 0
    this.stopProgram = true
    this.labelTable = []
    this.variableTable = []
  }
  run() {

  }
  compile() {
    this.labelTable = []
    this.variableTable = []

    for (var line = 0; line < this.program.length; line++) {
      var tokenizedLine = this.program[line].split(/([^a-zA-Z0-9])/g)
      this.tokenizedProgram[line] = []
      for (i=0; i < tokenizedLine.length; i++){
        if (tokenizedLine[i].trim() !== "") {
          this.tokenizedProgram[line].push(tokenizedLine[i])
        }
      }
    }

    for (var line = 0; line < this.tokenizedProgram.length; line++){
      var tokens = this.tokenizedProgram[line]
      //Labels will only have 2 tokens
      if (tokens.length == 2){
        //Colons (:) are labels
        if (tokens[1] === ':'){
          if (functionTable[tokens[0]] == undefined) {
            this.labelTable[tokens[0]] = line
          } else {
            return false
          }
        }
      }
      //Other compile related stuff can go here

    }

    //Fun debug stuff.
    addToDebug("Label Map:")
    for (var label in this.labelTable) {
      addToDebug(label + ":" + this.labelTable[label])
    }

    addToDebug("Tokenized Program:")
    for (var i = 0; i < this.tokenizedProgram.length; i++) {
      addToDebug(i + ":"  + this.tokenizedProgram[i])
    }
    return true;
  }

  stepProgram() {
    while (this.currentLine < this.tokenizedProgram.length) {
    if (this.stopProgram)
      return
    if (this.currentLine >= this.tokenizedProgram.length) {
      this.stopProgram = true
      return
    }

    this.variableTable["x"] = this.x
    this.variableTable["y"] = this.y
    this.variableTable["dir"] = this.direction

    var tokens = this.tokenizedProgram[this.currentLine]
    if (tokens.length !== 0) {
      if (functionTable[tokens[0]] != undefined) {
         if (!functionTable[tokens[0]](tokens,this)) {
           this.stopProgram = true
           return
         } //Run the built in command.  kill if the command errors.
      } else {
        if (this.labelTable[tokens[0]] === undefined) {
          if (tokens.length >= 3) {// need minimum of 3 to do a variable assignment
            if (functionTable[tokens[0]] === undefined) {
              if (tokens[1] === "=") {
                var expression = this.reversePolishNotator(tokens.slice(2,tokens.length))
                this.variableTable[tokens[0]]=this.reversePolishNotationSolver(expression)
              }
            }
          } else {
            errorOff(this.currentLine)
            return
          }
        }
      }
    }
    if (tokens[0] === "goto") return;
    this.currentLine++

  }
  }

  reversePolishNotator(tokens) {
      var stack = [];
      var operatorStack = [];

      for (var i = 0; i < tokens.length; i++) {
          //Variable replacer
          var number = NaN
          if (this.variableTable[tokens[i]] !== undefined) {
              number = this.variableTable[tokens[i]]
          } else {
              number = parseInt(tokens[i], 10)
          }

          if (!isNaN(number)) {
              stack.push(number)
          } else {
              if (getPrecedence(tokens[i].replace("!","")) > 0) {

                  while (operatorStack.length !== 0 && getPrecedence(tokens[i].replace("!","")) <= getPrecedence(operatorStack[0])) {
                      stack.push(operatorStack.shift())
                  }
                  operatorStack.unshift(tokens[i])
              } else {
                  if (tokens[i] === "!") {
                    if (tokens[i+1] !== undefined) {
                      if (getPrecedence(tokens[i + 1]) === 2 ) {
                        tokens[i+1] = "!" + tokens[i+1]
                      }
                    }
                  }

                  if (tokens[i] === "(") {
                      operatorStack.unshift(tokens[i])
                  }

                  if (tokens[i] === ")") {
                      var done = false
                      while (!done) {
                          currentOperator = operatorStack.shift()
                          if (currentOperator === "(") {
                              done = true
                          } else {
                              stack.push(currentOperator)
                          }

                          if (operatorStack.length === 0) {
                              done = true
                          }
                      }
                  }
              }
          }
      }

      stack = stack.concat(operatorStack)
      return stack
  }

  reversePolishNotationSolver(inputStack) {
      var output = 0
      var stack = []
      for (var i = 0; i < inputStack.length; i++) {
          if (!isNaN(inputStack[i])) {
              stack.push(inputStack[i])
          } else {
              var a = stack.pop()
              var b = stack.pop()

              switch (inputStack[i]) {
                  case "+":
                      stack.push(a + b);
                      break;
                  case "-":
                      stack.push(a - b);
                      break;
                  case "*":
                      stack.push(a * b);
                      break;
                  case "/":
                      stack.push(a / b);
                      break;
                  case "=":
                    stack.push(a === b);
                    break;
                  case ">":
                    stack.push(a < b);
                    break;
                  case "<":
                    stack.push(a > b);
                    break;
                  case "!=":
                    stack.push(!(a === b));
                    break;
                  case "!>":
                    stack.push(!(a < b));
                    break;
                  case "!<":
                    stack.push(!(a > b));
                    break;
                  case "and":
                    stack.push(a && b);
                    break;
                  case "or":
                    stack.push(a || b);
                    break;
              }
          }
      }

      return stack[0]
  }
}

var functionTable = []
functionTable["goto"] = function(tokens, that) {
  if (tokens.length === 2) {
    newLine = that.labelTable[tokens[1]]
    if (newLine != undefined) {
      that.currentLine = newLine
    }
  } else {
    errorOff(that.currentLine)
    return false
  }
  return true
}

functionTable["if"] = function(tokens,that) {
  var expression = that.reversePolishNotator(tokens.slice(1,tokens.length))
  if (that.reversePolishNotationSolver(expression) == false) {
    //Skip till we see an endif.
    while(that.currentLine < that.tokenizedProgram.length && that.tokenizedProgram[that.currentLine][0] !== "endif") {
      that.currentLine++
    }
  }
  return true
}

functionTable["print"] = function(tokens, that) {
  addToOutput(tokens[1])
  return true
}

functionTable["end"] = function(tokens, that) {
  stopProgram = true;
  return true
}

functionTable["endif"] = function(tokens, that) {
  return true
}

functionTable["move"] = function(tokens, that) {
  if (tokens.length === 3) {
    var direction = parseInt(tokens[1],10)
    var speed = parseInt(tokens[2],10)
    if (isNaN(direction)) {
      direction = that.variableTable[tokens[1]]
    }

    if (isNaN(speed) ) {
      speed = that.variableTable[tokens[2]]
    }
    if (isNaN(direction) || isNaN(speed)) {
      errorOff(that.currentLine)
      return false
    }
    that.x += speed * Math.sin(direction * Math.PI / 180);
    that.y += speed * Math.cos(direction * Math.PI / 180);
    that.direction = direction
  } else {
    errorOff(that.currentLine)
    return false
  }

  return true
}

function getPrecedence(operand){
  switch (operand)
  {
    case '+':
    case '-': return 3;
    case '*':
    case '/': return 4;
    case '^': return 5;
    case 'and':
    case 'or': return 1;
    case '=':
    case '<':
    case '>': return 2;
    case '!': return -1;
    default: return 0;
  }
}


var engine = {
  robot:-1,
  init: function() {
    clearDebug()
    clearOutput()

    var program = ide.value.split(/\r?\n/)
    this.robot = new Robot(program)
    if (!this.robot.compile(program)){
      alert("Failed to compile.")
    }
  },
  update: function() {
    if (this.robot != -1) {
      this.robot.stepProgram()
    }
  },
  draw: function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'red'; // Stroke in white
    ctx.beginPath();
    ctx.arc(this.robot.x, this.robot.y, 5, 0, 2 * Math.PI);
    ctx.stroke();


  }
}

function run(){
  engine.init()
  engine.robot.stopProgram = false
}

function stop(){
  engine.robot.stopProgram = true
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

engine.init()
window.requestAnimationFrame(step);
