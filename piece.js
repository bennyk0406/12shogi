class BasePiece {
    constructor(team, name) {
        this.team = team;
        this.name = name;
    }
}

class KingPiece extends BasePiece {
    constructor(team) {
        super(team, 'king');
    }
    checkValid(map, prev, dest) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if (Math.abs(destPos.x-prevPos.x)<=1 && Math.abs(destPos.y-prevPos.y)<=1) {
            return true;
        }
        else {
            return false;
        }
    }
}

class JangPiece extends BasePiece {
    constructor(team) {
        super(team, 'jang');
    }
    checkValid(map, prev, dest) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if ((Math.abs(destPos.x-prevPos.x)===1 && destPos.y===prevPos.y) || (destPos.x===prevPos.x && Math.abs(destPos.y-prevPos.y)===1)) {
            return true;
        }
        else {
            return false;
        }
    }
}

class SangPiece extends BasePiece {
    constructor(team) {
        super(team, 'sang');
    }
    checkValid(map, prev, dest) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if (Math.abs(destPos.x-prevPos.x)===1 && Math.abs(destPos.y-prevPos.y)===1) {
            return true;
        }
        else {
            return false;
        }
    }
}

class JaPiece extends BasePiece {
    constructor(team) {
        super(team, 'ja');
    }
    checkValid(map, prev, dest) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if (this.team === 'green') {
            if (destPos.x===prevPos.x && destPos.y-prevPos.y===-1) {
                return true;
            } 
            else {
                return false;
            }
        }
        if (this.team === 'red') {
            if (destPos.x===prevPos.x && destPos.y-prevPos.y===1) {
                return true;
            } 
            else {
                return false;
            }
        }
    }
}

class HooPiece extends BasePiece {
    constructor(team) {
        super(team, 'hoo');
    }
    checkValid(map, prev, dest) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if (this.team === 'green') {
            if ((Math.abs(destPos.x-prevPos.x)===1 && destPos.y===prevPos.y) || (destPos.x===prevPos.x && Math.abs(destPos.y-prevPos.y)===1) || (destPos.y-prevPos.y===-1 && Math.abs(destPos.x-prevPos.x)===1)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (this.team === 'red') {
            if ((Math.abs(destPos.x-prevPos.x)===1 && destPos.y===prevPos.y) || (destPos.x===prevPos.x && Math.abs(destPos.y-prevPos.y)===1) || (destPos.y-prevPos.y===1 && Math.abs(destPos.x-prevPos.x)===1)) {
                return true;
            }
            else {
                return false;
            }
        }
    }
}
exports.JaPiece = JaPiece;
exports.JangPiece = JangPiece;
exports.SangPiece = SangPiece;
exports.HooPiece = HooPiece;
exports.KingPiece = KingPiece;