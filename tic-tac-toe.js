const readline = require('readline')
// TODO: Use of chalk to prettify the output?
const MatchboxAI = require('./tic-tac-toe-ai')

class TicTacToe {
    constructor() {
        this.board = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ]
        // Game
        this.status = ''
        this.state = ''
        this.outcome = ''
        this.turn = 1
        this.history = {}
        // Stats
        this.gamesCount = 0
        this.userWinsCount = 0
        this.AIWinsCount = 0
        this.tiesCount = 0

        this.readlineInterface = readline.createInterface(process.stdin, process.stdout)
    }
    // Board utils
    renderBoard() {
        console.clear()
        for (let row of this.board) {
            console.log(...row)
        }
    }
    getCoordinates(num) {
        let x, y
        switch (num) {
            case 1:
            case 2:
            case 3:
                x = 0, y = num - 1
                break;
            case 4:
            case 5:
            case 6:
                x = 1, y = num - 4
                break;
            case 7:
            case 8:
            case 9:
                x = 2, y = num - 7
                break; s
        }
        return { x, y }
    }
    setBoard(move, player) {
        const { x, y } = this.getCoordinates(move)
        this.board[x][y] = player
    }
    resetBoard() {
        let cursor = 1
        for (let row of this.board) {
            for (let square in row) {
                row[square] = cursor
                cursor++
            }
        }
        this.status = 'playing'
        this.turn = 1
        this.history = {}
    }
    // Move utils
    isLegalMove(move) {
        // Checks in ASCII table the input is a number between 1 and 9
        if (!(move.charCodeAt(0) > 48 && move.charCodeAt(0) < 58)) {
            return false
        }

        // Checks there's only one number and the move wasn't played before
        const { x, y } = this.getCoordinates(parseInt(move, 10))
        if (move.length > 1 || (typeof this.board[x][y] !== 'number')) {
            return false
        }

        return true
    }
    checkForWinner() {
        // Checks all winning combinations, there are only 8 of them
        // There must be a better way to check for a winning move though -_-
        if ((this.board[0][0] === this.board[0][1] && this.board[0][1] === this.board[0][2]) ||
            (this.board[1][0] === this.board[1][1] && this.board[1][1] === this.board[1][2]) ||
            (this.board[2][0] === this.board[2][1] && this.board[2][1] === this.board[2][2]) ||
            (this.board[0][0] === this.board[1][0] && this.board[1][0] === this.board[2][0]) ||
            (this.board[0][1] === this.board[1][1] && this.board[1][1] === this.board[2][1]) ||
            (this.board[0][2] === this.board[1][2] && this.board[1][2] === this.board[2][2]) ||
            (this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) ||
            (this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0])) {
            return true
        }
        return false
    }
    checkMovesLeft() {
        // TODO: Find a more sensible way to check for moves left to avoid storing useless board states
        for (let row of this.board) {
            for (let square of row) {
                if (typeof square === 'number') {
                    return false
                }
            }
        }
        return true
    }
    checkForOutcome(player) {
        if (this.checkForWinner()) {
            this.status = `Game over! Player ${player} won!`
            this.outcome = player === 'O' ? 'won' : 'lost'

            if (player === 'O') {
                this.AIWinsCount++
            } else if (player === 'X') {
                this.userWinsCount++
            }

            AI.learn(this.history, this.outcome)

            return true
        }

        if (this.checkMovesLeft()) {
            this.status = `Game over! That's a tie!`
            this.outcome = 'tie'
            this.tiesCount++

            AI.learn(this.history, this.outcome)

            return true
        }

        return false
    }
    // I/O utils
    ask(questionText) {
        return new Promise((resolve, reject) => {
            this.readlineInterface.question(questionText, val => resolve(val));
        });
    }
    async requireMove(player) {
        let message = player === 'X' ? 'Make your move! ' : 'The AI is thinking...'
        let move = await this.ask(message);

        while (!this.isLegalMove(move)) {
            console.log('Please make a valid move (1-9).')
            move = await this.ask(message);
        }

        return parseInt(move, 10)
    }
    async makeMove(player) {
        let nextMove

        if (player === 'X') {
            nextMove = await this.requireMove(player)
        } else if (player === 'O') {
            const { key, move } = AI.generateMove(this.board)
            this.history[key] = move
            nextMove = move
        }

        this.setBoard(nextMove, player)
        this.renderBoard()
    }
    async trainAI(rounds = 1000) {

        let i = 0

        while (i < rounds) {
            let player = this.turn % 2 === 0 ? 'O' : 'X'

            let nextMove

            if (player === 'X') {
                nextMove = AI.generateRandomMove(this.board)
            } else if (player === 'O') {
                const { key, move } = AI.generateMove(this.board)
                this.history[key] = move
                nextMove = move
            }

            this.setBoard(nextMove, player)

            const end = this.checkForOutcome(player)

            if (end) {
                this.resetBoard()
                this.gamesCount++
                i++
                continue
            }

            this.turn++
            continue
        }
    }
    async start() {
        this.state = 'on'

        console.log('AI waking up...')

        // There are actually 5748 total legal positions, but the AI always plays seconds,
        // which must be why there is never more than 2097 matchboxes in memory
        const rounds = Object.keys(AI.matchboxes).length < 2097 ? 1000 : 1000
        // TODO: Plot time complexity depending on the number of rounds
        await this.trainAI(rounds)

        AI.remember(AI.matchboxes, {
            games: this.gamesCount,
            userWins: this.userWinsCount,
            AIWins: this.AIWinsCount,
            ties: this.tiesCount,
        })

        this.gamesCount = 0
        this.userWinsCount = 0
        this.AIWinsCount = 0
        this.tiesCount = 0

        while (this.state === 'on') {

            this.status = 'playing'

            this.renderBoard()

            while (this.status === 'playing') {
                const player = this.turn % 2 === 0 ? 'O' : 'X'

                await this.makeMove(player)

                const end = this.checkForOutcome(player)

                if (end) {
                    this.gamesCount++
                    break
                }

                this.turn++
                continue
            }

            console.log(this.status)

            const answer = await this.ask('Enter y to play again or any other key to exit')

            if (answer.toLowerCase() === 'y') {
                this.resetBoard()
                continue
            }

            this.state = 'off'
            break
        }

        AI.remember(AI.matchboxes, {
            games: this.gamesCount,
            userWins: this.userWinsCount,
            AIWins: this.AIWinsCount,
            ties: this.tiesCount,
        })

        process.exit();
    }
}

const AI = new MatchboxAI()

const party = new TicTacToe()

party.start()

