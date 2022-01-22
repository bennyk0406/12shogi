const { JaPiece, JangPiece, SangPiece, KingPiece } = require("./piece");

class gameMap {
    constructor(game) {
    	this.game = game;
        this.raw = [
            new JangPiece("red"),   new KingPiece("red"),   new SangPiece("red"), 
            null,                   new JaPiece("red"),     null, 
            null,                   new JaPiece("green"),   null, 
            new SangPiece("green"), new KingPiece("green"), new JangPiece("green")
        ];
    }
    getCoordinate(index) {
        return {x: index%3, y: Math.floor(index/3)};
    }
    move(piece, prev, dest) {
        if (!piece.checkValid(this, prev, dest)) return false;
        let poro;
        if (this.raw[dest] !== null) {
            if (this.raw[dest].team === this.game.players[this.game.turnOwner].team) {
            	return false;
            }
            poro = this.raw[dest];
            if (poro !== undefined) {
            	if (poro.name === "hoo") {
            	    poro = new JaPiece(piece.team);
                    poro.name = "ja";
            	}
                else {
                	poro.team = piece.team;
                }
                this.game.addPoro(piece.team, poro);
            }
        }
        this.raw[dest] = piece;
        this.raw[prev] = null;
        return {poro};
    }
    setPoroPos(team, name, pos) {
    	const poroList = this.game.players.find(i => i.team === team).poro;
    	switch (name) {
    	    case "ja": 
                this.raw[pos] = new JaPiece(team);
                break;
            case "sang":
                this.raw[pos] = new SangPiece(team);
                break;
            case "jang":
                this.raw[pos] = new JangPiece(team);
                break;
    	}
        poroList.splice(poroList.findIndex(e => e.name === name), 1);
        return true;
    }
}

exports.gameMap = gameMap;