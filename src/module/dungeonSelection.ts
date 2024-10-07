// import { BaseInteraction, TextChannel } from "discord.js";
// import { getRoleData } from "./getRoleData";
// import { dungeons } from "./resource/mazmorras";
// import { createDungeonEmbed } from "./createPartyEmbed";
// import { createRoleMentionsMessage } from "./RoleMentionMessage";
// import { handleRoleSelection } from "./roleSelecction";
// const dungeonSessions = new Map<string, any>();

// export async function handleDungeonSelection(
//   interaction: BaseInteraction,
//   sessionId: string
// ) {
//   const session = dungeonSessions.get(sessionId);
//   if (!session) return;

//   const creatorId = interaction.user.id;

//   const guild = interaction.guild; // Obtener la guild desde la interacción
//   const rolesData = await getRoleData(guild);

//   if (interaction.channel instanceof TextChannel) {
//     const collector = interaction.channel.createMessageComponentCollector({
//       time: 3600000, // 1 hora de tiempo límite
//     });

//     collector.on("collect", async (interaction: any) => {
//       if (interaction.customId.startsWith(`select_dungeon_${sessionId}`)) {
//         session.selectedDungeon =
//           dungeons.find((d) => d.name === interaction.values[0]) || null;

//         const dungeonEmbed = await createDungeonEmbed(
//           session,
//           sessionId,
//           creatorId,
//           rolesData
//         );
//         await interaction.update(dungeonEmbed);

//         // Enviar mensaje separado con menciones de roles
//         const roleMentionsMessage = createRoleMentionsMessage(rolesData);
//         await interaction.channel.send(roleMentionsMessage);
//       } else if (interaction.customId.startsWith(`join_${sessionId}`)) {
//         const [action, role] = interaction.customId.split("_").slice(1);
//         handleRoleSelection(interaction, session, role);
//         await interaction.update(
//           await createDungeonEmbed(session, sessionId, creatorId, rolesData),
//           await createDungeonEmbed(session, sessionId, creatorId, rolesData)
//         );
//       } else if (interaction.customId === `close_dungeon_${sessionId}`) {
//         // Verificar si el usuario que intenta cerrar es el creador
//         if (interaction.user.id !== creatorId) {
//           await interaction.reply({
//             content: "Solo el creador de la mazmorra puede cerrarla.",
//             ephemeral: true, // Solo visible para el usuario que intenta cerrar
//           });
//           return;
//         }

//         // Si es el creador, cerrar la mazmorra
//         await interaction.update({
//           content: "La mazmorra ha sido cerrada. ¡Gracias por jugar!",
//           components: [],
//           embeds: [],
//         });

//         // Enviar mensaje directo al creador informando el cierre
//         //await interaction.user.send("Has cerrado la mazmorra.");

//         dungeonSessions.delete(sessionId);
//         collector.stop();
//       }
//     });

//     collector.on("end", () => {
//       if (dungeonSessions.has(sessionId)) {
//         dungeonSessions.delete(sessionId);
//       }
//     });
//   }
// }
