const fs = require("fs");
const path = require("path");
const { game } = require("./dist/game");
const { user } = require("./dist/user");
const picturesPath = path.resolve(__dirname, "./pictures/");

const createdGame = new game();
const roomOwner = {};

const combo = async function (chat) {
    const roomId = chat.Channel.id.toString();
    if (chat.text == "/시작 결합" && createdGame[roomId] === undefined) {
        chat.replyText("결합 게임을 시작합니다.\n\n/참가 결합 명령어를 통해 게임에 참여해주세요.");
        createdGame.addRoom(roomId);
        roomOwner[roomId] = chat.sender.id.toString();
        return;
    }

    if (createdGame[roomId] === undefined) return;

    if (chat.text == "/참가 결합" && !createdGame[roomId].started) {
    	createdGame.addPlayer(roomId, roomOwner[roomId]);
        createdGame.addPlayer(roomId, chat.sender.id.toString());
        createdGame.start(roomId);
        await chat.replyText(`결합 게임을 시작합니다. 선 플레이어는 ${user.getNicknameFromIndex(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}님입니다.`);
        const mediaList = createdGame[roomId].table.map(i => (
            {
                type: 2,
                name: `${i.join("")}.png`,
                width: 300,
                height: 300,
                data: fs.readFileSync(path.resolve(__dirname, picturesPath, `./${i.join("")}.png`)),
                ext: "png"
            }
        ));
        await chat.replyMedia({
            "type": 27, 
            mediaList
        });
        createdGame[roomId].timeout = setTimeout(() => {
            createdGame.onTurnEnd(roomId, chat);
        }, 10 * 1000);
    }
    if (chat.text.startsWith("합 ") && createdGame[roomId].players[createdGame[roomId].turnOwner].id === chat.sender.id.toString()) {
        const input = chat.text.slice(2).replace(/ /g,"").split("").map(i => parseInt(i) - 1).sort();
        if (input.some(e => isNaN(e) || e < 0 || e > 8) || input.length !== 3) {
            await chat.replyText("유효하지 않은 입력입니다.");
            return;
        }
        if (createdGame[roomId].saidHap.some(e => e.every((v, i) => v === input[i]))) {
            await chat.replyText("이미 제출된 조합입니다.");
            return;
        }
        clearTimeout(createdGame[roomId].timeout);
        if (createdGame[roomId].hapList.some(e => e.every((v, i) => v === input[i]))) {
            chat.replyText("정답, +1점.");
            createdGame[roomId].saidHap.push(input);
            createdGame[roomId].players[createdGame[roomId].turnOwner].score++;
            createdGame[roomId].timeout = setTimeout(() => {
                createdGame.onTurnEnd(roomId, chat);
            }, 5 * 1000);
        } 
        else {
            chat.replyText("틀렸습니다, -1점.");
            createdGame[roomId].players[createdGame[roomId].turnOwner].score--;
            createdGame.changeTurnOwner(roomId);
            await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}님의 차례입니다.`);
            createdGame[roomId].timeout = setTimeout(() => {
                createdGame.onTurnEnd(roomId, chat);
            }, 10 * 1000);
        }
    }
    if (chat.text == "결" && createdGame[roomId].players[createdGame[roomId].turnOwner].id === chat.sender.id.toString()) {
    	clearTimeout(createdGame[roomId].timeout);
        if (createdGame[roomId].saidHap.length === createdGame[roomId].hapList.length) {
    	    await chat.replyText("정답, +3점.");
            createdGame[roomId].players[createdGame[roomId].turnOwner].score += 3;
            createdGame.changeTurnOwner(roomId);
            await chat.replyText(`[ 점수 ]\n${user.getNicknameFromIndex(chat.Channel, createdGame[roomId], 0)} : ${createdGame[roomId].players[0].score}점\n${user.getNicknameFromIndex(chat.Channel, createdGame[roomId], 1)} : ${createdGame[roomId].players[1].score}점`);
            createdGame.startRound(roomId);
            const mediaList = createdGame[roomId].table.map(i => (
                {
                    type: 2,
                    name: `${i.join("")}.png`,
                    width: 300,
                    height: 300,
                    data: fs.readFileSync(path.resolve(__dirname, picturesPath, `./${i.join("")}.png`)),
                    ext: "png"
                }
            ));
            await chat.replyMedia({
                "type": 27, 
                mediaList
            });
            createdGame[roomId].timeout = setTimeout(() => {
                createdGame.onTurnEnd(roomId, chat);
            }, 10 * 1000);
    	}
        else {
            chat.replyText("틀렸습니다, -1점.");
            createdGame[roomId].players[createdGame[roomId].turnOwner].score--;
            createdGame.changeTurnOwner(roomId);
            await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}님의 차례입니다.`);
            createdGame[roomId].timeout = setTimeout(() => {
                createdGame.onTurnEnd(roomId, chat);
            }, 10 * 1000);
        }
    }
    if (chat.text == "/종료 결합") {
    	clearTimeout(createdGame[roomId].timeout);
        if (createdGame[roomId].players[0].score > createdGame[roomId].players[1].score) {
            chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame[roomId], 0)}님이 ${createdGame[roomId].players[0].score}점으로 이기셨습니다.`);
        } 
        else if (createdGame[roomId].players[0].score === createdGame[roomId].players[1].score) {
        	chat.replyText("무승부입니다.");
        } 
        else {
        	chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame[roomId], 1)}님이 ${createdGame[roomId].players[1].score}점으로 이기셨습니다.`);
        }
        createdGame[roomId] = undefined;
        roomOwner[roomId] = undefined;
    }
};

exports.combo = combo;