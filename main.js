var program = [];
var tokenizedProgram = [];
var outputDiv = document.getElementById('output')
var debugDiv = document.getElementById('debug')
var ide = document.getElementById('ide')

var functionTable = ["if","endif","goto", "print","end"]
functionTable["goto"] = function(tokens) {
  if (tokens.length === 2) {
    newLine = labelTable[tokens[1]]
    if (newLine != undefined) {
      currentLine = newLine - 1
    }
  } else {
    errorOff(currentLine)
    return false
  }
  return true
}

functionTable["if"] = function(tokens) {
  var expression = reversePolishNotator(tokens.slice(1,tokens.length))
  console.log(expression)
  if (reversePolishNotationSolver(expression) == false) {
    //Skip till we see an endif.
    while(currentLine < tokenizedProgram.length && tokenizedProgram[currentLine][0] !== "endif") {
      currentLine++
    }
  }
  return true
}

functionTable["print"] = function(tokens) {
  addToOutput(tokens[1])
  return true
}

functionTable["end"] = function(tokens) {
  stopProgram = true;
  return true
}

functionTable["endif"] = function(tokens) {
  return true
}

var labelTable = []
var variableTable = []
var currentLine = 0
var stopProgram = false

//Returns false if fails to compile.
function compile(program) {
  labelTable = []
  variableTable = []

  for (var line = 0; line < program.length; line++) {
    var tokenizedLine = program[line].split(/([^a-zA-Z0-9])/g)
    tokenizedProgram[line] = []
    for (i=0; i < tokenizedLine.length; i++){
      if (tokenizedLine[i].trim() !== "") {
        tokenizedProgram[line].push(tokenizedLine[i])
      }
    }
  }

  for (var line = 0; line < tokenizedProgram.length; line++){
    console.log(line);
    tokens = tokenizedProgram[line]
    //Labels will only have 2 tokens
    if (tokens.length == 2){
      //Colons (:) are labels
      if (tokens[1] === ':'){
        if (functionTable[tokens[0]] == undefined) {
          labelTable[tokens[0]] = line
        } else {
          return false
        }
      }
    }
    //Other compile related stuff can go here

  }

  //Fun debug stuff.
  console.log(labelTable)
  addToDebug("Label Map:")
  for (label in labelTable) {
    addToDebug(label + ":" + labelTable[label])
  }

  addToDebug("Tokenized Program:")
  for (var i = 0; i < tokenizedProgram.length; i++) {
    addToDebug(i + ":"  + tokenizedProgram[i])
  }
  return true;
}

function reversePolishNotator(tokens) {
    stack = [];
    operatorStack = [];

    for (var i = 0; i < tokens.length; i++) {
        //Variable replacer
        var number = NaN
        if (variableTable[tokens[i]] !== undefined) {
            number = variableTable[tokens[i]]
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

function reversePolishNotationSolver(inputStack) {
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


function stepProgram() {
  if (currentLine >= tokenizedProgram.length) {
    stopProgram = true
    return
  }

  tokens = tokenizedProgram[currentLine]
  if (tokens.length !== 0) {
    if (functionTable[tokens[0]] != undefined || labelTable[tokens[0]] != undefined) {
       if (!functionTable[tokens[0]](tokens)) {return} //Run the built in command.  kill if the command errors.
    } else {
      if (tokens.length >= 3) {// need minimum of 3 to do a variable assignment
        if (functionTable[tokens[0]] === undefined) {
          if (tokens[1] === "=") {
            var expression = reversePolishNotator(tokens.slice(2,tokens.length))
            variableTable[tokens[0]]=reversePolishNotationSolver(expression)
          }
        }
      } else {
        errorOff(currentLine)
        return
      }
    }
  }

  currentLine++

  if (!stopProgram) {
    setTimeout(stepProgram, 100)
  }
}

function run(){
  currentLine = 0
  stopProgram = false
  clearDebug()
  clearOutput()

  var program = ide.value.split(/\r?\n/)
  if (!compile(program)){
    alert("Failed to compile.")
  } else {
    stepProgram()
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
