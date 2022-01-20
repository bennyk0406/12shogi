const { account } = require("../data/account");
const node_kakao = require("node-kakao");
const readline = require("readline");
const client = new node_kakao.TalkClient(account.clientName, account.uuid, { 
    version: "3.2.6", 
    appVersion: "3.2.6.2748", 
    xvcSeedList: ["KEPHA", "HALEY"] 
});

const login = function () {
    client.login(account.email, account.password, true)
        .then(function () {
            console.log("Login Success.");
        })
        .catch(function (error) {
            if (error.status === -100) {
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                client.Auth.requestPasscode(account.email, account.password);
                rl.question("Passcode : ", function (answer) {
                    client.Auth.registerDevice(answer, account.email, account.password, true)
                        .then(function () {
                            console.log("Login Success.");
                            process.exit();
                        });
                });
            } 
            else {
                console.log(JSON.stringify(error, null, 2));
            }
        });
};

exports.login = login;
exports.client = client;