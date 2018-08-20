var outputDiv = document.getElementById('output')
var debugDiv = document.getElementById('debug')
var ide = document.getElementById('ide')

class Tokenizer {
  tokenize(input) {
    console.log("Raw input:",input)
    //Clean up input and chunk it apart.
    var inputChunked = []
    for (var lineI = 0; lineI < input.length; lineI++) {
      var tokenizedLine = input[lineI].split(/([^a-zA-Z0-9])/g)
      inputChunked[lineI] = []
      for (var i=0; i < tokenizedLine.length; i++){
        if (tokenizedLine[i].trim() !== "") {
          inputChunked[lineI].push(tokenizedLine[i])
        }
      }
    }

    //Get rid of empty lines
    for (var lineI = 0; lineI < inputChunked.length; lineI++) {
      if (inputChunked[lineI].length === 0) {
        inputChunked.splice(lineI, 1)
        lineI--
      }
    }

    console.log("Raw input chunked and cleaned:",inputChunked)

    var state = "search" //state = string, number
    var specialCharacters = ["=","+","-","*","/","<",">","(",")","!"]
    var builtInfunctions = ["getX","getY","sin","cos","tan","rand"]
    var controlFunctions = ["if","endif","goto","print","move","else"]

    //Go through each line and create tokens.
    var tokenizedProgram = []
    var tempToken = ""
    for (var lineI = 0; lineI < inputChunked.length; lineI++) {
      for (var chunkI = 0; chunkI < inputChunked[lineI].length; chunkI++) {
        var chunk = inputChunked[lineI][chunkI]
        switch (state) {
          case "search":
            tempToken = ""
            if (specialCharacters.indexOf(chunk) != -1) {
              var type = "op"
              if (chunk === "=") {
                type = "equals"
              }
              if (chunk === "(" || chunk === ")") {
                type = "paren"
              }
              if (chunk === "!") {
                if (chunkI < inputChunked[lineI].length - 1) {
                  if (specialCharacters.indexOf(inputChunked[lineI][chunkI+1]) != -1) {
                    chunk += inputChunked[lineI][chunkI+1]
                    chunkI++
                  }
                }
              }
              tokenizedProgram.push(new Token(chunk, type))
              break
            } else if (isNaN(chunk) === false) {
              state = "number"
              tempToken = chunk
            } else if (chunk === '"') {
                state = "string"
            } else if (builtInfunctions.indexOf(chunk) != -1) {
              tokenizedProgram.push(new Token(chunk, "function"))
            } else if (controlFunctions.indexOf(chunk) != -1) {
              tokenizedProgram.push(new Token(chunk, "control"))
            } else {
              state = "word"
              tempToken = chunk
            }

            if (chunkI === inputChunked[lineI].length - 1 && lineI === inputChunked.length - 1) {
              tokenizedProgram.push(new Token(chunk, state))
            }
          break;
          //Numbers need to check for decimal points.  After the first one add the next number to the string
          //otherwise add the token.
          case "number":
            if (chunk === ".") {
              tempToken += "."
            } else if (tempToken[tempToken.length - 1] === ".") {
              if (isNaN(chunk)) {
                errorOff("Failed to tokenize line " + lineI)
                return
              } else {
                tempToken += chunk
              }

            } else {
              tokenizedProgram.push(new Token(tempToken, "number"))
              state = "search"
              chunkI-- //We take a step back so we make sure the scan search state can check it out
            }
          break;
          //Keep adding tokens till we hit another quotation mark.
          case "string":
            if (chunk === '"') {
              tokenizedProgram.push(new Token(tempToken, "string"))
              state = "search"
            } else {
              if (tempToken != "") {
                tempToken += " "
              }
              tempToken += chunk
            }
          break;
          case "word":
            if (chunk === "_") {
              tempToken += chunk
            } else if (chunk === ":"){ //Colons indicate labels.
              tokenizedProgram.push(new Token(tempToken, "label"))
              state = "search"
            } else {
              tokenizedProgram.push(new Token(tempToken, "word"))
              state = "search"
              chunkI--
            }
        }
      }
    }

    console.log("Program:",tokenizedProgram)
    return {tokens: tokenizedProgram}
  }
}

class Token {
  constructor(value, type) {
    this.value = value
    this.type = type
  }
}
