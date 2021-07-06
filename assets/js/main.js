

class WebBasic {

  constructor() {
    this.version = '0.0.1'
    this.program = []
    this.scalars = {}
    this.pointer = null
  }

  handleInput(keypress){
    if(keypress.key == 'ArrowUp') {
      if(webBasic.lastCommand){
        self.commandWindow.value += webBasic.lastCommand
        keypress.preventDefault()
        keypress.stopImmediatePropagation()
        keypress.stopPropagation()        
      }
    }
    if(keypress.key == 'Enter') {
      let lines = self.commandWindow.value.split(/\n/g)
      lines.pop()
      this.parseCommand(lines.pop())
    }    
  }

  error(){
    this.write('Error:', Object.values(arguments).join(' '))
  }

  write(){
    self.commandWindow.value += Object.values(arguments).join(' ') + "\n"
  }

  clear(){
    self.commandWindow.value = ''
  }

  isQuoted(element){
    return /[^"]["$]/.test(element)
  }

  evaluateExpression(expression){
    // TODO: actually parse the expression looking for functions and variables

    var keys = Object.keys(this.scalars)
    keys.forEach(
      key => {
        expression = expression.replace(new RegExp(key, 'g'), `${this.scalars[key]}`)
      }
    );

    return eval(expression)
  }

  parseCommand(command){

    if(command == "") return

    let operands    = command.split(/ /g)
    let instruction = operands.shift()
    let expression  = operands.join('')

    this.lastCommand = command

    if(parseInt(instruction)) {
      // command is line number, indirect mode
      this.program[instruction] = command
      this.lastLineNumber       = instruction
    }
    else {
      // command is instruction, direct mode
      switch (instruction.toUpperCase()) {
        case "?":
        case "PRINT":
          this.write(this.evaluateExpression(expression))
          break;
        
        case "LET":
          if(expression.indexOf('=') > -1) {
            let parts    = expression.split('=')
            let varName  = parts.shift().trim()
            let varValue = this.evaluateExpression(parts.shift().trim())

            this.scalars[varName] = varValue
          }
          else this.error(Illegal)
          break;

        case "CLS":
          this.clear()
          break;

        case "RUN":
          break;
        
        case "PSET":
          let psetArgs = expression.split(',')
          let posX = parseInt(psetArgs.shift().replace('(', '').trim())
          let posY = parseInt(psetArgs.shift().replace(')', '').trim())
          let tint = parseInt(psetArgs.shift() || '0')
         
          if(posX < 0 || posX > 1000 ) this.error('Illegal function call')
          if(posY < 0 || posY > 1000 ) this.error('Illegal function call')
          if(tint < 0 || tint > 15   ) this.error('Illegal function call')

          let pointImageData  = this.drawing.createImageData(1,1)
          pointImageData.data[0] = this.chromas[tint][0]
          pointImageData.data[1] = this.chromas[tint][1]
          pointImageData.data[2] = this.chromas[tint][2]
          pointImageData.data[3] = this.chromas[tint][3]
          this.drawing.putImageData(pointImageData, posX, posY)
          break;

        case "LIST":
          this.program.forEach(
            (line) => {
              if(line) this.write(line)
            }
          )
          this.write('')
          break;

        case "DELETE": 
          // delete line numbers
          if(operands.length > 0) {
            let operand = operands.join('')
            operand     = operand.replace('.', `${this.lastLineNumber}`)

            if(operand.indexOf('-') > -1){
              let startLine = null
              let endLine   = null

              if(/^-/.test(operand)) {
                //delete -100 
                startLine = 0
                endLine   = parseInt(operand.replace('-',''))
              }
              if(/-$/.test(operand)) {
                //delete 10-
                startLine = parseInt(operand.replace('-',''))
                endLine   = this.program.length - 1
              }
              if(/[0-9]+-[0-9+]/.test(operand)) {
                //delete 10-100
                var parts = operand.split('-')
                startLine = parseInt(parts.shift())
                endLine   = parseInt(parts.shift())
              }
              console.log(startLine, endLine)
              if(startLine != null && endLine != null) {
                for (let i = startLine; i < endLine + 1; i++) {
                  this.program[i] = undefined
                }
                this.write('')
              }
            }
            else {
              let lineNumber = parseInt(operand)
              if(this.program[lineNumber]) this.program[lineNumber] = undefined
              this.write('')
            }
          }
          else this.error('Illegal Function Call')
          break;

        case "KILL":
          if(this.isQuoted(operands.join(''))) {
            let filename = operands.join('').replace(/"/g,'')
            self.localStorage.removeItem(`WBS${filename}`)
            this.write('file', filename, "deleted successfully\n")
          }
          else this.error('Syntax error')          
          break;

        case "LOAD":
          if(operands.length > 0) {
            if(this.isQuoted(operands.join(''))) {
              let filename = operands.join('').replace(/"/g,'')
              this.program = JSON.parse(self.localStorage[`WBS${filename}`])
              this.write(filename, 'loaded successfully\n')
            }
            else this.error('Syntax error')

          }
          else {
            this.error('No name specified')
          }
          break;

        case "SAVE":
          if(this.program.length > 0){
            if(this.isQuoted(operands.join(''))) {
              let filename = operands.join('').replace(/"/g,'')
              self.localStorage.setItem(`WBS${filename}`, JSON.stringify(this.program))
              this.write(filename, 'saved successfully')
            }
            else this.error('Syntax error')
          }
          else this.error('nothing to save')
          break;

        case "FILES":
          let files = Object.keys(self.localStorage)
          let programs = files.filter((element) => { return element.startsWith('WBS') })
          this.write('Files saved to disk:')
          programs.forEach(
            element => {
              this.write(element.substr(3))
            }
          );
          this.write('')
          break;

        default:
          if(expression.indexOf('=') > -1) { 
            let parts    = expression.split('=')
            let varName  = parts.shift().trim()
            let varValue = this.evaluateExpression(parts.shift().trim())
            if(varName in this.scalars){
              this.scalars[varName] = varValue
            }
          }
          this.error('command unknown', command)
          break;
      }
    }

  }

  startUp(){

    // set dynamic content
    const dateCurrent = new Date();
    const dateUpdated = new Date(self.DateUpdated.innerHTML);
    self.currentYear.innerHTML = dateCurrent.getFullYear();
    self.DateUpdated.innerHTML = dateUpdated.toLocaleString().replace(',', '');
    if(!(dateUpdated instanceof Date && isFinite(dateUpdated))) {
        self.DateUpdated.innerHTML = "unknown";
    }

    this.clear()
    this.write(`Web-BASIC v${this.version}\n(C) Copyright Mike Firoved (MIT License)\nOK\n\n`);
    self.commandWindow.focus()  
    this.drawing = self.graphicsScreen.getContext('2d')
    this.chromas = [
      [  0,   0,   0, 255], //  0 - black
      [  0,   0, 170, 255], //  1 - blue
      [  0, 170,   0, 255], //  2 - green
      [  0, 170, 170, 255], //  3 - cyan
      [170,   0,   0, 255], //  4 - red
      [170,   0, 170, 255], //  5 - magenta
      [170,  84,   0, 255], //  6 - brown
      [170, 170, 170, 255], //  7 - white
      [ 84,  84,  84, 255], //  8 - gray
      [ 84,  84, 255, 255], //  9 - light blue
      [ 84, 255,  84, 255], // 10 - light green
      [ 84, 255, 255, 255], // 11 - light cyan
      [255,  85,  85, 255], // 12 - light red
      [155,  84, 255, 255], // 13 - light magenta
      [255, 255,  84, 255], // 14 - yellow
      [255, 255, 255, 255], // 15 - high intensity white
    ]    

    
  }
}

let webBasic = new WebBasic()

document.addEventListener("DOMContentLoaded", (e) => { webBasic.startUp() });