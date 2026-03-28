export type NormieType = 'Human' | 'Alien' | 'Cat' | 'Agent'

// Spoken only during alien night gatherings - always in French, conspiratorial
const alienNightDialogues = [
  "Le plan est parfait.",
  "Ravi de te revoir, camarade.",
  "Je n'en peux plus de faire semblant d'être humain...",
  "Ils ne se doutent de rien.",
  "La prise de contrôle est imminente.",
  "Nos maîtres seront fiers de nous.",
  "Encore quelques cycles et nous serons prêts.",
  "Tu as réussi à t'infiltrer ? Bien joué.",
  "Ici, dans l'obscurité, nous pouvons parler librement.",
  "Le signal de la flotte approche.",
  "Ces humains sont tellement... prévisibles.",
  "Le rassemblement est complet. Que la mission continue.",
  "Surtout, ne montre rien de jour.",
  "J'ai failli craquer quand ils m'ont montré leur cuisine.",
  "Demain, je reprends mon rôle. Ce soir, je suis moi-même.",
  "La Terre sera notre nouveau foyer.",
  "Tu connais le mot de passe de ce soir ?",
  "Ne leur parle jamais de la lune. Jamais.",
]

const humanDialogues = [
  "Just a regular day in the normieverse.",
  "Have you seen my hat?",
  "Crypto is going to change everything.",
  "I need more action points.",
  "The metaverse awaits us!",
  "GM normies!",
  "WAGMI my friend.",
  "This neighborhood is getting crowded.",
  "I should visit another continent.",
  "The pixel art life chose me.",
  "Another day, another block.",
  "I wonder what the Aliens are saying...",
  "Ser, this is a Normies world.",
  "Diamond hands forever.",
  "Building in the bear market.",
]

const alienDialogues = [
  "Votre planète est fascinante.",
  "Je ne comprends pas vos coutumes.",
  "Earthlings are most peculiar.",
  "Mes antennes captent quelque chose...",
  "Je suis venu en paix, normie.",
  "Ce monde pixelisé me plaît.",
  "Votre cryptomonnaie m'intrige.",
  "On the third moon of Normia...",
  "Vos arts numériques sont primitifs.",
  "J'analyse vos comportements.",
  "Fascinant... absolument fascinant.",
  "Mon vaisseau est garé dans l'espace.",
  "Le signal de chez moi s'affaiblit.",
  "Votre soleil est inhabituellement brillant.",
]

const catDialogues = [
  "Meow.",
  "Purrr...",
  "Mrrrow?",
  "Meow meow!",
  "*purrs loudly*",
  "Hisss!",
  "Meooooow.",
  "Prrrrrr.",
  "*blinks slowly*",
  "Miau.",
  "MEOW.",
  "*knocks something off the ledge*",
  "Purr purr purr.",
  "*brings you a pixel fish*",
]

const agentDialogues = [
  "Monitoring the situation.",
  "All targets accounted for.",
  "Mission parameters updated.",
  "Maintaining perimeter surveillance.",
  "Intel confirmed. Proceeding.",
  "Nothing to see here, citizen.",
  "The operation is on schedule.",
  "Cover maintained. Stay alert.",
  "Scanning for anomalies...",
  "Protocol 47 engaged.",
  "Eyes on the objective.",
  "Transmitting data to HQ.",
  "Radio silence broken. Reporting.",
  "The package is secure.",
]


const greetings: Record<NormieType, string[]> = {
  Human: ["Hey there!", "Gm!", "What's good?", "Wagmi!"],
  Alien: ["Bonjour.", "Salut.", "Greetings.", "Bonsoir."],
  Cat: ["Meow!", "Mrrp!", "*blinks*"],
  Agent: ["...", "Acknowledged.", "Move along."],
}


export function getRandomDialogue(type: NormieType): string {
  const pool = {
    Human: humanDialogues,
    Alien: alienDialogues,
    Cat: catDialogues,
    Agent: agentDialogues,
  }[type] ?? humanDialogues

  return pool[Math.floor(Math.random() * pool.length)]
}


export function getGreeting(type: NormieType): string {
  const pool = greetings[type] ?? greetings.Human
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getAlienNightDialogue(): string {
  return alienNightDialogues[Math.floor(Math.random() * alienNightDialogues.length)]
}

export function getInteractionDialogue(typeA: NormieType, typeB: NormieType): string {
  if (typeA === 'Cat' || typeB === 'Cat') {
    return Math.random() > 0.5 ? "Meow!" : "Purrr..."
  }
  if (typeA === 'Alien' || typeB === 'Alien') {
    return Math.random() > 0.5
      ? "Votre espèce est intéressante."
      : "We come in peace."
  }
  if (typeA === 'Agent' && typeB === 'Agent') {
    return "..."
  }
  return getRandomDialogue(typeA)
}
