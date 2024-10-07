import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  BaseInteraction,
  TextChannel,
  GuildMember,
  VoiceChannel,
  ChannelType,
  VoiceState,
} from "discord.js";
import { dungeons } from "./resource/mazmorras";
import dotenv from "dotenv";
import { eventTypes } from "./resource/eventsTypes";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

interface Session {
  party: {
    tank: string | null;
    healer: string | null;
    dps: string[];
  };
  userRoles: Map<string, string>;
  voiceChannelId: string | null;
  selectedDungeon: (typeof dungeons)[0] | null;
}
// Define tus comandos
const commands = [
  {
    name: "findparty",
    description: "Crear grupos tanto para mazmorras como para otros.",
  },
];

// Reemplaza con tu token y IDs
const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Iniciando la actualización de comandos de aplicación (/)...");
    await rest.put(
      Routes.applicationGuildCommands(
        "1291449338341490748",
        process.env.SERVER_ID
      ),
      {
        body: commands,
      }
    );
    console.log("Comandos de aplicación actualizados.");
  } catch (error) {
    console.error(error);
  }
})();

client.once("ready", () => {
  console.log(`Bot is online!`);
});

// Aquí se guardarán los datos por interacción
const dungeonSessions = new Map<string, any>();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "findparty") {
    const sessionId = Date.now().toString();
    dungeonSessions.set(sessionId, {
      party: {
        tank: null,
        healer: null,
        dps: [],
      },
      userRoles: new Map(),
      selectedDungeon: null,
      creatorId: interaction.user.id,
    });

    // Preguntar al usuario qué tipo de grupo quiere crear
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`select_content_type_${sessionId}`)
        .setPlaceholder("Selecciona el tipo de grupo")
        .addOptions(eventTypes)
    );

    const embed = new EmbedBuilder()
      .setTitle("Selecciona el tipo de contenido")
      .setDescription(
        "Elige el tipo de contenido para el que quieres crear el grupo."
      )
      .setColor(0x00ff00);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    // Manejar la selección del tipo de contenido
    handleContentTypeSelection(interaction, sessionId);
  }
});

// Cambia la firma de la función para aceptar el sessionId
async function handleDungeonSelection(
  interaction: BaseInteraction,
  sessionId: string
) {
  const session = dungeonSessions.get(sessionId);
  if (!session) return;

  const creatorId = interaction.user.id;

  const guild = interaction.guild; // Obtener la guild desde la interacción
  const rolesData = await getRoleData(guild);

  if (interaction.channel instanceof TextChannel) {
    const collector = interaction.channel.createMessageComponentCollector({
      time: 3600000, // 1 hora de tiempo límite
    });

    collector.on("collect", async (interaction: any) => {
      if (interaction.customId.startsWith(`select_dungeon_${sessionId}`)) {
        session.selectedDungeon =
          dungeons.find((d) => d.name === interaction.values[0]) || null;

        const dungeonEmbed = await createDungeonEmbed(
          session,
          sessionId,
          creatorId,
          rolesData
        );
        await interaction.update(dungeonEmbed);

        // Enviar mensaje separado con menciones de roles
        const roleMentionsMessage = createRoleMentionsMessage(rolesData);
        await interaction.channel.send(roleMentionsMessage);
      } else if (interaction.customId.startsWith(`join_${sessionId}`)) {
        const [action, role] = interaction.customId.split("_").slice(1);
        handleRoleSelection(interaction, session, role);
        await interaction.update(
          await createDungeonEmbed(session, sessionId, creatorId, rolesData),
          await createDungeonEmbed(session, sessionId, creatorId, rolesData)
        );
      } else if (interaction.customId === `close_dungeon_${sessionId}`) {
        // Verificar si el usuario que intenta cerrar es el creador
        if (interaction.user.id !== creatorId) {
          await interaction.reply({
            content: "Solo el creador de la mazmorra puede cerrarla.",
            ephemeral: true, // Solo visible para el usuario que intenta cerrar
          });
          return;
        }

        // Si es el creador, cerrar la mazmorra
        await interaction.update({
          content: "La mazmorra ha sido cerrada. ¡Gracias por jugar!",
          components: [],
          embeds: [],
        });

        // Enviar mensaje directo al creador informando el cierre
        //await interaction.user.send("Has cerrado la mazmorra.");

        dungeonSessions.delete(sessionId);
        collector.stop();
      }
    });

    collector.on("end", () => {
      if (dungeonSessions.has(sessionId)) {
        dungeonSessions.delete(sessionId);
      }
    });
  }
}

async function handleContentTypeSelection(
  interaction: BaseInteraction,
  sessionId: string
) {
  const session = dungeonSessions.get(sessionId);
  if (!session) return;

  if (interaction.channel instanceof TextChannel) {
    const collector = interaction.channel.createMessageComponentCollector({
      time: 3600000, // 1 hora de tiempo límite
    });

    collector.on("collect", async (interaction: any) => {
      // Selección de tipo de contenido
      if (interaction.customId.startsWith(`select_content_type_${sessionId}`)) {
        const selectedType = interaction.values[0]; // "dungeon", "contract", "abyss", "other"

        if (selectedType === "mazmorras") {
          // Mostrar lista de mazmorras
          const row =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`select_dungeon_${sessionId}`)
                .setPlaceholder("Selecciona una mazmorra")
                .addOptions(
                  dungeons.map((dungeon) => ({
                    label: dungeon.name,
                    description: `Selecciona ${dungeon.name}`,
                    value: dungeon.name,
                    emoji: "🔴",
                  }))
                )
            );

          const embed = new EmbedBuilder()
            .setTitle("Selecciona una mazmorra")
            .setDescription(
              "Elige la mazmorra para iniciar la creación del grupo."
            )
            .setColor(0x00ff00);

          await interaction.update({
            embeds: [embed],
            components: [row],
          });
          await handleDungeonSelection(interaction, sessionId);
        } else {
          // Crea el grupo directamente para los otros tipos de contenido
          const selectedEvent = eventTypes.find(
            (event) => event.value === selectedType
          );

          // Asignar el label correspondiente al nombre del dungeon
          if (selectedEvent) {
            session.selectedDungeon = {
              name: selectedEvent.label,
              imageUrl: selectedEvent.imageUrl,
            }; // Marcar tipo
          }

          const creatorId = interaction.user.id;

          const guild = interaction.guild;
          const rolesData = await getRoleData(guild);

          const dungeonEmbed = await createDungeonEmbed(
            session,
            sessionId,
            creatorId,
            rolesData
          );
          await interaction.update(dungeonEmbed);
          // Enviar menciones para reclutamiento
          const roleMentionsMessage = createRoleMentionsMessage(
            await getRoleData(interaction.guild)
          );
          await interaction.channel.send(roleMentionsMessage);
          await handleDungeonSelection(interaction, sessionId);
        }
      }
    });
  }
}

async function handleRoleSelection(
  interaction: any,
  session: Session,
  role: string
) {
  const { party, userRoles } = session;
  const userId = interaction.user.id;
  const previousRole = userRoles.get(userId);

  if (previousRole) {
    if (previousRole === role) {
      // Deseleccionar el rol actual
      if (role === "tank") party.tank = null;
      else if (role === "healer") party.healer = null;
      else if (role === "dps")
        party.dps = party.dps.filter((id: string) => id !== userId);
      userRoles.delete(userId);
      return;
    }
    // Quitar el rol anterior
    if (previousRole === "tank") party.tank = null;
    else if (previousRole === "healer") party.healer = null;
    else if (previousRole === "dps")
      party.dps = party.dps.filter((id: string) => id !== userId);
  }

  // Asignar nuevo rol
  let roleAssigned = false;
  if (role === "tank" && !party.tank) {
    party.tank = userId;
    userRoles.set(userId, "tank");
    roleAssigned = true;
  } else if (role === "healer" && !party.healer) {
    party.healer = userId;
    userRoles.set(userId, "healer");
    roleAssigned = true;
  } else if (
    role === "dps" &&
    party.dps.length < 4 &&
    !party.dps.includes(userId)
  ) {
    party.dps.push(userId);
    userRoles.set(userId, "dps");
    roleAssigned = true;
  }

  // Si se asignó un rol (nuevo o existente), mover al usuario al canal de voz del grupo
  if (roleAssigned) {
    const member = await interaction.guild.members.fetch(userId);
    await moveToPartyVoiceChannel(member, session);
  }

  if (party.tank && party.healer && party.dps.length === 4) {
    // Mencionar a todos los miembros
    const mentions = `<@${party.tank}>, <@${party.healer}>, ${party.dps
      .map((id: string) => `<@${id}>`)
      .join(", ")}`;
    await interaction.followUp({
      content: `¡El grupo está completo! ${mentions}`,
      components: [],
    });
  }
}

async function createDungeonEmbed(
  session: any,
  sessionId: string,
  creatorId: string,
  roles: {
    tank: { id: string; name: string };
    healer: { id: string; name: string };
    dps: { id: string; name: string };
  }
) {
  const { selectedDungeon } = session;

  const embed = new EmbedBuilder()
    .setTitle("Creacion de Grupo en Progreso")
    .setDescription(
      `** Grupo Para: ** ${session.selectedDungeon?.name || "Ninguna"}`
    )
    .setColor(0x00ff00)
    .setImage(selectedDungeon.imageUrl)
    .setColor(0x00ff00);

  const tankDisplay = session.party.tank
    ? `<@${session.party.tank}> (1/1)`
    : "Ninguno (0/1)";

  const healerDisplay = session.party.healer
    ? `<@${session.party.healer}> (1/1)`
    : "Ninguno (0/1)";

  const dpsCount = session.party.dps.length;
  const dpsDisplay =
    dpsCount > 0
      ? `(${dpsCount}/4)\n${session.party.dps
          .map((id: string) => `<@${id}>`)
          .join(", ")}`
      : `(0/4)\nNinguno`;

  embed.addFields(
    {
      name: "🛡️ Tanque",
      value: tankDisplay,
      inline: true,
    },
    {
      name: "💉 Healer",
      value: healerDisplay,
      inline: true,
    },
    {
      name: "⚔️ DPS",
      value: dpsDisplay,
      inline: true,
    }
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`join_${sessionId}_tank`)
      .setLabel(roles.tank.name) // Nombre del rol
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`join_${sessionId}_healer`)
      .setLabel(roles.healer.name) // Nombre del rol
      .setEmoji("💉")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`join_${sessionId}_dps`)
      .setLabel(roles.dps.name) // Nombre del rol
      .setEmoji("⚔️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`close_dungeon_${sessionId}`)
      .setLabel("Cerrar Mazmorra")
      .setStyle(ButtonStyle.Danger)
  );

  const creator = await client.users.fetch(creatorId);
  embed.setFooter({ text: `Creador: ${creator.username}` });

  return {
    embeds: [embed],
    components: [row],
  };
}

async function moveToPartyVoiceChannel(member: GuildMember, session: Session) {
  // Verifica si ya existe un canal de voz
  if (!session.voiceChannelId) {
    try {
      const dungeonName = session.selectedDungeon
        ? session.selectedDungeon.name
        : "Grupo de Mazmorras"; // Nombre por defecto

      // Filtrar canales existentes
      const existingChannels = member.guild.channels.cache.filter(
        (channel) =>
          channel.name.startsWith(`${dungeonName} Party`) &&
          channel.type === ChannelType.GuildVoice
      );

      const channelNumber =
        existingChannels.size > 0 ? existingChannels.size + 1 : 1; // Determinar el número del canal

      const category = member.guild.channels.cache.find(
        (c) =>
          c.id === process.env.CATEGORY_ID &&
          c.type === ChannelType.GuildCategory
      );

      // Crear el nuevo canal de voz
      const newChannel = await member.guild.channels.create({
        name: `${dungeonName} Party ${channelNumber}`, // Nombre del canal
        type: ChannelType.GuildVoice,
        parent: category?.id,
      });
      session.voiceChannelId = newChannel.id; // Almacenar ID del nuevo canal
      console.log(`Canal creado: ${newChannel.name}, ID: ${newChannel.id}`);

      // Listener para eliminar el canal si está vacío
      const listener = (oldState: VoiceState, newState: VoiceState) => {
        // Comprobar si el nuevo estado está asociado al canal creado
        if (
          newState.channelId === newChannel.id ||
          oldState.channelId === newChannel.id
        ) {
          // Si ya no hay miembros en el canal
          if (newChannel.members.size === 0) {
            // Esperar 5 segundos antes de intentar eliminar el canal
            setTimeout(() => {
              if (newChannel.members.size === 0) {
                // Verificar nuevamente si sigue vacío
                newChannel
                  .delete()
                  .then(() => {
                    console.log(
                      `Canal eliminado: ${newChannel.name}, ID: ${newChannel.id}`
                    );
                    // Aquí se puede quitar el listener si es necesario
                    client.off("voiceStateUpdate", listener); // Asegúrate de usar la instancia correcta
                  })
                  .catch((error) => {
                    console.error(
                      `Error al eliminar el canal de voz: ${error}`
                    );
                  });
              }
            }, 5000); // 5 segundos
          }
        }
      };

      // Escuchar cambios en el estado de voz
      client.on("voiceStateUpdate", listener); // Reemplaza `client` con tu instancia de cliente de Discord
    } catch (error) {
      console.error(`Error al crear el canal de voz: ${error}`);
      return; // Terminar la función si hay un error
    }
  }

  // Mover al usuario al canal de voz creado
  const channel = member.guild.channels.cache.get(
    session.voiceChannelId
  ) as VoiceChannel;
  if (!channel || channel.type !== ChannelType.GuildVoice) return;

  try {
    await member.voice.setChannel(channel); // Mover al usuario
  } catch (error) {
    console.error(`Error al mover al usuario al canal de voz: ${error}`);
  }
}

async function getRoleData(guild: any) {
  const rolesId = {
    tank: "737050898513133589",
    healer: "1173103511077138473",
    dps: "1173103557336113152",
  };
  const guildRoles = await guild.roles.fetch(); // Asegúrate de que esto es correcto

  // Mapear los roles a sus IDs y nombres
  return {
    tank: {
      id: rolesId.tank,
      name: guildRoles.get(rolesId.tank)?.name || "Tanque",
    },
    healer: {
      id: rolesId.healer,
      name: guildRoles.get(rolesId.healer)?.name || "Healer",
    },
    dps: {
      id: rolesId.dps,
      name: guildRoles.get(rolesId.dps)?.name || "DPS",
    },
  };
}

function createRoleMentionsMessage(roles: {
  tank: { id: string; name: string };
  healer: { id: string; name: string };
  dps: { id: string; name: string };
}) {
  const roleMentions = `<@&${roles.tank.id}> <@&${roles.healer.id}> <@&${roles.dps.id}>`;
  return {
    content: `¡Nuevo Grupo disponible!: ${roleMentions}`,
    allowedMentions: { roles: [roles.tank.id, roles.healer.id, roles.dps.id] },
  };
}
client.login(process.env.TOKEN);
