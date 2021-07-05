

class WebBasic {

  constructor() {
    this.version = '0.0.1'
    this.program = []
    this.scalars = {}
  }

  handleInput(keypress){
    console.log(keypress)
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

        case "RUN":
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
    this.clear()
    this.write(`Web-BASIC v${this.version}\n(C) Copyright Mike Firoved (MIT License)\nOK\n\n`);
    self.commandWindow.focus()  
  }
}

let webBasic = new WebBasic()

document.addEventListener("DOMContentLoaded", (e) => { webBasic.startUp() });