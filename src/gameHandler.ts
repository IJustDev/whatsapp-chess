import * as Chess from "chess-base";
import * as fs from "fs";

export let games = {};

export function saveGames() {
  const content = {};
  console.log(Object.keys(games));
  for (let remoteJid of Object.keys(games)) {
    content[remoteJid] = games[remoteJid].toFen();
  }
  fs.writeFileSync("./games.json", JSON.stringify(content));
}

export function loadGames() {
  try {
    const content = JSON.parse(fs.readFileSync("./games.json").toString()); // load the gif
    Object.keys(content).map((c) => (games[c] = new Chess.Chess(content[c])));
  } catch {
    console.log("Having an error reading ./games.json, maybe not existent.");
  }
}
