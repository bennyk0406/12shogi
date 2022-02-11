const { user } = require("./user");

class game {
    constructor() {}
    addRoom(roomId) {
        this[roomId] = {
            players: [],
            turnOwner: null,
            started: false,
            table: [],
            timeout: false,
            hapList: [],
            saidHap: []
        };
    }
    addPlayer(roomId, playerId) {
        this[roomId].players.push({
            id: playerId,
            score: 0
        });
    }
    start(roomId) {
        this[roomId].turnOwner = Math.floor(Math.random() * 2);
        this[roomId].started = true;
        this.startRound(roomId);
    }
    startRound(roomId) {
        this.makeTable(roomId);
        this.findHap(roomId);
    }
    changeTurnOwner(roomId) {
        switch (this[roomId].turnOwner) {
            case 0: 
                this[roomId].turnOwner = 1;
                break;
            case 1:
                this[roomId].turnOwner = 0;
                break;
        }
    }
    makeTable(roomId) {
        const table = [];
        while (table.length < 9) {
            const data = new Array(3).fill().map(_ => Math.floor(Math.random() * 3));
            if (table.some(e => e.every((v, i) => v === data[i]))) {
                continue;
            }
            table.push(data);
        }
        this[roomId].table = table;
    }
    isHap(roomId, a, b, c) {
        const table = this[roomId].table;
        for (let i = 0; i < 3; i++) {
            if (!(table[a][i] === table[b][i] && table[b][i] === table[c][i]) && !(table[a][i] + table[b][i] + table[c][i] === 3)) {
                return false;
            }
        }
        return true;
    }
    findHap(roomId) {
        const hapList = [];
        for (let i = 0; i < 7; i++) {
            for (let j = i + 1; j < 8; j++) {
                for (let k = j + 1; k < 9; k++) {
                    if (this.isHap(roomId, i, j, k)) {
                        hapList.push([i, j, k]);
                    }
                }
            }
        }
        this[roomId].hapList = hapList;
    }
    onTurnEnd(roomId, chat) {
        this.changeTurnOwner(roomId);
        chat.replyText(`${user.getNicknameFromIndex(chat.Channel, this[roomId], this[roomId].turnOwner)}님의 차례입니다.`);
        this[roomId].timeout = setTimeout(() => {
            this.onTurnEnd(roomId, chat);
        }, 10 * 1000);
    }
}

exports.game = game;