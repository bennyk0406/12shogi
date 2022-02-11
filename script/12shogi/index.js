const fs = require("fs");
const path = require("path");
const { game } = require("./dist/game");
const { HooPiece } = require("./dist/piece");
const { pieceTable } = require("./dist/piecetable");
const { user } = require("./dist/user");
const { teamTable } = require("./dist/team");
const coordinate = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const picturesPath = "./pictures/";

const createdGame = new game();
const roomOwner = {};

const shogi = async function (chat) {
    const roomId = chat.Channel.id.toString();
    if (chat.text === "/도움말") {
        await chat.replyText(fs.readFileSync("./data/info.txt").toString());
        return;
    }
    if (chat.text === "/규칙") {
        await chat.replyText(fs.readFileSync("./data/rule.txt").toString());
        return;
    }
    if (chat.text.startsWith("/시작 십이장기") && createdGame[roomId] === undefined) {
        const input = parseInt(chat.text.slice(8));
        if (isNaN(input)) {
            await chat.replyText("십이장기 게임을 시작합니다.\n/참가 십이장기 명령어를 통해 게임에 참여해주세요.\n\n> 시간 제한 : 없음");
            createdGame.addRoom(roomId);
            createdGame[roomId].timeLimit = false;
        }
        else {
            if (input <= 30 || input >= 600) {
                await chat.replyText("제한 시간은 30초보다 길고 10분보다 짧아야 합니다.");
                return;
            }
            await chat.replyText(`십이장기 게임을 시작합니다.\n/참가 십이장기 명령어를 통해 게임에 참여해주세요.\n\n> 시간 제한 : ${input}초`);
            createdGame.addRoom(roomId);
            createdGame[roomId].timeLimit = input;
        }
        roomOwner[roomId] = chat.sender.id.toString();
        return;
    }

    if (createdGame[roomId] === undefined) return;

    if (chat.text === "/참가 십이장기" && !createdGame[roomId].started) {
        if (Math.random() < 0.5) {
            createdGame.addPlayer(roomId, chat.sender.id.toString(), "green");
            createdGame.addPlayer(roomId, roomOwner[roomId], "red");
        }
        else {
            createdGame.addPlayer(roomId, roomOwner[roomId], "green");
            createdGame.addPlayer(roomId, chat.sender.id.toString(), "red");
        }
        createdGame.start(roomId);
        const mediaList = createdGame[roomId].map.raw.map(i => (
            { 
                type: 2, 
                name: i === null ? "white.png" : `${i.team}_${i.name}.png`, 
                width: 300, 
                height: 300, 
                data: fs.readFileSync(path.resolve(__dirname, picturesPath, (i === null ? "./white.png" : `./${i.team}_${i.name}.png`))), 
                ext: "png"
            }
        ));
        await chat.replyMedia({
            type: 27, 
            mediaList
        });
        if (!!createdGame[roomId].timeLimit) {
            createdGame[roomId].timeout = setTimeout(async () => {
                await createdGame.alertLeftTime(roomId, chat, 30);
                createdGame[roomId].timeout = setTimeout(async () => {
                    await createdGame.alertLeftTime(roomId, chat, 10);
                    createdGame[roomId].timeout = setTimeout(async () => {
                        await createdGame.alertLeftTime(roomId, chat, 5);
                        createdGame[roomId].timeout = setTimeout(async () => {
                            await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님이 제한 시간 안에 수를 두지 못하여 패배하셨습니다.`);
                            await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner === "green" ? "red" : "green")}님의 승리로 게임을 종료합니다.`);
                            roomOwner[roomId] = undefined;
                            clearTimeout(createdGame[roomId].timeout);
                            createdGame[roomId] = undefined;
                            return;
                        }, 8 * 1000)
                    }, (10 - 5) * 1000);
                }, (30 - 10) * 1000);
            }, (createdGame[roomId].timeLimit - 30) * 1000);
        }
        await chat.replyText(`게임을 시작합니다.\n\n레드팀 : ${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], "red")}님\n그린팀 : ${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], "green")}님`);
        await chat.replyText(`선 플레이어는 ${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님입니다.`);
        return;
    }
    if (chat.text === "/종료 십이장기" && ((!createdGame[roomId].started && roomOwner[roomId] === chat.sender.id.toString()) || (createdGame[roomId].started && Object.keys(createdGame[roomId].players).some(e => createdGame[roomId].players[e].id === chat.sender.id.toString())))) {
        createdGame[roomId] = undefined;
        roomOwner[roomId] = undefined;
        await chat.replyText("십이장기 게임이 종료되었습니다.");
        return;
    }

    if (!createdGame[roomId].started) return;

    if (chat.text.startsWith("이동 ") && createdGame.isTurnOwner(roomId, chat.sender.id.toString())) {
        const [prev, dest] = chat.text.slice(3).split(" ").map(i => parseInt(i) - 1);
        if (!coordinate.some(e => e === prev) || !coordinate.some(e => e === dest)) {
            await chat.replyText("좌표로는 1부터 12까지의 자연수만 입력할 수 있습니다.");
            return;
        }
        if (createdGame[roomId].map.raw[prev] !== null && createdGame[roomId].map.raw[prev].team === createdGame[roomId].turnOwner) {
            const result = createdGame[roomId].map.move(roomId, createdGame[roomId].map.raw[prev], prev, dest);
            if (!result) {
                await chat.replyText("이동할 수 없는 지역입니다.");
                return;
            }
            if (!!createdGame[roomId].timeLimit) {
                clearTimeout(createdGame[roomId].timeout);
            }
            if (result.captive !== undefined) {
            	if (result.captive.name === "king") {
            	    await chat.replyText(`${user.getNicknameFromId(chat.Channel, chat.sender.id.toString())}(${teamTable[createdGame[roomId].turnOwner]})님이 상대의 왕을 잡으셨습니다.`);
                    await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}님의 승리로 게임을 종료합니다.`);
                    createdGame[roomId] = undefined;
                    roomOwner[roomId] = undefined;
                    return;
                }
                await chat.replyText(`${user.getNicknameFromId(chat.Channel, chat.sender.id.toString())}(${teamTable[createdGame[roomId].turnOwner]})님이 상대의 ${pieceTable[result.captive.name]} 말을 잡았습니다!`);
            }
            if (createdGame.hasOtherPiece(roomId, createdGame[roomId].turnOwner, "ja")) {
                let jaIndex;
                if (createdGame[roomId].turnOwner === "green") {
                    jaIndex = createdGame[roomId].map.raw.slice(0, 3).findIndex(i => i !== null && i.name === "ja" && i.team === team);
                }
                else {
                    jaIndex = createdGame[roomId].map.raw.slice(9, 12).findIndex(i => i !== null && i.name === "ja" && i.team === team) + 9;
                }
                createdGame[roomId].map.raw[jaIndex] = new HooPiece(team);
                await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님의 자가 상대의 진영에 들어가 이제부터 후로 사용됩니다.`);
            }
            if (createdGame.hasOtherPiece(roomId, createdGame[roomId].turnOwner, "king")) {
            	await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님의 왕이 상대의 진영에 들어갔습니다.\n왕이 다음 차례가 돌아올 때까지 상대의 진영에서 버티게 되면, ${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님이 승리하게 됩니다.`);
            }
            createdGame.changeTurnOwner(roomId);
            if (createdGame.hasOtherPiece(roomId, createdGame[roomId].turnOwner, "king")) {
            	await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님의 왕이 상대의 진영에서 한 턴 버텼습니다.`);
                await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}님의 승리로 게임을 종료합니다.`);
                createdGame[roomId] = undefined;
                roomOwner[roomId] = undefined;
                return;
            }
            const mediaList = createdGame[roomId].map.raw.map(i => (
                { 
                    type: 2, 
                    name: i === null ? "white.png" : `${i.team}_${i.name}.png`, 
                    width: 300, 
                    height: 300, 
                    data: fs.readFileSync(path.resolve(__dirname, picturesPath, (i === null ? "./white.png" : `./${i.team}_${i.name}.png`))), 
                    ext: "png"
                }
            ));
            await chat.replyMedia(
                {
                    "type": 27,
                    mediaList
                }
            );
            await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님의 차례입니다.`);
            if (!!createdGame[roomId].timeLimit) {
                createdGame[roomId].timeout = setTimeout(async () => {
                    await createdGame.alertLeftTime(roomId, chat, 30);
                    createdGame[roomId].timeout = setTimeout(async () => {
                        await createdGame.alertLeftTime(roomId, chat, 10);
                        createdGame[roomId].timeout = setTimeout(async () => {
                            await createdGame.alertLeftTime(roomId, chat, 5);
                            createdGame[roomId].timeout = setTimeout(async () => {
                                await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님이 제한 시간 안에 수를 두지 못하여 패배하셨습니다.`);
                                await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner === "green" ? "red" : "green")}님의 승리로 게임을 종료합니다.`);
                                roomOwner[roomId] = undefined;
                                clearTimeout(createdGame[roomId].timeout);
                                createdGame[roomId] = undefined;
                                return;
                            }, 8 * 1000)
                        }, (10 - 5) * 1000);
                    }, (30 - 10) * 1000);
                }, (createdGame[roomId].timeLimit - 30) * 1000);
            }
            return;
        }
        else {
            await chat.replyText("자신의 말을 선택해주세요.");
            return;
        }
    }
    if (chat.text.startsWith("내려놓기 ") && createdGame.isTurnOwner(roomId, chat.sender.id.toString())) {
    	const input = chat.text.slice(5).split(" ");
        const selectedPiece = pieceTable[input[0]];
        const selectedPos = parseInt(input[1]) - 1;
        if (!coordinate.some(e => e === selectedPos)) {
            await chat.replyText("좌표로는 1부터 12까지의 자연수만 입력할 수 있습니다.");
            return;
        }
        if (!Object.keys(pieceTable).some(e => e === selectedPiece) || !createdGame[roomId].players[Object.keys(createdGame[roomId].players).find(i => i === createdGame[roomId].turnOwner)].captive.some(e => e.name === selectedPiece)) {
        	await chat.replyText("내려놓을 수 없는 기물입니다.");
            return;
        }
        if (createdGame[roomId].map.raw[selectedPos] !== null) {
        	await chat.replyText("내려놓을 수 없는 위치입니다.");
            return;
        }
        if ((createdGame[roomId].turnOwner === "green" && selectedPos <= 2) || (createdGame[roomId].turnOwner === "red" && selectedPos >= 9)) {
        	await chat.replyText("상대의 진영에는 말을 내려놓을 수 없습니다.");
            return;
        }
        if (!!createdGame[roomId].timeLimit) {
            clearTimeout(createdGame[roomId].timeout);
        }
        createdGame[roomId].map.setCaptivePos(roomId, createdGame[roomId].turnOwner, selectedPiece, selectedPos);
        createdGame.changeTurnOwner(roomId);
        if (createdGame.hasOtherPiece(roomId, createdGame[roomId].turnOwner, "king")) {
            await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님의 왕이 상대의 진영에서 한 턴 버텼습니다.`);
            await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}님의 승리로 게임을 종료합니다.`);            
            createdGame[roomId] = undefined;
            roomOwner[roomId] = undefined;
            return;
        }
        const mediaList = createdGame[roomId].map.raw.map(i => (
            { 
                type: 2, 
                name: i === null ? "white.png" : `${i.team}_${i.name}.png`, 
                width: 300, 
                height: 300, 
                data: fs.readFileSync(path.resolve(__dirname, picturesPath, (i === null ? "./white.png" : `./${i.team}_${i.name}.png`))), 
                ext: "png"
            }
        ));
        await chat.replyMedia(
            {
                "type": 27,
                mediaList
            }
        );
        await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님의 차례입니다.`);
        if (!!createdGame[roomId].timeLimit) {
            createdGame[roomId].timeout = setTimeout(async () => {
                await createdGame.alertLeftTime(roomId, chat, 30);
                createdGame[roomId].timeout = setTimeout(async () => {
                    await createdGame.alertLeftTime(roomId, chat, 10);
                    createdGame[roomId].timeout = setTimeout(async () => {
                        await createdGame.alertLeftTime(roomId, chat, 5);
                        createdGame[roomId].timeout = setTimeout(async () => {
                            await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님이 제한 시간 안에 수를 두지 못하여 패배하셨습니다.`);
                            await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner === "green" ? "red" : "green")}님의 승리로 게임을 종료합니다.`);
                            roomOwner[roomId] = undefined;
                            clearTimeout(createdGame[roomId].timeout);
                            createdGame[roomId] = undefined;
                            return;
                        }, 8 * 1000)
                    }, (10 - 5) * 1000);
                }, (30 - 10) * 1000);
            }, (createdGame[roomId].timeLimit - 30) * 1000);
        }
    }
    if (chat.text === "/테이블") {
    	const mediaList = createdGame[roomId].map.raw.map(i => (
            {
                type: 2, 
                name: i === null ? "white.png" : `${i.team}_${i.name}.png`, 
                width: 300, 
                height: 300, 
                data: fs.readFileSync(picturesPath + (i === null ? "white.png" : `${i.team}_${i.name}.png`)), 
                ext: "png"
            }
        ));
        await chat.replyMedia(
            {
                "type": 27,
                mediaList
            }
        );
        await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], createdGame[roomId].turnOwner)}(${teamTable[createdGame[roomId].turnOwner]})님의 차례입니다.`);
        return;
    }
    if (chat.text === "/포로") {
    	await chat.replyText(`${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], "red")}(레드)님 : ${createdGame[roomId].players.red.captive.map(i => pieceTable[i.name]).sort().join(", ")}\n${user.getNicknameFromTeam(chat.Channel, createdGame[roomId], "green")}(그린)님 : ${createdGame[roomId].players.green.captive.map(i => pieceTable[i.name]).sort().join(", ")}`);
        return;
    }
}

exports.shogi = shogi;