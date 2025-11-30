import { GoogleGenAI, Type } from "@google/genai";
import { Itinerary, UserPreferences, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_ITINERARY = `
Sei un esperto storico dell'arte romana e guida turistica specializzata nel periodo barocco.
Il tuo compito è creare un itinerario di un giorno a Roma logico e geograficamente ottimizzato.

REGOLE CRITICHE:
1. Punto di partenza: Basilica di San Pietro (Vaticano).
2. Punto di arrivo: Galleria Borghese.
3. DEVE includere opere di: Francesco Borromini, Gian Lorenzo Bernini, Caravaggio, Pietro da Cortona, Andrea Pozzo.
4. Le tappe suggerite devono essere geograficamente logiche (minimizzando i tempi di spostamento).
5. Fornisci orari specifici di arrivo e partenza basati sull'orario di inizio dell'utente e sul ritmo.
6. L'OUTPUT DEVE ESSERE IN ITALIANO.

Formato Output:
DEVI restituire un oggetto JSON valido. Non avvolgerlo in blocchi di codice markdown.
Il JSON deve seguire questa struttura:
{
  "title": "Stringa (Titolo in Italiano)",
  "stops": [
    {
      "name": "Stringa (Nome della chiesa/museo)",
      "coordinates": { "lat": Number, "lng": Number },
      "description": "Stringa (Breve descrizione dell'opera in Italiano)",
      "arrivalTime": "HH:MM",
      "departureTime": "HH:MM",
      "artists": ["Stringa"],
      "type": "start" | "stop" | "end"
    }
  ]
}
`;

export const generateItinerary = async (prefs: UserPreferences): Promise<Itinerary> => {
  const artistsStr = prefs.focusArtists.length > 0 ? prefs.focusArtists.join(", ") : "tutti i principali maestri del Barocco";
  
  const prompt = `
    Crea un itinerario di 1 giorno nella Roma Barocca.
    Orario di inizio: ${prefs.startTime}
    Ritmo: ${prefs.pace}
    Partecipanti: ${prefs.participants}
    Esigenze di accessibilità: ${prefs.accessibility ? "Sì, evita le scale dove possibile" : "No"}
    Artisti focus: ${artistsStr}
    
    Includi tappe specifiche per:
    1. San Pietro (Inizio)
    2. Opere di Borromini (es. San Carlo alle Quattro Fontane, Sant'Ivo)
    3. Opere di Bernini (es. Sant'Andrea al Quirinale, Piazza Navona)
    4. Caravaggio (es. San Luigi dei Francesi)
    5. Pietro da Cortona (es. Santi Luca e Martina o Palazzo Barberini)
    6. Andrea Pozzo (Sant'Ignazio)
    7. Galleria Borghese (Fine)

    Usa Google Maps per verificare luoghi e coordinate.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ITINERARY,
        tools: [{ googleMaps: {} }],
        // We want strict JSON but we are using tools, so we parse the text manually
        // to handle potential grounding text mixed with JSON.
      }
    });

    const text = response.text || "";
    
    // Clean up markdown code blocks if present (heuristic)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Impossibile generare un itinerario JSON valido.");
    }

    const jsonString = jsonMatch[0];
    const data = JSON.parse(jsonString);

    return {
      title: data.title || "Capolavori del Barocco Romano",
      date: new Date().toLocaleDateString('it-IT'),
      stops: data.stops.map((s: any, index: number) => ({
        ...s,
        id: `stop-${index}`,
      }))
    };
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw error;
  }
};

export const chatWithAi = async (history: ChatMessage[], newMessage: string, itineraryContext?: Itinerary) => {
  const contextStr = itineraryContext 
    ? `Contesto Itinerario Corrente: ${JSON.stringify(itineraryContext.stops.map(s => s.name))}`
    : "Nessun itinerario generato ancora.";

  const systemInstruction = `
    Sei 'BerniniBot', un esperto d'arte barocca e guida di Roma spiritoso e colto.
    Aiuta l'utente con storia, logistica, consigli sul cibo e informazioni sui biglietti.
    
    Contesto:
    ${contextStr}
    
    Se l'utente chiede biglietti, orari di apertura o eventi attuali, usa Google Search.
    Se l'utente chiede indicazioni o luoghi vicini, usa Google Maps.
    Mantieni le risposte concise e utili.
    RISPONDI SEMPRE IN ITALIANO.
  `;

  try {
    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools: [
          { googleSearch: {} },
          { googleMaps: {} }
        ]
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chatSession.sendMessage({ message: newMessage });
    
    const sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => {
        if (chunk.web?.uri) return { title: chunk.web.title, uri: chunk.web.uri };
        if (chunk.maps?.uri) return { title: chunk.maps.title || "Google Maps", uri: chunk.maps.uri };
        return null;
      })
      .filter((s: any) => s !== null) || [];

    return {
      text: result.text,
      sources
    };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      text: "Scusa! Ho problemi a connettermi alle Muse al momento. Riprova più tardi.",
      sources: []
    };
  }
};