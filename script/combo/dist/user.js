class user {
    constructor() {}
    static getNicknameFromIndex(channel, gameRoom, index) {
        return channel.getUserInfoId(gameRoom.players[index].id).Nickname;
    }
    static getNicknameFromId(channel, id) {
        return channel.getUserInfoId(id).Nickname;
    }
}

exports.user = user;