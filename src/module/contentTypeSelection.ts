// import {
//   ActionRowBuilder,
//   BaseInteraction,
//   Client,
//   EmbedBuilder,
//   GatewayIntentBits,
//   StringSelectMenuBuilder,
//   TextChannel,
// } from "discord.js";
// import { dungeons } from "./resource/mazmorras";
// import { eventTypes } from "./resource/eventsTypes";
// import { getRoleData } from "./getRoleData";
// import { createDungeonEmbed } from "./createPartyEmbed";
// import { createRoleMentionsMessage } from "./RoleMentionMessage";
// import { handleDungeonSelection } from "./dungeonSelection";
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
// const dungeonSessions = new Map<string, any>();

// export async function handleContentTypeSelection(
//   interaction: BaseInteraction,
//   sessionId: string
// ) {
//   const session = dungeonSessions.get(sessionId);
//   if (!session) return;

//   if (interaction.channel instanceof TextChannel) {
//     const collector = interaction.channel.createMessageComponentCollector({
//       time: 3600000, // 1 hora de tiempo límite
//     });

//     collector.on("collect", async (interaction: any) => {
//       // Selección de tipo de contenido
//       if (interaction.customId.startsWith(`select_content_type_${sessionId}`)) {
//         const selectedType = interaction.values[0]; // "dungeon", "contract", "abyss", "other"

//         if (selectedType === "mazmorras") {
//           // Mostrar lista de mazmorras
//           const row =
//             new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
//               new StringSelectMenuBuilder()
//                 .setCustomId(`select_dungeon_${sessionId}`)
//                 .setPlaceholder("Selecciona una mazmorra")
//                 .addOptions(
//                   dungeons.map((dungeon) => ({
//                     label: dungeon.name,
//                     description: `Selecciona ${dungeon.name}`,
//                     value: dungeon.name,
//                     emoji: "🔴",
//                   }))
//                 )
//             );

//           const embed = new EmbedBuilder()
//             .setTitle("Selecciona una mazmorra")
//             .setDescription(
//               "Elige la mazmorra para iniciar la creación del grupo."
//             )
//             .setColor(0x00ff00);

//           await interaction.update({
//             embeds: [embed],
//             components: [row],
//           });
//           await handleDungeonSelection(interaction, sessionId);
//         } else {
//           // Crea el grupo directamente para los otros tipos de contenido
//           const selectedEvent = eventTypes.find(
//             (event) => event.value === selectedType
//           );

//           // Asignar el label correspondiente al nombre del dungeon
//           if (selectedEvent) {
//             session.selectedDungeon = {
//               name: selectedEvent.label,
//               imageUrl: selectedEvent.imageUrl,
//             }; // Marcar tipo
//           }

//           const creatorId = interaction.user.id;

//           const guild = interaction.guild;
//           const rolesData = await getRoleData(guild);

//           const dungeonEmbed = await createDungeonEmbed(
//             session,
//             sessionId,
//             creatorId,
//             rolesData
//           );
//           await interaction.update(dungeonEmbed);
//           // Enviar menciones para reclutamiento
//           const roleMentionsMessage = createRoleMentionsMessage(
//             await getRoleData(interaction.guild)
//           );
//           await interaction.channel.send(roleMentionsMessage);
//           await handleDungeonSelection(interaction, sessionId);
//         }
//       }
//     });
//   }
// }
// client.login(process.env.TOKEN);
