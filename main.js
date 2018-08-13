var program = [];
var tokenizedProgram = [];
var outputDiv = document.getElementById('output')
var ide = document.getElementById('ide')

function run(){
  var program = ide.value.split(/\r?\n/);
  tokenizedProgram = [];

  console.log(program);
  for (var line = 0; line < program.length; line++) {
    tokenizedProgram[line] = program[line].split(/([$&+,:;=?@#|'<>.-^*()%! ])/g);
  }

  console.log(tokenizedProgram);

}

function stop(){

}
