import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  TextChannel,
  Message,
  ButtonInteraction,
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function updateEmbed(
  interaction: ButtonInteraction,
  party: any,
  message: Message
) {
  const tankCount = party.tank ? 1 : 0;
  const healerCount = party.healer ? 1 : 0;
  const dpsCount = party.dps.length;

  // Actualizar el embed con los nuevos valores
  const updatedEmbed = new EmbedBuilder()
    .setTitle(message.embeds[0]?.title || "Grupo para Mazmorra")
    .setDescription(
      `🛡️ Tanque: ${tankCount}/1\n💉 Healer: ${healerCount}/1\n⚔️ DPS: ${dpsCount}/3\n\nReacciona para unirte al rol correspondiente.`
    )
    .setImage(message.embeds[0]?.image?.url || "URL de imagen predeterminada")
    .setColor(0x00ff00);

  await interaction.message.edit({
    embeds: [updatedEmbed],
  });
}

async function sendGroupCompleteMessage(message: Message, party: any) {
  if (message.channel instanceof TextChannel) {
    await message.channel.send({
      content: `El grupo para ${message.embeds[0]?.title} está completo: 🛡️ ${
        party.tank
      }, 💉 ${party.healer}, ⚔️ ${party.dps.join(", ")}`,
      embeds: [
        new EmbedBuilder().setImage(
          message.embeds[0]?.image?.url || "URL de imagen predeterminada"
        ),
      ],
    });
  } else {
    console.error("El canal no es un canal de texto.");
  }
}

async function handleRoleSelection(
  interaction: ButtonInteraction,
  party: any,
  user: any
) {
  // Almacenar el rol actual del usuario
  const previousRole =
    party.tank === user.username
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
        party.dps = party.dps.filter(
          (dpsUser: any) => dpsUser !== user.username
        );
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
}

async function handleReactions(message: Message, party: any) {
  const collector = message.createMessageComponentCollector();

  collector.on("collect", async (interaction: ButtonInteraction) => {
    if (!interaction.isButton()) return;

    const user = interaction.user;

    const responseMessage = await handleRoleSelection(interaction, party, user);

    // Solo responde si hay un mensaje de retorno
    if (responseMessage) {
      await interaction.reply({
        content: responseMessage,
        ephemeral: true,
      });
    }

    // Actualiza el embed independientemente de si el usuario cambió su rol o no
    await updateEmbed(interaction, party, message);

    // Verifica si el grupo está completo
    if (party.tank && party.healer && party.dps.length === 3) {
      await sendGroupCompleteMessage(message, party);
      collector.stop();
    }
  });
}
client.login(
  "MTI5MTQ0OTMzODM0MTQ5MDc0OA.GQviOT.qf1VvB8BIjDIbXz8YIaxpIprd6bleUmsGYCWpo"
);
