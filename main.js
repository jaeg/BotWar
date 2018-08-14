var program = [];
var tokenizedProgram = [];
var outputDiv = document.getElementById('output')
var debugDiv = document.getElementById('debug')
var ide = document.getElementById('ide')

class Interpreter{
  constructor(program) {
    this.program = program
    this.tokenizedProgram = []
    this.currentLine = 0
    this.stopProgram = false
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
    console.log(this.labelTable)
    addToDebug("Label Map:")
    for (label in this.labelTable) {
      addToDebug(label + ":" + this.labelTable[label])
    }

    addToDebug("Tokenized Program:")
    for (var i = 0; i < this.tokenizedProgram.length; i++) {
      addToDebug(i + ":"  + this.tokenizedProgram[i])
    }
    return true;
  }

  stepProgram() {
    console.log(this)
    if (this.currentLine >= this.tokenizedProgram.length) {
      this.stopProgram = true
      return
    }

    var tokens = this.tokenizedProgram[this.currentLine]
    if (tokens.length !== 0) {
      if (functionTable[tokens[0]] != undefined || this.labelTable[tokens[0]] != undefined) {
         if (!functionTable[tokens[0]](tokens,this)) {return} //Run the built in command.  kill if the command errors.
      } else {
        if (tokens.length >= 3) {// need minimum of 3 to do a variable assignment
          if (functionTable[tokens[0]] === undefined) {
            if (tokens[1] === "=") {
              var expression = this.reversePolishNotator(tokens.slice(2,tokens.length))
              variableTable[tokens[0]]=this.reversePolishNotationSolver(expression)
            }
          }
        } else {
          errorOff(this.currentLine)
          return
        }
      }
    }
    this.currentLine++
    console.log(this.currentLine)

    if (!this.stopProgram) {
      var that = this
      setTimeout(function(){that.stepProgram()}, 100)
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
      console.log(stack)
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
      that.currentLine = newLine - 1
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
    while(currentLine < that.tokenizedProgram.length && that.tokenizedProgram[that.currentLine][0] !== "endif") {
      that.currentLine++
    }
  }
  return true
}

functionTable["print"] = function(tokens, that) {
  addToOutput(tokens[1])
  console.log("Test")
  return true
}

functionTable["end"] = function(tokens, that) {
  stopProgram = true;
  return true
}

functionTable["endif"] = function(tokens, that) {
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


function run(){
  clearDebug()
  clearOutput()

  var program = ide.value.split(/\r?\n/)
  var interpreter = new Interpreter(program)
  if (!interpreter.compile(program)){
    alert("Failed to compile.")
  } else {
    interpreter.stepProgram()
  }
}

function stop(){
  stopProgram = true
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
