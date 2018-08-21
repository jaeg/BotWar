/*
label table
variable table
function table - rand(), sin(x), cos(x), getX(), getY()
control table - if, endif, print, move

*/
class Parser {
  constructor() {
    this.position = 0
    this.tokens = []
  }
  //Prepare goes through the tokens and creates a syntax tree
  prepare(program) {
    this.tokens = program.tokens
    program.labelTable = []
    var commands = []

    while (this.position < this.tokens.length - 1) {
      if (this.currentToken().type === "word") {
        var word = this.currentToken()
        this.position++
        if (this.currentToken().type === "equals") {
          this.position++
          commands.push({cmd:"assign", variable:word.value, value: this.getExpression()})
        }
      } else if (this.currentToken().type === "label") {
        program.labelTable[this.currentToken().value] = commands.length
        this.position++
      } else if (this.currentToken().type === "control") {
        var token = this.currentToken()
        switch (token.value) {
          case "print":
            this.position++
            var expression = this.getExpression()
            commands.push({type:"control",cmd:"print", value:expression})
          break;

          case "goto":
            this.position++
            var location = this.currentToken().value
            commands.push({type:"control",cmd:"goto", value:location})
            this.position++
          break;

          case "if":
            this.position++
            var expression = this.getExpression()
            commands.push({type:"control", cmd:"if", value:expression})
            break;

          case "endif":
            commands.push({type:"control", cmd:"endif"})
            this.position++
            break;

          case "move":
          this.position++
          var direction = this.getExpression()
          var speed = this.getExpression()
          commands.push({type:"control", cmd:"move", direction:direction, speed:speed})
          break;

          default: this.position++
        }
      } else {
        return "Error, cannot compile: " + this.position + ":" + this.currentToken().type + ":" + this.currentToken().value
      }
    }

    program.commands = commands
    return program
  }

  currentToken() {
    return this.tokens[this.position]
  }

  nextToken() {
    return this.tokens[this.position + 1]
  }

  previousToken() {
    return this.tokens[this.position - 1]
  }

  getExpression() {
    var expression = this.getAtomic()
    while (this.currentToken() !== undefined && (this.currentToken().type === "op" || this.currentToken().type === "equals" || this.currentToken().value === "or" || this.currentToken().value === "and")) {
      var token = this.currentToken()
      this.position++
      var right = this.getAtomic()
      expression = {type: "op", operator:token.value, right: right, left: expression}
    }

    return expression
  }

  getAtomic() {
    var command = null
    if (this.currentToken().type === "word") {
      command = {type:"variable", value:this.currentToken().value}
    } else if (this.currentToken().type === "string") {
      command = {type:"string", value:this.currentToken().value}
    } else if (this.currentToken().type === "number") {
      command = {type:"number", value:this.currentToken().value}
    } else if (this.currentToken().type === "function") {
      var functionName = this.currentToken().value
      this.position++
      var params = []
      while (this.currentToken() != undefined && this.currentToken().value != ")") {
        if (this.currentToken().value === "(" || this.currentToken().value === ",") {
          this.position++
        } else {
          var expression = this.getExpression()
          if (expression !== null) {
            params.push(expression)
          }
        }
      }
      command = {type:"function", name:functionName, params: params}
    } else if (this.currentToken().value === "(") {
      this.position++
      command = this.getExpression()
    } else if (this.currentToken().value === "-") {
      this.position++
      command = {type:"number", value:"-" + this.currentToken().value}
    }

    this.position++
    return command
  }
}
