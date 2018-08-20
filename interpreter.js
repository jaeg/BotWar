class Interpreter {
  constructor() {
    var that = this
    this.variables = []
    this.controlTable = []
    this.position = 0
    this.labelTable = []
    this.commands = []
    this.controlTable["print"] = function(command) {
      if (command.value.type == "string" || command.value.type == "number") {
        console.log("Print",command.value.value)
      } else if (command.value.type == "variable") {
        console.log("Print",that.variables[command.value.value])
      }else {
        console.log("Print",that.solve(command.value))
      }
    }

    this.controlTable["endif"] = function(command){}

    this.controlTable["if"] = function(command) {
      var skip = 0
      if (command.value.type == "number") {
        if (parseInt(command.value.value) == 0) {
          skip = 1
        }
      } else if (command.value.type == "variable") {
        var v = that.variables[command.value.value]
        if (v == 0) {
          skip = 1
        }
      }else {
        var v = that.solve(command.value)
        if (v == 0) {
          skip = 1
        }
      }

      if (skip) {
        that.position++
        var skipNextEndIf = 0
        while (that.position < that.commands.length - 1 && skip) {
          var command = that.commands[that.position]
          if (command.cmd === "if") {
            skipNextEndIf++
          }
          if (command.cmd === "endif") {
            if (skipNextEndIf > 0) {
              skipNextEndIf--
            } else {
              skip = false
            }
          }
          that.position++
        }
      }
    }

    this.controlTable["assign"] = function(command) {
      if (command.value.type == "string" || command.value.type == "number") {
        that.variables[command.variable] = command.value.value
      } else {
        that.variables[command.variable] = that.solve(command.value)
      }

      console.log(that.variables)
    }

    this.controlTable["goto"] = function(command) {
      var goto = 0
      if (command.value.type == "string") {
        goto = that.labelTable[command.value.value]
      }
      if (command.value.type == "number") {
        goto = parseInt(command.value.value) - 1
      }

      that.position = goto
    }


    this.functionTable = []
    this.functionTable["getX"] = function(params) {
      return 128
    }

    this.functionTable["sin"] = function(params) {
      if (params.length > 0) {
        var a = params[0].value
        if (params[0].type === "op") {
           a = that.solve(params[0])
        }

        return Math.sin(a)
      }
      return "Not enough params"
    }
  }

  run(program) {
    console.log("Program",program)
    this.labels = program.labelTable
    this.commands = program.commands
    this.variables = []
    this.position = 0

    for (this.position = 0; this.position < this.commands.length; this.position++) {
      var command = this.commands[this.position]
      if (this.controlTable[command.cmd] != undefined) {
        this.controlTable[command.cmd](command)
      } else {
        console.log("Runtime Error")
      }
    }
  }

  solve(expression) {
    var left = expression.left
    var right = expression.right
    var result = ""

    if (left === undefined && right === undefined) {
      if (this.functionTable[expression.name] != undefined) {
        return this.functionTable[expression.name](expression.params)
      }
    } else {
      if (left.type === "function") {
        left = this.functionTable[left.name](left.params)
      } else if(left.type === "op") {
        left = this.solve(left)
      } else if (left.type === "variable"){
        left = this.variables[left.value]
      } else {
        left = left.value
      }

      if (right.type === "function") {
        right = this.functionTable[right.name](right.params)
      } else if (right.type === "op") {
        right = this.solve(right)
      } else if (right.type === "variable"){
        right = this.variables[right.value]
      }else {
        right = right.value
      }

      if (isNaN(left) === false && typeof left === "string") {
        if (left.indexOf(".") != -1) {
          left = parseFloat(left)
        } else {
          left = parseInt(left)
        }
      }

      if (isNaN(right) === false && typeof right === "string") {
        if (right.indexOf(".") != -1) {
          right = parseFloat(right)
        } else {
          right = parseInt(right)
        }
      }
      switch (expression.operator) {
        case "+":
          result = left + right
        break

        case "-":
          result = left - right
        break

        case "/":
          result = left / right
        break

        case "*":
          result = left * right
        break

        case "=":
          result = left === right
        break

        case "<":
          result = left < right
        break

        case ">":
          result = left > right
        break

        case "!=":
          result = left !== right
        break

        case "and":
          result = left && right
        break

        case "or":
          result = left || right
        break
      }
    }

    return result
  }
}
