import { handleCommand } from "./commandHandler";

import { WAConnection, MessageType } from "@adiwajshing/baileys";

export async function handleMessage(conn: WAConnection, m: any) {
  const messageType = Object.keys(m.message)[0];
  const remoteJid = m.key.remoteJid;
  if (
    messageType === MessageType.text &&
    m.message.conversation.startsWith("#")
  ) {
    const command = m.message.conversation.toLowerCase();
    const response = await handleCommand(
      command,
      conn,
      m.key.remoteJid,
      m.key.fromMe
    );
    if (response !== "") {
      await conn.sendMessage(remoteJid, response, MessageType.text);
    }
  }

  const sender = m.key.participant ?? m.key.remoteJid;
  console.log(sender + ": " + m.message.conversation);
}
