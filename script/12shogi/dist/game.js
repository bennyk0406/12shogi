const { gameMap } = require("./gamemap");

class game {
    constructor() {}
    addRoom(roomId) {
        this[roomId] = {
            players: {},
            turnOwner: null,
            started: false,
            map: new gameMap(this),
            timeout: false,
            timeLimit: null
        };
    }
    addPlayer(roomId, playerId, team) {
        this[roomId].players[team] = {
            id: playerId,
            captive: []
        };
    }
    addCaptive(roomId, team, captive) {
        this[roomId].players[Object.keys(this[roomId].players).find(v => v === team)].captive.push(captive);
    }
    start(roomId) {
        this[roomId].turnOwner = ["green", "red"][Math.floor(Math.random() * 2)];
        this[roomId].started = true;
    }
    changeTurnOwner(roomId) {
        switch (this[roomId].turnOwner) {
            case "green": 
                this[roomId].turnOwner = "red";
                break;
            case "red":
                this[roomId].turnOwner = "green";
                break;
        }
    }
    hasOtherPiece(roomId, team, piece) {
        if (team === "green") {
            return this[roomId].map.raw.slice(0,3).some(i => i !== null && i.name === piece && i.team === "green");
        }
        else {
            return this[roomId].map.raw.slice(9,12).some(i => i !== null && i.name === piece && i.team === "red");
        }
    }
    isTurnOwner(roomId, playerId) {
        return playerId === this[roomId].players[this[roomId].turnOwner].id;
    }
    async alertLeftTime(roomId, chat, time) {
        clearTimeout(this[roomId].timeout);
        await chat.replyText(`${time}초 남았습니다.`);
    }
}

exports.game = game;