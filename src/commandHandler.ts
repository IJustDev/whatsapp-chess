import { createCanvas, loadImage } from "canvas";
import * as Chess from "chess-base";
import * as cig from "chess-image-generator";
import * as path from "path";
import { WAConnection, MessageType } from "@adiwajshing/baileys";

import * as Frame from "canvas-to-buffer";

import { games, saveGames } from "./gameHandler";
import sharp = require("sharp");

const { cols, black, filePaths } = {
  cols: "abcdefgh",
  black: "pbnrqk",
  filePaths: {
    wp: "WhitePawn",
    bp: "BlackPawn",
    wb: "WhiteBishop",
    bb: "BlackBishop",
    wn: "WhiteKnight",
    bn: "BlackKnight",
    wr: "WhiteRook",
    br: "BlackRook",
    wq: "WhiteQueen",
    bq: "BlackQueen",
    wk: "WhiteKing",
    bk: "BlackKing",
  },
};

const imageGenerator = new cig({
  size: 1024,
  light: "#f1d9b5",
  dark: "#b58863",
  style: "merida",
  flipped: true,
});

const generateSVG = async (imgGen: cig) => {
  if (!imgGen.ready) {
    throw new Error("Load a position first");
  }

  const labelFieldSize = 64;

  const canvas = createCanvas(
    imgGen.size + labelFieldSize,
    imgGen.size + labelFieldSize
  );
  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.rect(
    0,
    0,
    imgGen.size + labelFieldSize * 2,
    imgGen.size + labelFieldSize * 2
  );
  ctx.fillStyle = imgGen.light;
  ctx.fill();

  for (let i = 0; i < 8; i += 1) {
    for (let j = 0; j < 8; j += 1) {
      if ((i + j) % 2 === 0) {
        ctx.beginPath();
        ctx.rect(
          (imgGen.size / 8) * (7 - j + 1) - imgGen.size / 8 + labelFieldSize,
          (imgGen.size / 8) * i,
          imgGen.size / 8,
          imgGen.size / 8
        );
        ctx.fillStyle = imgGen.dark;
        ctx.fill();
      }

      const piece = imgGen.chess.get(cols[7 - j] + (7 - i + 1));
      if (
        piece &&
        piece.type !== "" &&
        black.includes(piece.type.toLowerCase())
      ) {
        const image = `resources/${imgGen.style}/${
          filePaths[`${piece.color}${piece.type}`]
        }.png`;
        const imageFile = await loadImage(
          path.join(
            __dirname,
            "..",
            "node_modules",
            "chess-image-generator",
            "src",
            image
          )
        );

        await ctx.drawImage(
          imageFile,
          (imgGen.size / 8) * (7 - j + 1) - imgGen.size / 8 + labelFieldSize,
          (imgGen.size / 8) * i,
          imgGen.size / 8,
          imgGen.size / 8
        );
      }
    }
  }

  ctx.font = "40px serif bold";
  ctx.fillStyle = "#000";
  for (let i = 0; i < 8; i++) {
    ctx.fillText(
      (8 - i).toString(),
      labelFieldSize / 2 - labelFieldSize * 0.25,
      2 * i * labelFieldSize + labelFieldSize * 1.25
    );
  }
  for (let i = 0; i < 8; i++) {
    ctx.fillText(
      cols[i],
      2 * i * labelFieldSize + labelFieldSize * 1.75,
      imgGen.size + labelFieldSize / 2 + 16
    );
  }
  return { canvas, ctx };
};

async function sendChessGame(
  conn: WAConnection,
  remoteJid: string,
  fen: string
) {
  // Get the file name
  await imageGenerator.loadFEN(fen);
  const { canvas, ctx } = await generateSVG(imageGenerator);
  const buffer = new Frame(canvas, { image: { types: ["png"] } }).toBuffer();
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
