"use strict";

/**
/
/ BASIC stuff
/
**/
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
        for (var user in that.robot.room.users) {
            that.robot.room.users[user].socket.emit("message",that.robot.name + ":" + command.value.value)
        }
      } else if (command.value.type == "variable") {
        for (var user in that.robot.room.users) {
            that.robot.room.users[user].socket.emit("message",that.robot.name + ":" + that.variables[command.value.value])
        }
      }else {
        for (var user in that.robot.room.users) {
            that.robot.room.users[user].socket.emit("message",that.robot.name + ":" + that.solve(command.value))
        }
      }
    }

    this.controlTable["shoot"] = function(command) {
        var direction = 0

        if (command.direction.type == "number") {
          direction = parseInt(command.direction.value)
        } else if (command.direction.type == "variable") {
          direction = that.variables[command.direction.value]
        }else {
          direction =that.solve(command.direction)
        }

        var p1 = {x:that.robot.x, y:that.robot.y}

        var aX = that.robot.x + 100 * Math.sin(direction * Math.PI / 180);
        var aY = that.robot.y + 100 * Math.cos(direction * Math.PI / 180);
        var p2 = {x:aX, y:aY}

        var robots = that.robot.room.robots
        that.robot.energy--

        for (var i in robots) {
          if (robots[i] === that.robot) {
            continue;
          }
          var circle = {center:{x:robots[i].x, y:robots[i].y}, radius: robots[i].size}
          var points = inteceptCircleLineSeg(circle, {p1:p1, p2:p2})
          if (points.length > 0) {
            robots[i].energy -=  2
            var room = that.robot.room
            for (var i = 0; i < room.users.length; i++) {
              room.users[i].socket.emit("shoot", that.robot.name, robots[i].name)
            }
            return 1
          }
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

      that.robot.vX += parseFloat((speed * Math.sin(direction * Math.PI / 180)).toFixed(2));
      that.robot.vY += parseFloat((speed * Math.cos(direction * Math.PI / 180)).toFixed(2));
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
          } else if (skipNextEndIf === 0 && command.cmd === "else") {
            skip = false
          } else {
            that.position++
          }
        }
      }
    }

    this.controlTable["endif"] = function(command){}

    this.controlTable["else"] = function(command){
      that.position++
      var skipNextEndIf = 0
      var skip = true
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
    this.functionTable["scan"] = function(params) {
      if (params.length === 1) {
        var direction = params[0].value
        if (params[0].type === "op") {
           direction = that.solve(params[0])
        }

        if (params[0].type == "variable") {
          direction = that.variables[params[0].value]
        }

        var p1 = {x:that.robot.x, y:that.robot.y}

        var aX = that.robot.x + 100 * Math.sin(direction * Math.PI / 180);
        var aY = that.robot.y + 100 * Math.cos(direction * Math.PI / 180);
        var p2 = {x:aX, y:aY}

        var robots = that.robot.room.robots
        for (var i in robots) {
          if (robots[i] === that.robot) {
            continue;
          }
          var circle = {center:{x:robots[i].x, y:robots[i].y}, radius: robots[i].size}
          var points = inteceptCircleLineSeg(circle, {p1:p1, p2:p2})
          if (points.length > 0) {
            return 1
          }
        }
      }
      return 0
    }

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

        if (params[0].type == "variable") {
          a = that.variables[params[0].value]
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

        if (params[0].type == "variable") {
          a = that.variables[params[0].value]
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

        if (params[0].type == "variable") {
          a = that.variables[params[0].value]
        }

        var b = params[1].value
        if (params[1].type === "op") {
           b = that.solve(params[1])
        }
        if (params[1].type == "variable") {
          b = that.variables[params[1].value]
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

class Tokenizer {
  tokenize(input) {
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



    var state = "search" //state = string, number
    var specialCharacters = ["=","+","-","*","/","<",">","(",")","!"]
    var builtInfunctions = ["getX","getY","sin","cos","tan","rand","scan"]
    var controlFunctions = ["if","endif","goto","print","move","else","shoot"]

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


    return {tokens: tokenizedProgram}
  }
}

class Token {
  constructor(value, type) {
    this.value = value
    this.type = type
  }
}

var friction = 0.2
class Robot {
  constructor(program, cpu, clock, x, y, direction, room, name) {
    var tokenizer = new Tokenizer()
    var tokenizedProgram = tokenizer.tokenize(program)
    var parser = new Parser()
    var parsed = parser.prepare(tokenizedProgram)
    if (typeof parsed !== "string") {
      this.interpreter = new Interpreter(parsed, this)
    } else {
      this.stopped = true
    }

    this.size = 5
    this.energy = 50
    this.name = name || "Default"


    this.cpu = cpu
    this.clock = clock
    this.cycle = 0
    this.stopped = false

    this.x = x
    this.y = y

    this.vX = 0
    this.vY = 0
    this.direction = direction

    this.room = room
  }

  start() {
    this.stopped = false
    var that = this
  }

  stop() {
    this.stopped = true
  }

  update() {
    if (this.stopped === false && this.energy > 0) {
      this.cycle++
    }
    if (this.cycle >= this.clock) {
      this.process()
      this.energy--
      this.cycle = 0
    }

    if (!this.stopped && this.energy < 1) {
      this.stopped = true
      this.energy = 0
      var room = this.room
      for (var i = 0; i < room.users.length; i++) {
        room.users[i].socket.emit("message", this.name + " has been taken offline!")
      }
      var that = this
      setTimeout(function() {
        that.room.robots.splice(that.room.robots.indexOf(that), 1);
      }, 1000)
    }
    //Add velocity
    this.x += this.vX
    this.y += this.vY

    //Deal with friction
    if (this.vX > 0) {
      this.vX -= friction
    }
    else if (this.vX < 0) {
      this.vX += friction
    }

    if (this.vY > 0) {
      this.vY -= friction
    }
    else if (this.vY < 0) {
      this.vY += friction
    }

    //Deal with the edge of the arena
    if (this.x > this.room.width) {
      this.x = this.room.width
      this.vx = 0
    }

    if (this.x < 0) {
      this.x = 0
      this.vx = 0
    }

    if (this.y > this.room.height) {
      this.y = this.room.height
      this.vy = 0
    }

    if (this.y < 0) {
      this.y = 0
      this.vy = 0
    }

    //Deal with annoying javascript math
    this.vY = parseFloat(this.vY.toFixed(2))
    this.vX = parseFloat(this.vX.toFixed(2))
    this.x = parseFloat(this.x.toFixed(2))
    this.y = parseFloat(this.y.toFixed(2))

  }

  process() {
    if (this.interpreter != undefined) {
      var step = 0
      while (step < this.cpu) {
        this.interpreter.step()
        step++
      }
    }

  }

  reboot() {
    this.stop()
    this.interpreter.restart()
    this.start()
  }
}

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
          case "else":
            commands.push({type:"control", cmd:"else"})
            this.position++
            break;
            case "move":
            this.position++
            var direction = this.getExpression()
            var speed = this.getExpression()
            commands.push({type:"control", cmd:"move", direction:direction, speed:speed})
            break;

            case "shoot":
            this.position++
            var direction = this.getExpression()
            commands.push({type:"control", cmd:"shoot", direction:direction})
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




/**
 * User sessions
 * @param {Array} users
 */
const users = [];
var rooms = []

function removeUser(user) {
	users.splice(users.indexOf(user), 1);
}
/**
 * User session class
 */
class User {

	/**
	 * @param {Socket} socket
	 */
	constructor(socket) {
		this.socket = socket;
		this.currentRoom = null
		this.name = "anon"
	}

	draw() {

	}
}

class Room {
	constructor(owner, locked) {
		this.owner = owner
		this.locked = locked
    this.users = []
		this.users = []
		this.robots = []
		this.width = 600
		this.height = 300
    this.running = false
	}

  clear() {
    this.robots = []
  }

  start(user) {
    if (user === this.owner) {
      this.running = true
      for (var i = 0; i < this.users.length; i++) {
        this.users[i].socket.emit("message", "Simulation started")
      }
    } else {
      user.socket.emit("message", "You are not the room owner.  You can't start the simulation.")
    }
  }

  stop(user) {
    if (user === this.owner) {
      this.running = false
      for (var i = 0; i < this.users.length; i++) {
        this.users[i].socket.emit("message", "Simulation stoped")
      }
    } else {
      user.socket.emit("message", "You are not the room owner.  You can't stop the simulation.")
    }
  }

	update() {
    if (this.running) {
      for (var i = 0; i < this.robots.length; i++) {
        this.robots[i].update()
      }
    }

	}

	addUser(user) {
		if (this.users.indexOf(user) === -1 && this.locked === false) {
					this.users.push(user)
		}
	}

	removeUser(user) {
		if (this.users.indexOf(user) != -1) {
			this.users = this.users.slice(this.users.indexOf(user)+1)
		}
    var that = this
    if (this.users.length === 0) {
      setTimeout(function() {
        if (that.users.length === 0) {
          rooms = rooms.slice(rooms.indexOf(that)+1)
        }
      },5000)
    }
	}
}

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = {

	io: (socket) => {
		const user = new User(socket);
		users.push(user);

		socket.on("disconnect", () => {
			console.log("Disconnected: " + socket.id);
      if (user.currentRoom != null) {
        rooms[user.currentRoom].removeUser(user)
      }
			removeUser(user);
		});

    socket.on("setName", (name) => {
			user.name = name
		})

    socket.on("clear", () => {
      if (rooms[user.currentRoom] != undefined) {
        if (rooms[user.currentRoom].owner === user) {
          rooms[user.currentRoom].clear()
          socket.emit("message","Cleared room")
        } else {
          socket.emit("alert", "not owner");
        }
      }
    })

		socket.on("createRoom", (name, locked) => {
      if (name !== "") {
        rooms[name] = new Room(user, locked)
        socket.emit("createdRoom", name);
      } else {
        socket.emit("alert","No room name specified.")
      }

		});

		socket.on("enterRoom", (name) => {
      if (rooms[name] != undefined) {
        if (rooms[name].locked === false || rooms[name].owner === user) {
          rooms[name].addUser(user)
          user.currentRoom = name
          socket.emit("enteredRoom", name);
          console.log("Entered")
        } else {
          socket.emit("alert", name + " : locked");
          console.log("Locked")
        }
      }
		});

		socket.on("leaveRoom", (name) => {
      if (user.currentRoom != null) {
        rooms[user.currentRoom].removeUser(user)
        user.currentRoom = null
        socket.emit("leftRoom");
      }
		});

    socket.on("start", () => {
        if (rooms[user.currentRoom] !== null) {
          rooms[user.currentRoom].start(user)
        }

    })

    socket.on("stop", () => {
        if (rooms[user.currentRoom] !== null) {
          rooms[user.currentRoom].stop(user)
        }

    })

    socket.on("addRobot",(program,cpu,clock, name) => {
      if (user.currentRoom != null) {
        var splitProgram = program.split(/\r?\n/)
        var robot = new Robot(splitProgram, cpu, clock, 150, 150, 0, rooms[user.currentRoom], name)
        rooms[user.currentRoom].robots.push(robot)
        socket.emit("message",name + " has entered the arena.")
      }
    })

		console.log("Connected: " + socket.id);
	},
	editor: (req, res) => {
		res.send(`Editor`)
	}
};

function inteceptCircleLineSeg(circle, line){
    var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = line.p2.x - line.p1.x;
    v1.y = line.p2.y - line.p1.y;
    v2.x = line.p1.x - circle.center.x;
    v2.y = line.p1.y - circle.center.y;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
    if(isNaN(d)){ // no intercept
        return [];
    }
    u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
    u2 = (b + d) / c;
    retP1 = {};   // return points
    retP2 = {}
    ret = []; // return array
    if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
        retP1.x = line.p1.x + v1.x * u1;
        retP1.y = line.p1.y + v1.y * u1;
        ret[0] = retP1;
    }
    if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
        retP2.x = line.p1.x + v1.x * u2;
        retP2.y = line.p1.y + v1.y * u2;
        ret[ret.length] = retP2;
    }
    return ret;
}

function update() {
  for (var room in rooms) {
      if (rooms[room].users.length > 0) {
        rooms[room].update()
        for (var i = 0; i < rooms[room].users.length; i++) {
          var robots = []
          for (var index in rooms[room].robots) {
            var robot = rooms[room].robots[index]
            robots.push({x:robot.x, y:robot.y, direction:robot.direction, size:robot.size, name: robot.name, energy: robot.energy})
          }
          rooms[room].users[i].socket.emit("update", robots)
        }
      }
  }

	setTimeout(update, 100)
}

function availableRoomUpdater() {
  var availableRooms = []
  for (var room in rooms) {
    availableRooms.push({name:room, numUsers:rooms[room].users.length})
  }

  for (var id in users) {
    users[id].socket.emit("availableRooms",availableRooms)
  }
  setTimeout(availableRoomUpdater, 1000)
}

setTimeout(update, 100)
setTimeout(availableRoomUpdater, 100)
