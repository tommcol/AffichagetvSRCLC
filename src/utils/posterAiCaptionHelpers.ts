import type { PosterContentType, PosterSocialPlatform } from './posterTypes';

export type PosterAiCaptionPlatform = PosterSocialPlatform;

export interface PosterAiCaptionRequestPayload {
  platform: PosterAiCaptionPlatform;
  type: 'matches' | 'results';
  matches: any[];
  results: any[];
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
  platform: PosterAiCaptionPlatform;
  contentType: PosterContentType;
  matches: any[];
  results: any[];
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
  platform: PosterAiCaptionPlatform;
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
