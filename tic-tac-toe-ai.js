const fs = require('fs')

let matchboxes
try {
    matchboxes = require('./matchboxes.json')
} catch (e) {
    matchboxes = {}
}

let stats
try {
    stats = require('./globalStats.json')
} catch (e) {
    stats = {}
}

let hiStats
try {
    hiStats = require('./hiStats.json')
} catch {
    hiStats = []
}

module.exports = class MatchboxAI {
    constructor() {
        this.matchboxes = matchboxes
        this.stats = stats
    }
    getKey = (matrix) => {
        let key = ""

        for (let row of matrix) {
            for (let square of row) {
                key += square
            }
        }

        return key
    }
    makeMatchbox(matrix) {
        let matchbox = {}
        let cursor = 1

        for (let row of matrix) {
            for (let square of row) {
                matchbox[cursor.toString()] = typeof square !== 'number' ? square : 3
                cursor++
            }
        }
        return matchbox
    }
    getOptions(matchbox) {
        const options = []

        for (const [key, value] of Object.entries(matchbox)) {
            if (typeof value !== 'number') {
                continue
            }

            for (let i = 0; i < value; i++) {
                options.push(parseInt(key))
            }
        }

        return options
    }
    generateRandomNum(min, max) {
        return Math.round(Math.random() * (max - min) + min)
    }
    generateMove(board) {
        const key = this.getKey(board)

        const matchbox = matchboxes[key]

        let options

        if (!matchbox) {
            const newMatchbox = this.makeMatchbox(board)
            matchboxes[key] = newMatchbox
            options = this.getOptions(newMatchbox)
        } else {
            options = this.getOptions(matchbox)
        }

        const move = parseInt(options[this.generateRandomNum(0, options.length - 1)], 10)

        return { key, move }
    }
    generateRandomMove(board) {
        board = this.makeMatchbox(board)

        const options = this.getOptions(board)

        return options[this.generateRandomNum(0, options.length - 1)]
    }
    learn(history, outcome) {
        // TODO: Add / update a stats file every time "learn" runs 

        for (let key in history) {

            if (outcome === "won") {
                this.matchboxes[key][history[key]] += 2
            } else if (outcome === "tie") {
                this.matchboxes[key][history[key]] += 1
                // Always leave at least 1 bean in the matchboxes,
                // Allowing the AI to still make "original" moves even after some time
            } else if (outcome === "lost" && this.matchboxes[key][history[key]] > 1) {
                this.matchboxes[key][history[key]] -= 1
            }
        }
    }
    updateGlobalStats({ games, userWins, AIWins, ties }) {

        this.stats['games'] ? this.stats['games'] += games : this.stats['games'] = games
        this.stats['userWins'] ? this.stats['userWins'] += userWins : this.stats['userWins'] = userWins
        this.stats['AIWins'] ? this.stats['AIWins'] += AIWins : this.stats['AIWins'] = AIWins
        this.stats['ties'] ? this.stats['ties'] += ties : this.stats['ties'] = ties

        hiStats.push({ games, userWins, AIWins, ties })

        fs.writeFileSync('hiStats.json', JSON.stringify(hiStats))
        fs.writeFileSync('globalStats.json', JSON.stringify(this.stats))
        console.log(`${games} games, AI lost ${userWins} times and won ${AIWins} times. There was ${ties} ties.`)
    }
    remember(matchboxes, statsObj) {
        fs.writeFileSync('matchboxes.json', JSON.stringify(matchboxes))
        this.updateGlobalStats(statsObj)
        console.log(`AI updated! ${Object.keys(matchboxes).length} matchboxes in memory.`)
    }
}
