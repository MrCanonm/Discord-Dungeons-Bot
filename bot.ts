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
} from "discord.js";
import { roles } from "./resource/roles";
import { dungeons } from "./resource/mazmorras";
import dotenv from "dotenv";
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
    name: "iniciarboss",
    description: "Inicia un boss en la mazmorras y selecciona una mazmorras.",
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
        "737036454869467136"
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

  if (commandName === "iniciarboss") {
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

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
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
      .setDescription("Elige la mazmorra para iniciar la creación del grupo.")
      .setColor(0x00ff00);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    // Maneja la selección de mazmorras
    handleDungeonSelection(interaction, sessionId);
  }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  // Verificar si el miembro salió del canal
  if (oldState.channelId && !newState.channelId) {
    const channel = oldState.channel;

    // Verificar si el canal es de voz
    if (channel && channel.type === ChannelType.GuildVoice) {
      // Asegurarte de que el canal es un VoiceChannel
      const voiceChannel = channel as VoiceChannel;

      // Verificar si el canal está vacío
      if (voiceChannel.members.size === 0) {
        // Esperar 5 segundos antes de verificar nuevamente
        setTimeout(async () => {
          // Volver a verificar si sigue vacío
          if (voiceChannel.members.size === 0) {
            try {
              await voiceChannel.delete(); // Eliminar el canal vacío
              console.log(
                `Canal ${voiceChannel.name} eliminado porque está vacío.`
              );
            } catch (error) {
              console.error(`Error al eliminar el canal: ${error}`);
            }
          }
        }, 5000); // 5000 ms = 5 segundos
      }
    }
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

  if (interaction.channel instanceof TextChannel) {
    const collector = interaction.channel.createMessageComponentCollector({
      time: 3600000, // 1 hora de tiempo límite
    });

    collector.on("collect", async (interaction: any) => {
      if (interaction.customId.startsWith(`select_dungeon_${sessionId}`)) {
        session.selectedDungeon =
          dungeons.find((d) => d.name === interaction.values[0]) || null;

        if (session.selectedDungeon) {
          await interaction.update(
            createDungeonEmbed(session, sessionId, creatorId)
          );
        }
      } else if (interaction.customId.startsWith(`join_${sessionId}`)) {
        const [action, role] = interaction.customId.split("_").slice(1);
        handleRoleSelection(interaction, session, role);
        await interaction.update(
          createDungeonEmbed(session, sessionId, creatorId),
          createDungeonEmbed(session, sessionId, creatorId)
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

async function moveToPartyVoiceChannel(member: GuildMember, session: Session) {
  if (!session.voiceChannelId) {
    // Si no hay un canal de voz asignado, crear uno nuevo
    try {
      const dungeonName = session.selectedDungeon
        ? session.selectedDungeon.name
        : "Grupo de Mazmorras"; // Nombre por defecto si no hay mazmorras seleccionadas

      // Contar cuántos canales existen con el mismo nombre
      const existingChannels = member.guild.channels.cache.filter(
        (channel) =>
          channel.name.startsWith(`${dungeonName} Party`) && channel.type === 2
      );

      // Determinar el número a añadir al nombre
      const channelNumber =
        existingChannels.size > 0
          ? existingChannels.size + 1 // Si hay canales existentes, usar el número siguiente
          : 1; // Si no, usar 1

      const category = member.guild.channels.cache.find(
        (c) =>
          c.id === "737036455360069745" && c.type === ChannelType.GuildCategory
      );

      const newChannel = await member.guild.channels.create({
        name: `${dungeonName} Party ${channelNumber}`, // Añadir el número al nombre
        type: 2, // 2 es el tipo para canales de voz
        parent: category?.id,
      });
      session.voiceChannelId = newChannel.id;
    } catch (error) {
      console.error(`Error al crear el canal de voz: ${error}`);
      return;
    }
  }

  const channel = member.guild.channels.cache.get(
    session.voiceChannelId
  ) as VoiceChannel;
  if (!channel || channel.type !== 2) return;

  try {
    await member.voice.setChannel(channel);
  } catch (error) {
    console.error(`Error al mover al usuario al canal de voz: ${error}`);
  }
}

function createDungeonEmbed(
  session: any,
  sessionId: string,
  creatorId: string
) {
  const { party, selectedDungeon } = session;
  const embed = new EmbedBuilder()
    .setTitle(
      `Grupo para ${selectedDungeon ? selectedDungeon.name : "Desconocida"}`
    )
    .setDescription(
      `**🛡️ Tanque:** ${party.tank ? `<@${party.tank}> (1/1)` : "0/1"}\n` +
        `**💉 Healer:** ${
          party.healer ? `<@${party.healer}> (1/1)` : "0/1"
        }\n` +
        `**⚔️ DPS:** ${party.dps.length}/4 ` +
        (party.dps.length > 0
          ? `(${party.dps.map((id: string) => `<@${id}>`).join(", ")})`
          : "") +
        `\n\nReacciona para unirte al rol correspondiente.`
    )
    .setImage(selectedDungeon.imageUrl)
    .setColor(0x00ff00);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`join_${sessionId}_tank`)
      .setLabel(roles.tank)
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`join_${sessionId}_healer`)
      .setLabel(roles.healer)
      .setEmoji("💉")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`join_${sessionId}_dps`)
      .setLabel(roles.dps)
      .setEmoji("⚔️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`close_dungeon_${sessionId}`)
      .setLabel("Cerrar Mazmorra")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row] };
}

client.login(process.env.TOKEN);
