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
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
function updateEmbed(interaction, party, message) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const tankCount = party.tank ? 1 : 0;
        const healerCount = party.healer ? 1 : 0;
        const dpsCount = party.dps.length;
        // Actualizar el embed con los nuevos valores
        const updatedEmbed = new discord_js_1.EmbedBuilder()
            .setTitle(((_a = message.embeds[0]) === null || _a === void 0 ? void 0 : _a.title) || "Grupo para Mazmorra")
            .setDescription(`🛡️ Tanque: ${tankCount}/1\n💉 Healer: ${healerCount}/1\n⚔️ DPS: ${dpsCount}/3\n\nReacciona para unirte al rol correspondiente.`)
            .setImage(((_c = (_b = message.embeds[0]) === null || _b === void 0 ? void 0 : _b.image) === null || _c === void 0 ? void 0 : _c.url) || "URL de imagen predeterminada")
            .setColor(0x00ff00);
        yield interaction.message.edit({
            embeds: [updatedEmbed],
        });
    });
}
function sendGroupCompleteMessage(message, party) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (message.channel instanceof discord_js_1.TextChannel) {
            yield message.channel.send({
                content: `El grupo para ${(_a = message.embeds[0]) === null || _a === void 0 ? void 0 : _a.title} está completo: 🛡️ ${party.tank}, 💉 ${party.healer}, ⚔️ ${party.dps.join(", ")}`,
                embeds: [
                    new discord_js_1.EmbedBuilder().setImage(((_c = (_b = message.embeds[0]) === null || _b === void 0 ? void 0 : _b.image) === null || _c === void 0 ? void 0 : _c.url) || "URL de imagen predeterminada"),
                ],
            });
        }
        else {
            console.error("El canal no es un canal de texto.");
        }
    });
}
function handleRoleSelection(interaction, party, user) {
    return __awaiter(this, void 0, void 0, function* () {
        // Almacenar el rol actual del usuario
        const previousRole = party.tank === user.username
            ? "tank"
            : party.healer === user.username
                ? "healer"
                : party.dps.includes(user.username)
                    ? "dps"
                    : null;
        // Comprobar si el usuario ya tiene un rol
        if (previousRole) {
            // Si el usuario ya tiene el rol, lo removemos
            switch (previousRole) {
                case "tank":
                    party.tank = null;
                    return `${user.username} se ha quitado el rol de Tanque 🛡️.`;
                case "healer":
                    party.healer = null;
                    return `${user.username} se ha quitado el rol de Healer 💉.`;
                case "dps":
                    party.dps = party.dps.filter((dpsUser) => dpsUser !== user.username);
                    return `${user.username} se ha quitado el rol de DPS ⚔️.`;
            }
        }
        // Si no tenía un rol y selecciona uno nuevo
        switch (interaction.customId) {
            case "join_tank":
                if (party.tank) {
                    return "Ya tenemos un tanque en el grupo."; // Mensaje si ya hay tanque
                }
                party.tank = user.username;
                return `${user.username} se ha unido como Tanque 🛡️.`;
            case "join_healer":
                if (party.healer) {
                    return "Ya tenemos un healer en el grupo."; // Mensaje si ya hay healer
                }
                party.healer = user.username;
                return `${user.username} se ha unido como Healer 💉.`;
            case "join_dps":
                if (party.dps.length >= 3) {
                    return "El grupo de DPS ya está completo."; // Mensaje si hay suficientes DPS
                }
                party.dps.push(user.username);
                return `${user.username} se ha unido como DPS ⚔️.`;
            default:
                return null;
        }
    });
}
function handleReactions(message, party) {
    return __awaiter(this, void 0, void 0, function* () {
        const collector = message.createMessageComponentCollector();
        collector.on("collect", (interaction) => __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isButton())
                return;
            const user = interaction.user;
            const responseMessage = yield handleRoleSelection(interaction, party, user);
            // Solo responde si hay un mensaje de retorno
            if (responseMessage) {
                yield interaction.reply({
                    content: responseMessage,
                    ephemeral: true,
                });
            }
            // Actualiza el embed independientemente de si el usuario cambió su rol o no
            yield updateEmbed(interaction, party, message);
            // Verifica si el grupo está completo
            if (party.tank && party.healer && party.dps.length === 3) {
                yield sendGroupCompleteMessage(message, party);
                collector.stop();
            }
        }));
    });
}
client.login("MTI5MTQ0OTMzODM0MTQ5MDc0OA.GQviOT.qf1VvB8BIjDIbXz8YIaxpIprd6bleUmsGYCWpo");
