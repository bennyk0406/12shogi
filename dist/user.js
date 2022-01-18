class user {
    constructor() {}
    static getNicknameFromIndex(channel, game, index) {
        return channel.getUserInfoId(game.players[index].id).Nickname;
    }
    static getNicknameFromId(channel, id) {
        return channel.getUserInfoId(id).Nickname;
    }
}

exports.user = user;