class Robot {
  constructor(program, cpu, clock, x, y, direction) {
    var tokenizer = new Tokenizer()
    var tokenizedProgram = tokenizer.tokenize(program)
    var parser = new Parser()
    var parsed = parser.prepare(tokenizedProgram)
    this.interpreter = new Interpreter(parsed, this)

    this.cpu = cpu
    this.clock = clock
    this.stopped = false

    this.x = x
    this.y = y
    this.direction = direction
  }

  start() {
    this.stopped = false
    var that = this
    setTimeout(function(){that.update()}, that.clock)
  }

  stop() {
    this.stopped = true
  }

  update() {
    var step = 0
    while (step < this.cpu) {
      this.interpreter.step()
      step++
    }

    if (!this.stopped) {
      var that = this
      setTimeout(function(){that.update()}, that.clock)
    }
  }

  reboot() {
    this.stop()
    this.interpreter.restart()
    this.start()
  }
}
