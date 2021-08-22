import {
  WAConnection,
  MessageType,
  Presence,
  MessageOptions,
  Mimetype,
  WALocationMessage,
  WA_MESSAGE_STUB_TYPES,
  ReconnectMode,
  ProxyAgent,
  waChatKey,
  WAContact,
} from "@adiwajshing/baileys";
import * as fs from "fs";

import { handleMessage } from "./messageHandler";
import { loadGames } from "./gameHandler";

async function setUp() {
  loadGames();
  const conn = new WAConnection();

  conn.autoReconnect = ReconnectMode.onConnectionLost;

  conn.logger.level = "info"; // set to 'debug' to see what kind of stuff you can implement
  // attempt to reconnect at most 10 times in a row
  conn.connectOptions.maxRetries = 10;

  conn.chatOrderingKey = waChatKey(true); // order chats such that pinned chats are on top

  conn.on("contacts-received", () => {});

  conn.on("chats-received", ({ hasNewChats }) => {});

  conn.on("initial-data-received", () => {});

  fs.existsSync("./auth_info.json") && conn.loadAuthInfo("./auth_info.json");

  await conn.connect();

  const authInfo = conn.base64EncodedAuthInfo();

  fs.writeFileSync("./auth_info.json", JSON.stringify(authInfo, null, "\t")); // save this info to a file
  return conn;
}

async function start() {
  const conn = await setUp();

  conn.on("chat-update", async (chat) => {
    if (chat.presences) {
    }
    if (!chat.hasNewMessage) {
      if (chat.messages) {
        console.log("updated message: ", chat.messages.first);
      }
      return;
    }
    const m = chat.messages.all()[0]; // pull the new message from the update
    handleMessage(conn, m);
  });
}

start().catch((err) => console.log(`encountered err ${err}`));
