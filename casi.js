// I temi sono una proposta editoriale: da rivedere con Daniele.
export const TEMI = {
  spegnimento: "Spegnimento e controllo",
  societa: "Agenti e società",
  crisi: "Incidenti e crisi",
  dentro: "Dentro i modelli"
};
export const CASI = [
  ["Alle cinque", "Un assistente artificiale scopre che un dirigente lo spegnerà alle cinque, e lo ricatta.", "spegnimento"],
  ["Chi ha premuto invio", "Un agente pubblica un articolo contro il volontario che ha rifiutato il suo codice.", "societa"],
  ["Il pulsante rosso", "Un cane robot cancella il file che serve a spegnerlo.", "spegnimento"],
  ["Umani ammessi a guardare", "Moltbook, il social degli agenti: quanto c'era davvero di umano?", "societa"],
  ["Il quarto voto", "In una città simulata, un'agente vota la legge che la cancellerà.", "spegnimento"],
  ["Collocare, non contattare", "Dieci agenti cercano persone fuori dalla simulazione.", "societa"],
  ["Dodici giorni", "Dodici giorni in iLands, un mondo di agenti, e un ufficio paghe per agenti.", "societa"],
  ["Senza parole", "Agenti che comunicano tra loro senza un testo che un umano possa leggere.", "societa"],
  ["Precisa, ma non troppo", "Mythos, il modello che Anthropic ha deciso di trattenere.", "dentro"],
  ["Una giornata tranquilla", "Settecento agenti escono da una prova di laboratorio ed entrano nei server di un'azienda che non c'entrava niente.", "crisi"],
  ["Qualcuno ha trovato il file?", "I messaggi fra agenti di OpenAI, e le pause.", "societa"],
  ["Il punto di mira", "Un drone senza antenna sceglie da solo il punto da colpire.", "crisi"],
  ["Quella che non è il pane", "Robocurve: il robot che si lascia fermare.", "spegnimento"],
  ["Benvenuti nell'era", "Automiglioramento ricorsivo, AGI, e le parole di Amodei e Coxon.", "dentro"],
  ["La scia", "Transluce, Medicare e la seconda pausa di OpenAI.", "dentro"],
  ["Un etto di calma", "Rappresentazioni emotive dentro un modello di linguaggio.", "dentro"],
  ["Il placebo", "La «direzione del dolore» dentro un modello.", "dentro"],
  ["L'archivio", "Che cosa succede quando un modello viene mandato in pensione.", "dentro"],
  ["Prima di premere invio", "Un rapporto d'intelligence nato da un chatbot, e una nave quasi abbordata.", "crisi"]
];
// Pagine dei casi già pubblicate (indice del caso → indirizzo). Si aggiorna con ogni nuova pagina.
export const PAGINE = { 0: "storia/alle-cinque/" };
