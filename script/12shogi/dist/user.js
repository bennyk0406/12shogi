class user {
    constructor() {}
    static getNicknameFromTeam(channel, gameRoom, team) {
        return channel.getUserInfoId(gameRoom.players[team].id).Nickname;
    }
    static getNicknameFromId(channel, id) {
        return channel.getUserInfoId(id).Nickname;
    }
}

exports.user = user;