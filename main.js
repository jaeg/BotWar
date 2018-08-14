var program = [];
var tokenizedProgram = [];
var outputDiv = document.getElementById('output')
var debugDiv = document.getElementById('debug')
var ide = document.getElementById('ide')

var functionTable = ["if","endif","goto", "print","dim","end"]
var labelTable = []
var variableTable = []
var currentLine = 0
var stopProgram = false

//Returns false if fails to compile.
function compile(program) {
  functionTable = ["if","endif","goto", "print","dim","end"]
  labelTable = []
  variableTable = []

  for (var line = 0; line < program.length; line++) {
    var tokenizedLine = program[line].split(/([$&+,:;=?@#|'<>.-^*()%! ])/g)
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
        if (functionTable.indexOf(tokens[0]) == -1) {
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

function stepProgram() {
  if (currentLine >= tokenizedProgram.length) {
    return
  }

  tokens = tokenizedProgram[currentLine]
  if (tokens.length !== 0) {
    if ((functionTable.indexOf(tokens[0]) != -1 || labelTable[tokens[0]] != undefined || variableTable[tokens[0]] != undefined)) {
      switch(tokens[0]) {
        case "goto":
          //goto has 1 param
          if (tokens.length === 2) {
            newLine = labelTable[tokens[1]]
            if (newLine != undefined) {
              currentLine = newLine - 1
            }
          } else {
            errorOff(currentLine)
            return
          }
          break
        case "if":
          //test if
          if (tokens[1] === "0") {
            //Skip till we see an endif.
            while(tokenizedProgram[line][0] !== "endif" || line < tokenizedProgram.length) {
              currentLine++
            }
          }
          break
        case "print":
            console.log(tokens[1])
            addToOutput(tokens[1])
            break
        case "end":
          stopProgram = true;
          break
        case "endif":
          break
      }
    } else {
      errorOff(currentLine)
      return
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
