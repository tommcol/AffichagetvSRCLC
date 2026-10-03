import type { MatchItem } from '../types';
import type { PosterContentType, PosterSocialPlatform } from './posterTypes';

export interface PosterAiCaptionRequestPayload {
  platform: PosterSocialPlatform;
  type: 'matches' | 'results';
  matches: MatchItem[];
  results: MatchItem[];
  clubName: string;
  shortClub: string;
  gymnasium: string;
  tone: string;
  extraContext: string;
}

export const buildPosterAiCaptionRequestPayload = ({
  platform,
  contentType,
  matches,
  results,
  clubName,
  shortClub,
  gymnasium,
  tone,
  extraContext,
}: {
  platform: PosterSocialPlatform;
  contentType: PosterContentType;
  matches: MatchItem[];
  results: MatchItem[];
  clubName: string;
  shortClub: string;
  gymnasium: string;
  tone: string;
  extraContext: string;
}): PosterAiCaptionRequestPayload => ({
  platform,
  type: contentType === 'results' ? 'results' : 'matches',
  matches,
  results,
  clubName,
  shortClub,
  gymnasium,
  tone,
  extraContext,
});


export const buildPosterAiCaptionRewritePayload = ({
  platform,
  contentType,
  currentCaption,
  instructions,
  clubName,
  shortClub,
  gymnasium,
  tone,
}: {
  platform: PosterSocialPlatform;
  contentType: PosterContentType;
  currentCaption: string;
  instructions: string;
  clubName: string;
  shortClub: string;
  gymnasium: string;
  tone: string;
}): PosterAiCaptionRequestPayload =>
  buildPosterAiCaptionRequestPayload({
    platform,
    contentType,
    matches: [],
    results: [],
    clubName,
    shortClub,
    gymnasium,
    tone,
    extraContext: `RÉÉCRITURE DU TEXTE ACTUEL - Consignes d'amélioration : "${instructions.trim()}".
Voici le texte brut que tu dois améliorer et réécrire :
"${currentCaption}"
Ne renvoie QUE le texte réécrit, nettoyé et amélioré, sans guillemets ni phrases d'introduction.`,
});


export interface PosterAiCaptionResponse {
  success?: boolean;
  caption?: string;
  error?: string;
}

export const requestPosterAiCaption = async (
  payload: PosterAiCaptionRequestPayload
): Promise<PosterAiCaptionResponse> => {
  const response = await fetch('/api/generate-caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.json();
};
