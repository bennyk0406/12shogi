const node_kakao = require("node-kakao");
const email = "email";
const pw = "pw";
const client = new node_kakao.TalkClient("name", "uuid", { version: "3.2.6", appVersion: "3.2.6.2748", xvcSeedList: ["KEPHA", "HALEY"] });
const fs = require('fs');
const { game } = require('./game');
const { HooPiece } = require('./piece');
const { pieceTable } = require('./piecetable');

//login
client.login(email, pw, true).then(function () {
    console.log("Login!");
}).catch(function (error) {
    if (error.status === -100) {
        const readLine = require("readline");
        const rl = readLine.createInterface({
            input: process.stdin,output: process.stdout
        });
        client.Auth.requestPasscode(email, pw);
        rl.question("Passcode : ", function (answer) {
            client.Auth.registerDevice(answer, email, pw, true).then(function (res) {
                console.log(res);
                console.log("Login!");        
                process.exit();
            });
        });
    } else {
        console.log(JSON.stringify(error, null, 2));
    }
});

let createdGame;

client.on("message", async function (chat) {
   if (chat.text === "/게임 시작" && createdGame === undefined) {
        await chat.replyText("게임을 시작합니다.\n\n/게임 참가 명령어를 통해 게임에 참여해주세요.");
        createdGame = new game();
        createdGame.addPlayer(chat.sender.id.toString(), 'green');
    }
    if (chat.text === "/게임 참가" && createdGame !== undefined && createdGame.players.length === 1) {
        createdGame.addPlayer(chat.sender.id.toString(), 'red');
        createdGame.start();
        const mediaList = createdGame.map.raw.map(i => ({ type: 2, name: i===null?'white.png':`${i.team}_${i.name}.png`, width: 300, height: 300, data: fs.readFileSync('./pictures/'+(i===null?'white':i.team+'_'+i.name)+'.png'), ext:"png" }));
        await chat.replyMedia({'type': 27, 'mediaList':mediaList});
        await chat.replyText(`게임을 시작합니다.\n\n그린팀 : ${chat.Channel.getUserInfoId(createdGame.players[0].id).Nickname}님\n레드팀 : ${chat.Channel.getUserInfoId(createdGame.players[1].id).Nickname}님`);
        await chat.replyText(`선 플레이어는 ${chat.Channel.getUserInfoId(createdGame.players[createdGame.turnOwner].id).Nickname}님입니다.`);
    }
    if (chat.text.startsWith("이동 ") && createdGame !== undefined && createdGame.started && chat.sender.id.toString()===createdGame.players[createdGame.turnOwner].id) {
        const input = chat.text.slice(3).split(" ").map(i => parseInt(i));
        const prev = input[0]-1;
        const dest = input[1]-1;
        if (createdGame.map.raw[prev] !== null && createdGame.map.raw[prev].team === createdGame.players.find(i => i.id === chat.sender.id.toString()).team) {
            let result = createdGame.map.move(createdGame.map.raw[prev],prev,dest);
            if (result === false) {
                await chat.replyText('이동할 수 없는 지역입니다.');
                return;
            }
            else if (result.poro !== undefined) {
            	if (result.poro.name === 'king') {
            	    await chat.replyText(`${chat.Channel.getUserInfoId(chat.sender.id.toString()).Nickname}님이 왕을 잡아 승리하였습니다.`);
                    createdGame = undefined;
                    return;
                }
                await chat.replyText(`${chat.Channel.getUserInfoId(chat.sender.id.toString()).Nickname}님이 상대의 ${pieceTable[result.poro.name]} 말을 잡았습니다!\n다음 턴부터 상대의 진영을 제외한 곳에 내려놓을 수 있습니다.`);
            }
            if (createdGame.turnOwner===0 && createdGame.map.raw.slice(0,3).some(i => i!==null && i.name==='ja' && i.team==='green')) {
            	const index = createdGame.map.raw.findIndex(i => i!==null && i.name==='ja' && i.team==='green');
                createdGame.map.raw[index] = new HooPiece('green');
            }
            if (createdGame.turnOwner===1 && createdGame.map.raw.slice(9,12).some(i => i!==null && i.name==='ja' && i.team==='red')) {
            	const index = createdGame.map.raw.findIndex(i => i!==null && i.name==='ja' && i.team==='red');
                createdGame.map.raw[index] = new HooPiece('red');
            }
            createdGame.changeTurnOwner();
            if ((createdGame.turnOwner===0 && createdGame.map.raw.slice(0,3).some(i => i!==null && i.name==='king' && i.team==='green')) || (createdGame.turnOwner===1 && createdGame.map.raw.slice(9,12).some(i => i!==null && i.name==='king' && i.team==='red'))) {
            	await chat.replyText(`${chat.Channel.getUserInfoId(createdGame.players[createdGame.turnOwner].id).Nickname}님의 왕이 상대의 진영에서 한 턴 버텨 승리하셨습니다.`);
                createdGame = undefined;
                return;
            }
            const mediaList = createdGame.map.raw.map(i => ({ type: 2, name: i===null?'white':`${i.team}_${i.name}.png`, width: 300, height: 300, data: fs.readFileSync('./pictures/'+(i===null?'white':(i.team+'_'+i.name))+'.png'), ext:"png" }));
            await chat.replyMedia({'type': 27, 'mediaList':mediaList});
            await chat.replyText(`${chat.Channel.getUserInfoId(createdGame.players[createdGame.turnOwner].id).Nickname}님의 차례입니다.`);
        }
        else {
            await chat.replyText('자신의 말을 선택해주세요.');
        }
    }
    if (chat.text.startsWith("내려놓기 ") && createdGame !== undefined && createdGame.started && chat.sender.id.toString()===createdGame.players[createdGame.turnOwner].id) {
    	const input = chat.text.slice(5).split(" ");
        const selectedPiece = pieceTable[input[0]];
        const selectedPos = parseInt(input[1])-1;
        const senderTeam = createdGame.players[createdGame.turnOwner].team;
        if (!Object.keys(pieceTable).some(e => e===selectedPiece) || !createdGame.players.find(i => i.id===chat.sender.id.toString()).poro.some(e => e.name===selectedPiece)) {
        	await chat.replyText('내려놓을 수 없는 기물입니다.');
            return;
        }
        if (selectedPos<0 || selectedPos>11 || createdGame.map.raw[selectedPos] !== null) {
        	await chat.replyText('내려놓을 수 없는 위치입니다.');
            return;
        }
        if ((senderTeam === 'green' && selectedPos>=0 && selectedPos<=2) || (senderTeam === 'red' && selectedPos>=9 && selectedPos <= 11)) {
        	await chat.replyText('상대의 진영에는 말을 내려놓을 수 없습니다.');
            return;
        }
        createdGame.map.setPoroPos(senderTeam,selectedPiece,selectedPos);
        createdGame.changeTurnOwner();
        if ((createdGame.turnOwner===0 && createdGame.map.raw.slice(0,3).some(i => i!==null && i.name==='king' && i.team==='green')) || (createdGame.turnOwner===1 && createdGame.map.raw.slice(9,12).some(i => i!==null && i.name==='king' && i.team==='red'))) {
        	await chat.replyText(`${chat.Channel.getUserInfoId(createdGame.players[createdGame.turnOwner].id).Nickname}님의 왕이 상대의 진영에서 한 턴 버텨 승리하셨습니다.`);
            createdGame = undefined;
            return;
        }
        let mediaList = createdGame.map.raw.map(i => ({ type: 2, name: i===null?'white':`${i.team}_${i.name}.png`, width: 300, height: 300, data: fs.readFileSync('./pictures/'+(i===null?'white':(i.team+'_'+i.name))+'.png'), ext:"png" }));
        await chat.replyMedia({'type': 27, 'mediaList':mediaList});
        await chat.replyText(`${chat.Channel.getUserInfoId(createdGame.players[createdGame.turnOwner].id).Nickname}님의 차례입니다.`);
    }
    if (chat.text === "/테이블" && createdGame !== undefined && createdGame.started) {
    	let mediaList = createdGame.map.raw.map(i => ({ type: 2, name: i===null?'white':`${i.team}_${i.name}.png`, width: 300, height: 300, data: fs.readFileSync('./pictures/'+(i===null?'white':(i.team+'_'+i.name))+'.png'), ext:"png" }));
        await chat.replyMedia({'type': 27, 'mediaList':mediaList});
        return;
    }
    if (chat.text === "/포로" && createdGame !== undefined && createdGame.started) {
    	await chat.replyText(`${chat.Channel.getUserInfoId(createdGame.players[0].id).Nickname}님 : ${createdGame.players[0].poro.map(i => pieceTable[i.name]).join(", ")}
${chat.Channel.getUserInfoId(createdGame.players[1].id).Nickname}님 : ${createdGame.players[1].poro.map(i => pieceTable[i.name]).join(", ")}`);
        return;
    }
});