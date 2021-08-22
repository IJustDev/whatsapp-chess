import * as Chess from "chess-base";
import * as fs from "fs";
import * as path from "path";
import * as cig from "chess-image-generator";
import { WAConnection, MessageType } from "@adiwajshing/baileys";

import { games, saveGames } from "./gameHandler";

const currentChess = new Chess.Chess();
const imageGenerator = new cig({
  size: 1024,
  light: "#f1d9b5",
  dark: "#b58863",
  style: "merida",
  flipped: true,
});

async function sendChessGame(
  conn: WAConnection,
  remoteJid: string,
  fen: string
) {
  // Get the file name
  const fileName = path.basename("test.png");

  // The path of the downloaded file on our machine
  const localFilePath = path.resolve(__dirname, "/tmp", fileName);

  await imageGenerator.loadFEN(fen);
  await imageGenerator.generatePNG(localFilePath);
  await setTimeout(async () => {
    try {
      const content = fs.readFileSync(localFilePath); // load the gif
      await conn.sendMessage(remoteJid, content, MessageType.image);
    } catch (ex) {
      console.error(ex);
      await conn.sendMessage(
        remoteJid,
        "Something went wrong... try again in a few seconds.",
        MessageType.text
      );
    }
  }, 500);
}

export async function handleCommand(
  userInput: string,
  conn: WAConnection,
  remoteJid: string
): Promise<string> {
  const commandParts = userInput.split(" ");

  const command = commandParts[0];
  const params = commandParts.slice(1, commandParts.length);
  let sendUpdate = false;

  switch (command.substr(1, command.length)) {
    case "new":
      games[remoteJid] = new Chess.Chess();
      sendUpdate = true;
      break;
    case "status":
      if (games[remoteJid] !== undefined) sendUpdate = true;
      else return "Start a new game by using #new";
      break;
    case "move":
      if (params.length != 1) {
        return "Verwende zum Beispiel #move a2a4";
      }
      if (params[0].length == 4) {
        try {
          sendUpdate = true;
          let chess = games[remoteJid] ?? new Chess.Chess();
          chess.move(params[0].substr(0, 2), params[0].substr(2, 4));
          games[remoteJid] = chess;
          saveGames();
          break;
        } catch (ex) {
          console.log(ex);
          return "Invalid move";
        }
      } else {
        return "Wrong usage. Feeling lost? Write #help";
      }
    case "help":
      return "# WhatsApp Chess\n\n#new - starts a new game\n#move a2a4 - moves the piece on field a2 to field a4\n#status - display the current board and stats";
  }
  if (sendUpdate)
    await sendChessGame(conn, remoteJid, games[remoteJid].toFen());
  return "";
}
