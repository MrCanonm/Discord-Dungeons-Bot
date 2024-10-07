// import { Client, GatewayIntentBits } from "discord.js";
// import { Session } from "./session";
// import dotenv from "dotenv";
// import { moveToPartyVoiceChannel } from "./bot";
// dotenv.config();

// const client = new Client({
//   intents: [
//     GatewayIntentBits.Guilds,
//     GatewayIntentBits.GuildMessages,
//     GatewayIntentBits.MessageContent,
//     GatewayIntentBits.GuildVoiceStates,
//   ],
// });

// export async function handleRoleSelection(
//   interaction: any,
//   session: Session,
//   role: string
// ) {
//   const { party, userRoles } = session;
//   const userId = interaction.user.id;
//   const previousRole = userRoles.get(userId);

//   if (previousRole) {
//     if (previousRole === role) {
//       // Deseleccionar el rol actual
//       if (role === "tank") party.tank = null;
//       else if (role === "healer") party.healer = null;
//       else if (role === "dps")
//         party.dps = party.dps.filter((id: string) => id !== userId);
//       userRoles.delete(userId);
//       return;
//     }
//     // Quitar el rol anterior
//     if (previousRole === "tank") party.tank = null;
//     else if (previousRole === "healer") party.healer = null;
//     else if (previousRole === "dps")
//       party.dps = party.dps.filter((id: string) => id !== userId);
//   }

//   // Asignar nuevo rol
//   let roleAssigned = false;
//   if (role === "tank" && !party.tank) {
//     party.tank = userId;
//     userRoles.set(userId, "tank");
//     roleAssigned = true;
//   } else if (role === "healer" && !party.healer) {
//     party.healer = userId;
//     userRoles.set(userId, "healer");
//     roleAssigned = true;
//   } else if (
//     role === "dps" &&
//     party.dps.length < 4 &&
//     !party.dps.includes(userId)
//   ) {
//     party.dps.push(userId);
//     userRoles.set(userId, "dps");
//     roleAssigned = true;
//   }

//   // Si se asignó un rol (nuevo o existente), mover al usuario al canal de voz del grupo
//   if (roleAssigned) {
//     const member = await interaction.guild.members.fetch(userId);
//     await moveToPartyVoiceChannel(member, session);
//   }

//   if (party.tank && party.healer && party.dps.length === 4) {
//     // Mencionar a todos los miembros
//     const mentions = `<@${party.tank}>, <@${party.healer}>, ${party.dps
//       .map((id: string) => `<@${id}>`)
//       .join(", ")}`;
//     await interaction.followUp({
//       content: `¡El grupo está completo! ${mentions}`,
//       components: [],
//     });
//   }
// }
// client.login(process.env.TOKEN);
