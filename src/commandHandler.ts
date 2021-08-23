import * as Chess from "chess-base";
import * as cig from "chess-image-generator";
import { WAConnection, MessageType } from "@adiwajshing/baileys";

import { games, saveGames } from "./gameHandler";
import sharp = require("sharp");

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
  await imageGenerator.loadFEN(fen);
  const buffer = await imageGenerator.generateBuffer();
  const jpegBuffer = await sharp(buffer).jpeg().toBuffer();
  try {
    await conn.sendMessage(remoteJid, jpegBuffer, MessageType.image, {
      mimetype: "image/jpeg",
      caption:
        (whiteTurn(games[remoteJid].toFen()) ? "White" : "Black") +
        " has to make the next move.",
    });
  } catch (ex) {
    console.error(ex);
    await conn.sendMessage(
      remoteJid,
      "Something went wrong... try again in a few seconds.",
      MessageType.text
    );
  }
}

function whiteTurn(fen: string) {
  return fen.split(" ")[1] === "w";
}

function allowedToMakeMove(chess: Chess.Chess, fromMe: boolean) {
  const fen = chess.toFen();
  const isWhiteTurn = whiteTurn(fen);

  return (isWhiteTurn && fromMe) || (!isWhiteTurn && !fromMe);
}

export async function handleCommand(
  userInput: string,
  conn: WAConnection,
  remoteJid: string,
  fromMe: boolean
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
    case "castling":
      if (games[remoteJid] === undefined) return "Not ingame. Use #new";
      if (!allowedToMakeMove(games[remoteJid], fromMe)) {
        return "It's not your turn.";
      }
      try {
        games[remoteJid].castlingKing();
        sendUpdate = true;
        break;
      } catch {
        return "You can't castle right now.";
      }
    case "move":
      if (params.length != 1) {
        return "Wrong usage! Use for example: #move a2a4";
      }
      if (params[0].length == 4) {
        try {
          sendUpdate = true;
          let chess = games[remoteJid] ?? new Chess.Chess();
          if (!allowedToMakeMove(chess, fromMe)) {
            return "It's not your turn.";
          }
          chess.move(params[0].substr(0, 2), params[0].substr(2, 4));
          games[remoteJid] = chess;
          saveGames();
          break;
        } catch (ex) {
          console.log(ex);
          return "Invalid move";
        }
      } else {
        return "Wrong usage. Feeling lost? Type #help";
      }
    case "help":
      return "# WhatsApp Chess\n\n#new - starts a new game\n#move a2a4 - moves the piece on field a2 to field a4\n#status - display the current board and stats\n#castling - swap tower and king";
  }
  if (sendUpdate)
    await sendChessGame(conn, remoteJid, games[remoteJid].toFen());
  return "";
}
