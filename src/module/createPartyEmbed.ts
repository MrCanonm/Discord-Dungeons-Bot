// import {
//   ActionRowBuilder,
//   ButtonBuilder,
//   ButtonStyle,
//   Client,
//   EmbedBuilder,
//   GatewayIntentBits,
// } from "discord.js";
// import dotenv from "dotenv";
// dotenv.config();

// const client = new Client({
//   intents: [
//     GatewayIntentBits.Guilds,
//     GatewayIntentBits.GuildMessages,
//     GatewayIntentBits.MessageContent,
//     GatewayIntentBits.GuildVoiceStates,
//   ],
// });
// export async function createDungeonEmbed(
//   session: any,
//   sessionId: string,
//   creatorId: string,
//   roles: {
//     tank: { id: string; name: string };
//     healer: { id: string; name: string };
//     dps: { id: string; name: string };
//   }
// ) {
//   const { selectedDungeon } = session;

//   const embed = new EmbedBuilder()
//     .setTitle("Creacion de Grupo en Progreso")
//     .setDescription(
//       `** Grupo Para: ** ${session.selectedDungeon?.name || "Ninguna"}`
//     )
//     .setColor(0x00ff00)
//     .setImage(selectedDungeon.imageUrl)
//     .setColor(0x00ff00);

//   const tankDisplay = session.party.tank
//     ? `<@${session.party.tank}> (1/1)`
//     : "Ninguno (0/1)";

//   const healerDisplay = session.party.healer
//     ? `<@${session.party.healer}> (1/1)`
//     : "Ninguno (0/1)";

//   const dpsCount = session.party.dps.length;
//   const dpsDisplay =
//     dpsCount > 0
//       ? `(${dpsCount}/4)\n${session.party.dps
//           .map((id: string) => `<@${id}>`)
//           .join(", ")}`
//       : `(0/4)\nNinguno`;

//   embed.addFields(
//     {
//       name: "🛡️ Tanque",
//       value: tankDisplay,
//       inline: true,
//     },
//     {
//       name: "💉 Healer",
//       value: healerDisplay,
//       inline: true,
//     },
//     {
//       name: "⚔️ DPS",
//       value: dpsDisplay,
//       inline: true,
//     }
//   );

//   const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
//     new ButtonBuilder()
//       .setCustomId(`join_${sessionId}_tank`)
//       .setLabel(roles.tank.name) // Nombre del rol
//       .setEmoji("🛡️")
//       .setStyle(ButtonStyle.Primary),
//     new ButtonBuilder()
//       .setCustomId(`join_${sessionId}_healer`)
//       .setLabel(roles.healer.name) // Nombre del rol
//       .setEmoji("💉")
//       .setStyle(ButtonStyle.Primary),
//     new ButtonBuilder()
//       .setCustomId(`join_${sessionId}_dps`)
//       .setLabel(roles.dps.name) // Nombre del rol
//       .setEmoji("⚔️")
//       .setStyle(ButtonStyle.Primary),
//     new ButtonBuilder()
//       .setCustomId(`close_dungeon_${sessionId}`)
//       .setLabel("Cerrar Mazmorra")
//       .setStyle(ButtonStyle.Danger)
//   );

//   const creator = await client.users.fetch(creatorId);
//   embed.setFooter({ text: `Creador: ${creator.username}` });

//   return {
//     embeds: [embed],
//     components: [row],
//   };
// }
// client.login(process.env.TOKEN);
