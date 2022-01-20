const { gameMap } = require("./gamemap");

class game {
    constructor() {
        this.players = [];
        this.turnOwner = null;
        this.started = false;
        this.map = new gameMap(this);
        this.timeout = false;
    }
    addPlayer(id, team) {
        this.players.push({id, team, poro: []});
    }
    addPoro(team, poro) {
        this.players.find(i => i.team === team).poro.push(poro);
    }
    start() {
        this.turnOwner = Math.floor(Math.random() * 2);
        this.started = true;
    }
    changeTurnOwner() {
        switch(this.turnOwner) {
            case 0: 
                this.turnOwner = 1;
                break;
            case 1:
                this.turnOwner = 0;
                break;
        }
    }
    getTeamByIndex(index) {
        if (index === 0) {
            return "green";
        }
        else {
            return "red";
        }
    }
    getTeamById(id) {
        return this.players.find(i => i.id === id).team;
    }
    hasOtherPiece(turnOwner, piece) {
        if (turnOwner === 0) {
            return this.map.raw.slice(0,3).some(i => i !== null && i.name === piece && i.team === "green");
        }
        else {
            return this.map.raw.slice(9,12).some(i => i !== null && i.name === piece && i.team === "red");
        }
    }
    isTurnOwner(id) {
        return id === this.players[this.turnOwner].id;
    }
    async alertLeftTime(chat, time) {
        clearTimeout(this.timeout);
        await chat.replyText(`${time}초 남았습니다.`);
    }
}
exports.game = game;