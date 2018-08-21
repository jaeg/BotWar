class Interpreter {
  constructor(program, robot) {
    var that = this
    this.robot = robot
    this.variables = []
    this.controlTable = []
    this.position = 0
    this.labelTable = []
    this.commands = []
    this.errorState = ""

    this.labelTable = program.labelTable
    this.commands = program.commands

    this.controlTable["print"] = function(command) {
      if (command.value.type == "string" || command.value.type == "number") {
        addToOutput(command.value.value)
      } else if (command.value.type == "variable") {
        addToOutput(that.variables[command.value.value])
      }else {
        addToOutput(that.solve(command.value))
      }
    }

    this.controlTable["move"] = function(command) {
      var direction = 0
      var speed = 0
      if (command.direction.type == "number") {
        direction = parseInt(command.direction.value)
      } else if (command.direction.type == "variable") {
        direction = that.variables[command.direction.value]
      }else {
        direction =that.solve(command.direction)
      }

      if (command.speed.type == "number") {
        speed = parseInt(command.speed.value)
      } else if (command.speed.type == "variable") {
        speed = that.variables[command.speed.value]
      }else {
        speed =that.solve(command.speed)
      }

      that.robot.x += speed * Math.sin(direction * Math.PI / 180);
      that.robot.y += speed * Math.cos(direction * Math.PI / 180);
      that.robot.direction = direction
    }

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
          } else {
            that.position++
          }
        }
      }
    }

    this.controlTable["endif"] = function(command){}


    this.controlTable["assign"] = function(command) {
      if (command.value.type == "string" || command.value.type == "number") {
        that.variables[command.variable] = command.value.value
      } else {
        that.variables[command.variable] = that.solve(command.value)
      }
    }

    this.controlTable["goto"] = function(command) {
      var goto = 0

      goto = that.labelTable[command.value] - 1

      that.position = goto
    }


    this.functionTable = []
    this.functionTable["getX"] = function(params) {
      return that.robot.x
    }

    this.functionTable["getY"] = function(params) {
      return that.robot.y
    }

    this.functionTable["getDir"] = function(params) {
      return that.robot.direction
    }

    this.functionTable["sin"] = function(params) {
      if (params.length > 0) {
        var a = params[0].value
        if (params[0].type === "op") {
           a = that.solve(params[0])
        }

        return Math.sin(a)
      }
      throw "Not enough params"
    }

    this.functionTable["cos"] = function(params) {
      if (params.length > 0) {
        var a = params[0].value
        if (params[0].type === "op") {
           a = that.solve(params[0])
        }

        return Math.cos(a)
      }
      throw "Not enough params"
    }

    this.functionTable["rand"] = function(params) {
      if (params.length > 1) {
        var a = params[0].value
        if (params[0].type === "op") {
           a = that.solve(params[0])
        }

        var b = params[1].value
        if (params[1].type === "op") {
           b = that.solve(params[1])
        }
        a = parseInt(a)
        b = parseInt(b)

        var results = Math.floor(Math.random() * b) + a
        return results
      }
      throw "Not enough params"
    }
  }

  restart() {
    this.variables = []
    this.position = 0
    this.errorState = ""
  }

  step() {
    if (this.errorState === "") {
      if (this.position < this.commands.length) {
        var command = this.commands[this.position]
        if (this.controlTable[command.cmd] != undefined) {
          try {
            this.controlTable[command.cmd](command)
          } catch (e) {
            console.log(e)
            this.errorState = e
          }
        } else {
          console.log("Runtime Error")
          this.errorState = e
        }
        this.position++
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
