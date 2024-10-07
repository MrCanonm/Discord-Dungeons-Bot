"use strict";
// import {
//   ChannelType,
//   Client,
//   GatewayIntentBits,
//   GuildMember,
//   VoiceChannel,
//   VoiceState,
// } from "discord.js";
// import { Session } from "./session";
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
// export async function moveToPartyVoiceChannel(
//   member: GuildMember,
//   session: Session
// ) {
//   // Verifica si ya existe un canal de voz
//   if (!session.voiceChannelId) {
//     try {
//       const dungeonName = session.selectedDungeon
//         ? session.selectedDungeon.name
//         : "Grupo de Mazmorras"; // Nombre por defecto
//       // Filtrar canales existentes
//       const existingChannels = member.guild.channels.cache.filter(
//         (channel) =>
//           channel.name.startsWith(`${dungeonName} Party`) &&
//           channel.type === ChannelType.GuildVoice
//       );
//       const channelNumber =
//         existingChannels.size > 0 ? existingChannels.size + 1 : 1; // Determinar el número del canal
//       const category = member.guild.channels.cache.find(
//         (c) =>
//           c.id === process.env.CATEGORY_ID &&
//           c.type === ChannelType.GuildCategory
//       );
//       // Crear el nuevo canal de voz
//       const newChannel = await member.guild.channels.create({
//         name: `${dungeonName} Party ${channelNumber}`, // Nombre del canal
//         type: ChannelType.GuildVoice,
//         parent: category?.id,
//       });
//       session.voiceChannelId = newChannel.id; // Almacenar ID del nuevo canal
//       console.log(`Canal creado: ${newChannel.name}, ID: ${newChannel.id}`);
//       // Listener para eliminar el canal si está vacío
//       const listener = (oldState: VoiceState, newState: VoiceState) => {
//         // Comprobar si el nuevo estado está asociado al canal creado
//         if (
//           newState.channelId === newChannel.id ||
//           oldState.channelId === newChannel.id
//         ) {
//           // Si ya no hay miembros en el canal
//           if (newChannel.members.size === 0) {
//             // Esperar 5 segundos antes de intentar eliminar el canal
//             setTimeout(() => {
//               if (newChannel.members.size === 0) {
//                 // Verificar nuevamente si sigue vacío
//                 newChannel
//                   .delete()
//                   .then(() => {
//                     console.log(
//                       `Canal eliminado: ${newChannel.name}, ID: ${newChannel.id}`
//                     );
//                     // Aquí se puede quitar el listener si es necesario
//                     client.off("voiceStateUpdate", listener); // Asegúrate de usar la instancia correcta
//                   })
//                   .catch((error) => {
//                     console.error(
//                       `Error al eliminar el canal de voz: ${error}`
//                     );
//                   });
//               }
//             }, 5000); // 5 segundos
//           }
//         }
//       };
//       // Escuchar cambios en el estado de voz
//       client.on("voiceStateUpdate", listener); // Reemplaza `client` con tu instancia de cliente de Discord
//     } catch (error) {
//       console.error(`Error al crear el canal de voz: ${error}`);
//       return; // Terminar la función si hay un error
//     }
//   }
//   // Mover al usuario al canal de voz creado
//   const channel = member.guild.channels.cache.get(
//     session.voiceChannelId
//   ) as VoiceChannel;
//   if (!channel || channel.type !== ChannelType.GuildVoice) return;
//   try {
//     await member.voice.setChannel(channel); // Mover al usuario
//   } catch (error) {
//     console.error(`Error al mover al usuario al canal de voz: ${error}`);
//   }
// }
// client.login(process.env.TOKEN);
