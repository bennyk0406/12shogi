const fs = require("fs");
const { login, client } = require("./dist/login");
const { game } = require("./dist/game");
const { HooPiece } = require("./dist/piece");
const { pieceTable } = require("./dist/piecetable");
const { user } = require("./dist/user");
const picturesPath = "./data/pictures/";
const coordinate = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

login();

let createdGame;
let roomOwner;
let timeLimit;

client.on("message", async function (chat) {
    if (chat.text === "/도움말") {
        await chat.replyText(fs.readFileSync("./data/info.txt").toString());
        return;
    }
    if (chat.text === "/규칙") {
        await chat.replyText(fs.readFileSync("./data/rule.txt").toString());
        return;
    }
    if (chat.text.startsWith("/게임 시작") && createdGame === undefined) {
        const input = parseInt(chat.text.slice(6));
        if (isNaN(input)) {
            await chat.replyText("게임을 시작합니다.\n/게임 참가 명령어를 통해 게임에 참여해주세요.\n\n> 시간 제한 : False");
            timeLimit = false;
        }
        else {
            if (input <= 30) {
                await chat.replyText("제한 시간은 30초보다 길어야 합니다.");
                return;
            }
            await chat.replyText(`게임을 시작합니다.\n/게임 참가 명령어를 통해 게임에 참여해주세요.\n\n> 시간 제한 : ${input}초`);
            timeLimit = input;
        }
        createdGame = new game();
        roomOwner = chat.sender.id.toString();
    }

    if (createdGame === undefined) return;
    if (chat.text === "/게임 종료") {
        createdGame = undefined;
        roomOwner = undefined;
        await chat.replyText("게임이 종료되었습니다.");
        return;
    }
    if (chat.text === "/게임 참가" && roomOwner !== undefined) {
        if (chat.sender.id.toString() === roomOwner) {
            await chat.replyText("혼자서 게임할 수 없습니다.");
            return;
        }
        if (Math.random() < 0.5) {
            createdGame.addPlayer(chat.sender.id.toString(), "green");
            createdGame.addPlayer(roomOwner, "red");
        }
        else {
            createdGame.addPlayer(roomOwner, "green");
            createdGame.addPlayer(chat.sender.id.toString(), "red");
        }
        createdGame.start();
        const mediaList = createdGame.map.raw.map(i => (
            { 
                type: 2, 
                name: i === null ? "white.png" : `${i.team}_${i.name}.png`, 
                width: 300, 
                height: 300, 
                data: fs.readFileSync(picturesPath + (i === null ? "white.png" : `${i.team}_${i.name}.png`)), 
                ext: "png"
            }
        ));
        await chat.replyMedia({
            type: 27, 
            mediaList
        });
        const nickname = {
            green: user.getNicknameFromIndex(chat.Channel, createdGame, 0),
            red: user.getNicknameFromIndex(chat.Channel, createdGame, 1)
        }
        if (!!timeLimit) {
            createdGame.timeout = setTimeout(async () => {
                await createdGame.alertLeftTime(chat, 30);
                createdGame.timeout = setTimeout(async () => {
                    await createdGame.alertLeftTime(chat, 10);
                    createdGame.timeout = setTimeout(async () => {
                        await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님이 제한 시간 안에 수를 두지 못하여 패배하셨습니다.`);
                        roomOwner = undefined;
                        createdGame = undefined;
                        timeLimit = undefined;
                        return;
                    }, 10 * 1000);
                }, (30 - 10) * 1000);
            }, (timeLimit - 30) * 1000);
        }
        await chat.replyText(`게임을 시작합니다.\n\n그린팀 : ${nickname.green}님\n레드팀 : ${nickname.red}님`);
        await chat.replyText(`선 플레이어는 ${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님입니다.`);
    }

    if (!createdGame.started) return;
    if (chat.text.startsWith("이동 ") && createdGame.isTurnOwner(chat.sender.id.toString())) {
        const [prev, dest] = chat.text.slice(3).split(" ").map(i => parseInt(i) - 1);
        if (!coordinate.some(e => e === prev) && !coordinate.some(e => e === dest)) {
            await chat.replyText("좌표로는 1부터 12까지의 자연수만 입력할 수 있습니다.");
            return;
        }
        if (createdGame.map.raw[prev] !== null && createdGame.map.raw[prev].team === createdGame.getTeamById(chat.sender.id.toString())) {
            const result = createdGame.map.move(createdGame.map.raw[prev], prev, dest);
            if (!result) {
                await chat.replyText("이동할 수 없는 지역입니다.");
                return;
            }
            if (!!timeLimit) {
                clearTimeout(createdGame.timeout);
            }
            if (result.poro !== undefined) {
            	if (result.poro.name === "king") {
            	    await chat.replyText(`${user.getNicknameFromId(chat.Channel, chat.sender.id.toString())}님이 왕을 잡아 승리하였습니다.`);
                    createdGame = undefined;
                    roomOwner = undefined;
                    return;
                }
                await chat.replyText(`${user.getNicknameFromId(chat.Channel, chat.sender.id.toString())}님이 상대의 ${pieceTable[result.poro.name]} 말을 잡았습니다!`);
            }
            if (createdGame.hasOtherPiece(createdGame.turnOwner, "ja")) {
                const team = createdGame.getTeamByIndex(createdGame.turnOwner);
                let jaIndex;
                if (team === "green") {
                    jaIndex = createdGame.map.raw.slice(0, 3).findIndex(i => i !== null && i.name === "ja" && i.team === team);
                }
                else {
                    jaIndex = createdGame.map.raw.slice(9, 12).findIndex(i => i !== null && i.name === "ja" && i.team === team) + 9;
                }
                createdGame.map.raw[jaIndex] = new HooPiece(team);
                await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님의 자가 상대의 진영에 들어가 이제부터 후로 사용됩니다.`);
            }
            createdGame.changeTurnOwner();
            if (createdGame.hasOtherPiece(createdGame.turnOwner, "king")) {
            	await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님의 왕이 상대의 진영에서 한 턴 버텨 승리하셨습니다.`);
                createdGame = undefined;
                roomOwner = undefined;
                return;
            }
            const mediaList = createdGame.map.raw.map(i => (
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
            await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님의 차례입니다.`);
            if (!!timeLimit) {
                createdGame.timeout = setTimeout(async () => {
                    await createdGame.alertLeftTime(chat, 30);
                    createdGame.timeout = setTimeout(async () => {
                        await createdGame.alertLeftTime(chat, 10);
                        createdGame.timeout = setTimeout(async () => {
                            await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님이 제한 시간 안에 수를 두지 못하여 패배하셨습니다.`);
                            roomOwner = undefined;
                            createdGame = undefined;
                            timeLimit = undefined;
                            return;
                        }, 10 * 1000);
                    }, (30 - 10) * 1000);
                }, (timeLimit - 30) * 1000);
            }
        }
        else {
            await chat.replyText("자신의 말을 선택해주세요.");
        }
    }
    if (chat.text.startsWith("내려놓기 ") && createdGame.isTurnOwner(chat.sender.id.toString())) {
    	const input = chat.text.slice(5).split(" ");
        const selectedPiece = pieceTable[input[0]];
        const selectedPos = parseInt(input[1]) - 1;
        if (!coordinate.some(e => e === selectedPos)) {
            await chat.replyText("좌표로는 1부터 12까지의 자연수만 입력할 수 있습니다.");
            return;
        }
        const senderTeam = createdGame.players[createdGame.turnOwner].team;
        if (!Object.keys(pieceTable).some(e => e === selectedPiece) || !createdGame.players.find(i => i.id===chat.sender.id.toString()).poro.some(e => e.name === selectedPiece)) {
        	await chat.replyText("내려놓을 수 없는 기물입니다.");
            return;
        }
        if (selectedPos < 0 || selectedPos > 11 || createdGame.map.raw[selectedPos] !== null) {
        	await chat.replyText("내려놓을 수 없는 위치입니다.");
            return;
        }
        if ((senderTeam === "green" && selectedPos >= 0 && selectedPos <= 2) || (senderTeam === "red" && selectedPos >= 9 && selectedPos <= 11)) {
        	await chat.replyText("상대의 진영에는 말을 내려놓을 수 없습니다.");
            return;
        }
        if (!!timeLimit) {
            clearTimeout(createdGame.timeout);
        }
        createdGame.map.setPoroPos(senderTeam, selectedPiece, selectedPos);
        createdGame.changeTurnOwner();
        if (createdGame.hasOtherPiece(createdGame.turnOwner, "king")) {
            await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님의 왕이 상대의 진영에서 한 턴 버텨 승리하셨습니다.`);
            createdGame = undefined;
            roomOwner = undefined;
            return;
        }
        const mediaList = createdGame.map.raw.map(i => (
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
        await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님의 차례입니다.`);
        if (!!timeLimit) {
            createdGame.timeout = setTimeout(async () => {
                await createdGame.alertLeftTime(chat, 30);
                createdGame.timeout = setTimeout(async () => {
                    await createdGame.alertLeftTime(chat, 10);
                    createdGame.timeout = setTimeout(async () => {
                        await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님이 제한 시간 안에 수를 두지 못하여 패배하셨습니다.`);
                        roomOwner = undefined;
                        createdGame = undefined;
                        timeLimit = undefined;
                        return;
                    }, 10 * 1000);
                }, (30 - 10) * 1000);
            }, (timeLimit - 30) * 1000);
        }
    }
    if (chat.text === "/테이블") {
    	const mediaList = createdGame.map.raw.map(i => (
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
        await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, createdGame.turnOwner)}님의 차례입니다.`);
        return;
    }
    if (chat.text === "/포로") {
    	await chat.replyText(`${user.getNicknameFromIndex(chat.Channel, createdGame, 0)}님 : ${createdGame.players[0].poro.map(i => pieceTable[i.name]).sort().join(", ")}\n${user.getNicknameFromIndex(chat.Channel, createdGame, 1)}님 : ${createdGame.players[1].poro.map(i => pieceTable[i.name]).sort().join(", ")}`);
        return;
    }
});