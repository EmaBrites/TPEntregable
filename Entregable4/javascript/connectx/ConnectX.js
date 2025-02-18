import Token from "./Token.js"
import Cell from "./Cell.js"
import Canvas from "./Canvas.js"
import LogicBoard from "./LogicBoard.js"
import Timer from "./Timer.js"
import ResetButton from "./ResetButton.js"

export default class ConnectX {
  cellsStyle = {
    round: "./assets/connectx/cell.png",
    square: "./assets/connectx/square-cell.png",
  }

  tokensStyle = {
    roundred: "./assets/connectx/red-token.png",
    roundgreen: "./assets/connectx/green-token.png",
    roundblue: "./assets/connectx/blue-token.png",
    squarered: "./assets/connectx/red-square-token.png",
    squaregreen: "./assets/connectx/green-square-token.png",
    squareblue: "./assets/connectx/blue-square-token.png",
  }

  cellSize = 40
  tokenSize = 15
  boardYPos = 100
  timerPos = {X:470,Y:40}
  graphicBoard = []
  logicBoard
  cellsStylePath
  tokenStylePlayer1Path
  tokenStylePlayer2Path
  tokensPerLine
  tokensPerPlayer
  canvas = new Canvas(
    "game",
    1000,
    500,
    "gray",
    "./assets/connectx/fondo-juego.jpg",
    this.resetCallBack()
  )
  tokensLeftPlayer1 = []
  tokensLeftPlayer2 = []

  constructor({
    tokensPerLine,
    cellStyle,
    tokenColorPlayer1,
    tokenColorPlayer2,
  }) {
    this.tokensPerLine = tokensPerLine
    this.tokensPerPlayer = ((tokensPerLine + 2) * (tokensPerLine + 3)) / 2
    this.boardXPos = this.canvas.getWidth() / 2 - (this.cellSize * (tokensPerLine + 3)) / 2
    this.logicBoard = new LogicBoard(tokensPerLine, this.drawCallback(), this.winCallBack())
    this.timer = new Timer(this.timerPos.X,this.timerPos.Y,60000)
    this.canvas.setTimer(this.timer)
    this.resetButton = new ResetButton(this.canvas.getWidth() - 60, 70, 50,"./assets/connectx/reset.png")
    this.canvas.setResetButton(this.resetButton)
    this.cellsStylePath = this.cellsStyle[cellStyle]
    this.tokenStylePlayer1Path = this.tokensStyle[cellStyle + tokenColorPlayer1]
    this.tokenStylePlayer2Path = this.tokensStyle[cellStyle + tokenColorPlayer2]
    this.createAndDrawGraphicalBoard()
    this.createAnDrawTokens()
    this.activateTokenDropping()
    this.interval =setInterval(() => {
      this.canvas.drawFigures()
      if(this.timer.isOver()) {
        this.logicBoard.drawCallBack()
      }
    }, 1000)
  }

  createAndDrawGraphicalBoard() {
    let cell
    let xOffset = 0
    let column

    for (let c = 0; c < this.logicBoard.getColumnsAmount(); c++) {
      let yOffset = 0
      column = []

      for (let r = 0; r < this.logicBoard.getRowsAmount(); r++) {
        cell = new Cell(
          this.boardXPos + xOffset,
          this.boardYPos + yOffset,
          this.cellSize,
          this.cellsStylePath
        )

        column.push(cell)
        this.canvas.addFigure(cell)
        yOffset += this.cellSize
      }

      this.graphicBoard.push(column)
      xOffset += this.cellSize
    }

    this.canvas.drawFigures()
  }

  createAnDrawTokens() {
    this.createAndDrawTokensForPlayer(
      this.tokenStylePlayer1Path,
      this.boardXPos - this.tokenSize * 2,
      this.tokensLeftPlayer1
    )
    this.createAndDrawTokensForPlayer(
      this.tokenStylePlayer2Path,
      this.boardXPos +
        this.cellSize * this.logicBoard.getColumnsAmount() +
        this.tokenSize * 2,
      this.tokensLeftPlayer2
    )
    this.disableTokensOfPlayer(2)
    this.canvas.drawFigures()
    this.canvas.startListeningMouseEvents()
  }

  createAndDrawTokensForPlayer(tokenStylePlayerPath, xPos, arrayForStorage) {
    let token
    let offset = 0
    for (let i = 0; i < this.tokensPerPlayer; i++) {
      token = new Token(
        xPos,
        this.boardYPos + (offset * this.tokenSize) / 2,
        this.tokenSize,
        tokenStylePlayerPath
      )
      this.canvas.addFigure(token)
      arrayForStorage.push(token)
      offset++
    }
  }

  onTokenDropped() {
    const that = this
    return function () {
      const lastDraggedToken = that.canvas.getLastDruggedFigure()
      const { posX, posY } = lastDraggedToken.getPosition()
      const chosenColumn = that.calculateColumnOfToken(posX, posY)
      let gameOver = false;
      if (chosenColumn === -1) lastDraggedToken.restorePosition()
      else {
        const row = that.logicBoard.findRowForNewToken(chosenColumn - 1)
        //le resto 1 a la posición de la columna xq empiezan en cero por ser un arreglo
        const cell = that.graphicBoard[chosenColumn - 1][row]

        if (that.logicBoard.dropToken(chosenColumn)) {
          cell.drawTokenInside(lastDraggedToken)
          that.disableTokensOfPlayer(that.logicBoard.getLastPlayer())
          that.removeFromPlayerTokensLeft(lastDraggedToken)
          gameOver = that.logicBoard.isGameOver()
          if (!gameOver)
            that.enableTokensOfPlayer(that.logicBoard.getNextPlayer())
        } else lastDraggedToken.restorePosition()
      }
      if(!gameOver)
        that.canvas.drawFigures()
    }
  }

  removeFromPlayerTokensLeft(token) {
    const lastPlayer = this.logicBoard.getLastPlayer()
    const arr =
      lastPlayer === 1 ? this.tokensLeftPlayer1 : this.tokensLeftPlayer2
    const index = arr.findIndex((t) => t == token)
    arr.splice(index, 1)
  }

  disableTokensOfPlayer(player) {
    const arr = player === 1 ? this.tokensLeftPlayer1 : this.tokensLeftPlayer2
    arr.forEach((t) => t.disableDragging())
  }

  enableTokensOfPlayer(player) {
    const arr = player === 1 ? this.tokensLeftPlayer1 : this.tokensLeftPlayer2
    arr.forEach((t) => t.enableDragging())
    this.canvas.setPlayerTurn(player)
  }

  calculateColumnOfToken(posX, posY) {
    if (posY >= this.boardYPos + this.cellSize) return -1

    if (
      posX < this.boardXPos ||
      posX > this.boardXPos + this.cellSize * this.logicBoard.getColumnsAmount()
    )
      return -1

    return Math.ceil((posX - this.boardXPos) / this.cellSize)
  }

  activateTokenDropping() {
    this.canvas.addMouseUpListener(this.onTokenDropped())
  }

  drawCallback() {
    const that = this
    return function () {
      console.log("GAME OVER: DRAW")
      that.canvas.drawGameOver("GAME OVER: DRAW")
      that.canvas.removeEventListeners()
      clearInterval(that.interval)
    }
  }

  winCallBack() {
    const that = this
    return function () {
      that.disableTokensOfPlayer(1)
      that.disableTokensOfPlayer(2)
      console.log(`GAME OVER: PLAYER ${that.logicBoard.getLastPlayer()} HAS WON`)
      that.canvas.drawGameOver(`GAME OVER: PLAYER ${that.logicBoard.getLastPlayer()} HAS WON`)
      that.canvas.removeEventListeners()
      clearInterval(that.interval)
    }
  }

  resetCallBack() {
    const that = this
    return function () {
      let message = document.getElementById("message")
      document.getElementById("game").classList.add("hidden")
      message.classList.remove("hidden")
      message.innerHTML = "Choose a game mode"
      document.querySelectorAll(".game-mode-button").forEach((element) => {
        element.classList.remove("hidden")    
      })
    clearInterval(that.interval)
    }
  }
}
