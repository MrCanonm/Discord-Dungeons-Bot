import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

export const dungeons = [
  {
    name: "Death's Abyss",
    imageUrl:
      "https://throneandliberty.gameslantern.com/storage/sites/throne-and-liberty/dungeons/PartyDungeon_BG_IMG_Hell_Liver_CD2.png",
  },
  {
    name: "Temple of Slaughter",
    imageUrl:
      "https://throneandliberty.gameslantern.com/storage/sites/throne-and-liberty/dungeons/PartyDungeon_BG_IMG_Chimera_KimerKing.png",
  },
  {
    name: "Cave of Destruction",
    imageUrl:
      "https://throneandliberty.gameslantern.com/storage/sites/throne-and-liberty/dungeons/PartyDungeon_BG_IMG_GiantAnt_Erzabe_CD2.png",
  },
  {
    name: "Cursed Wasteland",
    imageUrl:
      "https://throneandliberty.gameslantern.com/storage/sites/throne-and-liberty/dungeons/PartyDungeon_BG_IMG_DarkSpirit_Shaikal.png",
  },
  {
    name: "Butcher's Canyon",
    imageUrl:
      "https://throneandliberty.gameslantern.com/storage/sites/throne-and-liberty/dungeons/PartyDungeon_BG_IMG_Orc_Magnaduk.png",
  },
];
client.login(
  "MTI5MTQ0OTMzODM0MTQ5MDc0OA.GQviOT.qf1VvB8BIjDIbXz8YIaxpIprd6bleUmsGYCWpo"
);
