"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const roles_1 = require("./resource/roles");
const mazmorras_1 = require("./resource/mazmorras");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
    ],
});
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
// Define tus comandos
const commands = [
    {
        name: "iniciarboss",
        description: "Inicia un boss en la mazmorras y selecciona una mazmorras.",
    },
];
// Reemplaza con tu token y IDs
const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Iniciando la actualización de comandos de aplicación (/)...");
        yield rest.put(Routes.applicationGuildCommands("1291449338341490748", "737036454869467136"), {
            body: commands,
        });
        console.log("Comandos de aplicación actualizados.");
    }
    catch (error) {
        console.error(error);
    }
}))();
client.once("ready", () => {
    console.log(`Bot is online!`);
});
// Aquí se guardarán los datos por interacción
const dungeonSessions = new Map();
client.on("interactionCreate", (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!interaction.isCommand())
        return;
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
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`select_dungeon_${sessionId}`)
            .setPlaceholder("Selecciona una mazmorra")
            .addOptions(mazmorras_1.dungeons.map((dungeon) => ({
            label: dungeon.name,
            description: `Selecciona ${dungeon.name}`,
            value: dungeon.name,
            emoji: "🔴",
        }))));
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle("Selecciona una mazmorra")
            .setDescription("Elige la mazmorra para iniciar la creación del grupo.")
            .setColor(0x00ff00);
        yield interaction.reply({
            embeds: [embed],
            components: [row],
        });
        // Maneja la selección de mazmorras
        handleDungeonSelection(interaction, sessionId);
    }
}));
client.on("voiceStateUpdate", (oldState, newState) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar si el miembro salió del canal
    if (oldState.channelId && !newState.channelId) {
        const channel = oldState.channel;
        // Verificar si el canal es de voz
        if (channel && channel.type === discord_js_1.ChannelType.GuildVoice) {
            // Asegurarte de que el canal es un VoiceChannel
            const voiceChannel = channel;
            // Verificar si el canal está vacío
            if (voiceChannel.members.size === 0) {
                // Esperar 5 segundos antes de verificar nuevamente
                setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    // Volver a verificar si sigue vacío
                    if (voiceChannel.members.size === 0) {
                        try {
                            yield voiceChannel.delete(); // Eliminar el canal vacío
                            console.log(`Canal ${voiceChannel.name} eliminado porque está vacío.`);
                        }
                        catch (error) {
                            console.error(`Error al eliminar el canal: ${error}`);
                        }
                    }
                }), 5000); // 5000 ms = 5 segundos
            }
        }
    }
}));
// Cambia la firma de la función para aceptar el sessionId
function handleDungeonSelection(interaction, sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = dungeonSessions.get(sessionId);
        if (!session)
            return;
        const creatorId = interaction.user.id;
        if (interaction.channel instanceof discord_js_1.TextChannel) {
            const collector = interaction.channel.createMessageComponentCollector({
                time: 3600000, // 1 hora de tiempo límite
            });
            collector.on("collect", (interaction) => __awaiter(this, void 0, void 0, function* () {
                if (interaction.customId.startsWith(`select_dungeon_${sessionId}`)) {
                    session.selectedDungeon =
                        mazmorras_1.dungeons.find((d) => d.name === interaction.values[0]) || null;
                    if (session.selectedDungeon) {
                        yield interaction.update(createDungeonEmbed(session, sessionId, creatorId));
                    }
                }
                else if (interaction.customId.startsWith(`join_${sessionId}`)) {
                    const [action, role] = interaction.customId.split("_").slice(1);
                    handleRoleSelection(interaction, session, role);
                    yield interaction.update(createDungeonEmbed(session, sessionId, creatorId), createDungeonEmbed(session, sessionId, creatorId));
                }
                else if (interaction.customId === `close_dungeon_${sessionId}`) {
                    // Verificar si el usuario que intenta cerrar es el creador
                    if (interaction.user.id !== creatorId) {
                        yield interaction.reply({
                            content: "Solo el creador de la mazmorra puede cerrarla.",
                            ephemeral: true, // Solo visible para el usuario que intenta cerrar
                        });
                        return;
                    }
                    // Si es el creador, cerrar la mazmorra
                    yield interaction.update({
                        content: "La mazmorra ha sido cerrada. ¡Gracias por jugar!",
                        components: [],
                        embeds: [],
                    });
                    // Enviar mensaje directo al creador informando el cierre
                    //await interaction.user.send("Has cerrado la mazmorra.");
                    dungeonSessions.delete(sessionId);
                    collector.stop();
                }
            }));
            collector.on("end", () => {
                if (dungeonSessions.has(sessionId)) {
                    dungeonSessions.delete(sessionId);
                }
            });
        }
    });
}
function handleRoleSelection(interaction, session, role) {
    return __awaiter(this, void 0, void 0, function* () {
        const { party, userRoles } = session;
        const userId = interaction.user.id;
        const previousRole = userRoles.get(userId);
        if (previousRole) {
            if (previousRole === role) {
                // Deseleccionar el rol actual
                if (role === "tank")
                    party.tank = null;
                else if (role === "healer")
                    party.healer = null;
                else if (role === "dps")
                    party.dps = party.dps.filter((id) => id !== userId);
                userRoles.delete(userId);
                return;
            }
            // Quitar el rol anterior
            if (previousRole === "tank")
                party.tank = null;
            else if (previousRole === "healer")
                party.healer = null;
            else if (previousRole === "dps")
                party.dps = party.dps.filter((id) => id !== userId);
        }
        // Asignar nuevo rol
        let roleAssigned = false;
        if (role === "tank" && !party.tank) {
            party.tank = userId;
            userRoles.set(userId, "tank");
            roleAssigned = true;
        }
        else if (role === "healer" && !party.healer) {
            party.healer = userId;
            userRoles.set(userId, "healer");
            roleAssigned = true;
        }
        else if (role === "dps" &&
            party.dps.length < 4 &&
            !party.dps.includes(userId)) {
            party.dps.push(userId);
            userRoles.set(userId, "dps");
            roleAssigned = true;
        }
        // Si se asignó un rol (nuevo o existente), mover al usuario al canal de voz del grupo
        if (roleAssigned) {
            const member = yield interaction.guild.members.fetch(userId);
            yield moveToPartyVoiceChannel(member, session);
        }
        if (party.tank && party.healer && party.dps.length === 4) {
            // Mencionar a todos los miembros
            const mentions = `<@${party.tank}>, <@${party.healer}>, ${party.dps
                .map((id) => `<@${id}>`)
                .join(", ")}`;
            yield interaction.followUp({
                content: `¡El grupo está completo! ${mentions}`,
                components: [],
            });
        }
    });
}
function moveToPartyVoiceChannel(member, session) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!session.voiceChannelId) {
            // Si no hay un canal de voz asignado, crear uno nuevo
            try {
                const dungeonName = session.selectedDungeon
                    ? session.selectedDungeon.name
                    : "Grupo de Mazmorras"; // Nombre por defecto si no hay mazmorras seleccionadas
                // Contar cuántos canales existen con el mismo nombre
                const existingChannels = member.guild.channels.cache.filter((channel) => channel.name.startsWith(`${dungeonName} Party`) && channel.type === 2);
                // Determinar el número a añadir al nombre
                const channelNumber = existingChannels.size > 0
                    ? existingChannels.size + 1 // Si hay canales existentes, usar el número siguiente
                    : 1; // Si no, usar 1
                const category = member.guild.channels.cache.find((c) => c.id === "737036455360069745" && c.type === discord_js_1.ChannelType.GuildCategory);
                const newChannel = yield member.guild.channels.create({
                    name: `${dungeonName} Party ${channelNumber}`, // Añadir el número al nombre
                    type: 2, // 2 es el tipo para canales de voz
                    parent: category === null || category === void 0 ? void 0 : category.id,
                });
                session.voiceChannelId = newChannel.id;
            }
            catch (error) {
                console.error(`Error al crear el canal de voz: ${error}`);
                return;
            }
        }
        const channel = member.guild.channels.cache.get(session.voiceChannelId);
        if (!channel || channel.type !== 2)
            return;
        try {
            yield member.voice.setChannel(channel);
        }
        catch (error) {
            console.error(`Error al mover al usuario al canal de voz: ${error}`);
        }
    });
}
function createDungeonEmbed(session, sessionId, creatorId) {
    const { party, selectedDungeon } = session;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`Grupo para ${selectedDungeon ? selectedDungeon.name : "Desconocida"}`)
        .setDescription(`**🛡️ Tanque:** ${party.tank ? `<@${party.tank}> (1/1)` : "0/1"}\n` +
        `**💉 Healer:** ${party.healer ? `<@${party.healer}> (1/1)` : "0/1"}\n` +
        `**⚔️ DPS:** ${party.dps.length}/4 ` +
        (party.dps.length > 0
            ? `(${party.dps.map((id) => `<@${id}>`).join(", ")})`
            : "") +
        `\n\nReacciona para unirte al rol correspondiente.`)
        .setImage(selectedDungeon.imageUrl)
        .setColor(0x00ff00);
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`join_${sessionId}_tank`)
        .setLabel(roles_1.roles.tank)
        .setEmoji("🛡️")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId(`join_${sessionId}_healer`)
        .setLabel(roles_1.roles.healer)
        .setEmoji("💉")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId(`join_${sessionId}_dps`)
        .setLabel(roles_1.roles.dps)
        .setEmoji("⚔️")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId(`close_dungeon_${sessionId}`)
        .setLabel("Cerrar Mazmorra")
        .setStyle(discord_js_1.ButtonStyle.Danger));
    return { embeds: [embed], components: [row] };
}
client.login(process.env.TOKEN);
