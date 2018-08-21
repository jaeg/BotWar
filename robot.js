var friction = 0.2
class Robot {
  constructor(program, cpu, clock, x, y, direction) {
    var tokenizer = new Tokenizer()
    var tokenizedProgram = tokenizer.tokenize(program)
    var parser = new Parser()
    var parsed = parser.prepare(tokenizedProgram)
    this.interpreter = new Interpreter(parsed, this)
    console.log(this.interpreter)

    this.cpu = cpu
    this.clock = clock
    this.stopped = false

    this.x = x
    this.y = y

    this.vX = 0
    this.vY = 0
    this.direction = direction
  }

  start() {
    this.stopped = false
    var that = this
    setTimeout(function(){that.process()}, that.clock)
  }

  stop() {
    this.stopped = true
  }

  update() {
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
    if (this.x > engine.width) {
      this.x = engine.width
      this.vx = 0
    }

    if (this.x < 0) {
      this.x = 0
      this.vx = 0
    }

    if (this.y > engine.height) {
      this.y = engine.height
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
    var step = 0
    while (step < this.cpu) {
      this.interpreter.step()
      step++
    }

    if (!this.stopped) {
      var that = this
      setTimeout(function(){that.process()}, that.clock)
    }
  }

  reboot() {
    this.stop()
    this.interpreter.restart()
    this.start()
  }
}
