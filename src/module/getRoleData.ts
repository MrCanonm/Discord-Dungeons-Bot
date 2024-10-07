// export async function getRoleData(guild: any) {
//   const rolesId = {
//     tank: "737050898513133589",
//     healer: "1173103511077138473",
//     dps: "1173103557336113152",
//   };
//   const guildRoles = await guild.roles.fetch(); // Asegúrate de que esto es correcto

//   // Mapear los roles a sus IDs y nombres
//   return {
//     tank: {
//       id: rolesId.tank,
//       name: guildRoles.get(rolesId.tank)?.name || "Tanque",
//     },
//     healer: {
//       id: rolesId.healer,
//       name: guildRoles.get(rolesId.healer)?.name || "Healer",
//     },
//     dps: {
//       id: rolesId.dps,
//       name: guildRoles.get(rolesId.dps)?.name || "DPS",
//     },
//   };
// }
