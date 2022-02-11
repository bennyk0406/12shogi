const { login, client } = require("./dist/login");
const { shogi } = require("./script/12shogi");
const { combo } = require("./script/combo");

login();

client.on("message", async function (chat) {
    await shogi(chat);
    await combo(chat);
});