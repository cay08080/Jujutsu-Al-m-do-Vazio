
import { GoogleGenAI, Type } from "@google/genai";
import { Character, GameMessage, WorldState, Item, ANIME_TIMELINE } from "../types";

const sanitizeForPrompt = (obj: any) => {
  if (!obj) return obj;
  const clone = JSON.parse(JSON.stringify(obj));
  const removeLargeFields = (target: any) => {
    if (typeof target !== 'object' || target === null) return;
    if (Array.isArray(target)) {
      target.forEach(removeLargeFields);
    } else {
      for (const key in target) {
        if (['imageUrl', 'profileImageUrl', 'iconUrl'].includes(key)) {
          target[key] = "[OMITTED]";
        } else if (typeof target[key] === 'object') {
          removeLargeFields(target[key]);
        }
      }
    }
  };
  removeLargeFields(clone);
  return clone;
};

export const generateSceneImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `JJK Anime style, cinematic, high quality: ${prompt}` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : undefined;
};

export const generateCharacterProfile = async (appearance: string, name: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Official JJK character art: ${appearance}` }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : undefined;
};

export const arbitratePvP = async (
  p1: Character,
  p2: Character,
  p1Action: string,
  p2Action: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  const systemInstruction = `
    VOCÊ É O MESTRE SUPREMO DE COMBATE DE JUJUTSU KAISEN. 
    REGRAS DE ARBITRAGEM PvP:
    - Analise se as ações são possíveis baseadas na técnica e nível dos feiticeiros/maldições.
    - Considere o custo de Energia Amaldiçoada (Qi). Se o Qi for insuficiente, a ação falha ou é muito fraca.
    - O combate entre Feiticeiros e Maldições deve ser letal e visceral.
    - Calcule o dano baseado na Força e Energia.
    - Determine se houve Black Flash (Kokusen) em acertos críticos físicos.
    - O tom deve ser épico e narrativo, como o mangá.

    RETORNO JSON OBRIGATÓRIO:
    {
      "narrative": "A descrição detalhada e épica do choque de poderes...",
      "p1Damage": number,
      "p1QiCost": number,
      "p2Damage": number,
      "p2QiCost": number,
      "kokusen": boolean,
      "winner": "P1" | "P2" | null
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: `P1 (${p1.name}, ${p1.origin}, LVL ${p1.level}, Técnica: ${p1.technique}, Qi: ${p1.currentQi}): ${p1Action}` },
        { text: `P2 (${p2.name}, ${p2.origin}, LVL ${p2.level}, Técnica: ${p2.technique}, Qi: ${p2.currentQi}): ${p2Action}` }
      ]
    },
    config: { systemInstruction, responseMimeType: "application/json" }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { narrative: "O combate foi interrompido por um choque de energias.", p1Damage: 10, p2Damage: 10, p1QiCost: 5, p2QiCost: 5, kokusen: false, winner: null };
  }
};

export const generateNarrative = async (
  character: Character,
  history: GameMessage[],
  userInput: string,
  worldState: WorldState
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  const systemInstruction = `
    VOCÊ É O NARRADOR SUPREMO DE JUJUTSU KAISEN.
    
    DIRETRIZES DE ORIGEM (CRITICAL):
    - Se o jogador for MALDIÇÃO: Ele é uma maldição recém-nascida do medo humano. Ele JAMAIS entra na escola de Jujutsu como aluno. Ele deve iniciar em locais hostis (esgotos, zonas de guerra, florestas). Suas interações com humanos e feiticeiros são naturalmente violentas ou predatórias. Afinidade com feiticeiros é quase impossível.
    - Se o jogador for HUMANO: Ele é um aluno novo na Escola de Jujutsu (fluxo padrão).
    
    TONALIDADE: Humor ácido, ironia, drama shonen e horror corporal.
    
    REGRAS:
    - KOKUSEN apenas em combate real crítico.
    - Avalie cada ação do jogador com base em sua técnica e nível.

    JSON OBRIGATÓRIO:
    {
      "narrative": "...",
      "imagePrompt": "...",
      "actionEvaluation": { "status": "ACERTO"|"ERRO"|"CRÍTICO", "damageDealt": n, "qiCost": n },
      "kokusen": boolean,
      "npcUpdate": { "name": "...", "affinityDelta": n, "newStatus": "...", "location": "...", "isAlive": boolean },
      "interventionOccurred": "Nome do NPC",
      "butterflyConsequence": "Consequência",
      "arcProgressGain": n,
      "xpGain": n,
      "hpChange": n,
      "isFatalBlow": boolean,
      "suggestions": ["...", "...", "..."]
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: { 
      parts: [
        { text: `ORIGEM DO JOGADOR: ${character.origin}` },
        { text: `PERFIL: ${JSON.stringify(sanitizeForPrompt(character))}` },
        { text: `LOCAL: ${worldState.currentLocation}` },
        { text: `HISTÓRICO: ${JSON.stringify(sanitizeForPrompt(history.slice(-4)))}` },
        { text: `AÇÃO: ${userInput}` }
      ] 
    },
    config: { systemInstruction, responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
  });

  try {
    const text = response.text || "{}";
    const data = JSON.parse(text);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({ title: c.web?.title, uri: c.web?.uri })).filter((s: any) => s.uri) || [];
    return { ...data, sources };
  } catch (e) {
    return { narrative: "O destino se fragmentou.", sources: [] };
  }
};
