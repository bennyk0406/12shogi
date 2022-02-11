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
        return {x: index % 3, y: Math.floor(index / 3)};
    }
    move(roomId, piece, prev, dest) {
        if (!piece.checkValid(this, prev, dest)) return false;
        let captive;
        if (this.raw[dest] !== null) {
            if (this.raw[dest].team === this.game[roomId].turnOwner) {
            	return false;
            }
            captive = this.raw[dest];
            if (captive.name === "hoo") {
                captive = new JaPiece(piece.team);
            }
            else {
                captive.team = piece.team;
            }
            this.game.addCaptive(roomId, piece.team, captive);
        }
        this.raw[dest] = piece;
        this.raw[prev] = null;
        return { captive };
    }
    setCaptivePos(roomId, team, name, pos) {
    	const captiveList = this.game[roomId].players[Object.keys(this.game[roomId].players).find(i => i === team)].captive;
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
        captiveList.splice(captiveList.findIndex(e => e.name === name), 1);
        return true;
    }
}

exports.gameMap = gameMap;