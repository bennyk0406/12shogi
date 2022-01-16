const { gameMap } = require("./gamemap");
class game {
    constructor() {
        this.players = [];
        this.turnOwner = null;
        this.started = false;
        this.map = new gameMap(this);
    }
    addPlayer(id, team) {
        this.players.push({id, team, poro: []});
    }
    addPoro(team, poro) {
        this.players.find(i => i.team === team).poro.push(poro);
    }
    start() {
        this.turnOwner = Math.floor(Math.random()*2);
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
}
exports.game = game;