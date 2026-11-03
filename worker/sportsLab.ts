import type { Env } from './types';
import { footballMatches, handballBlocks, sportsSourceUrl, volleyballTable } from '../src/utils/sportsFeeds';
import type { LabSport, SportsFeed } from '../src/utils/sportsFeeds';

const MAX_BYTES=2_000_000;
/** Bounded GETs to fixed federation hosts. No cookies, credentials or redirects. */
async function readPublic(url:URL):Promise<string> {
  const response=await fetch(url.toString(),{method:'GET',redirect:'manual',signal:AbortSignal.timeout(18000),headers:{Accept:'application/json, text/html','User-Agent':'Affichage-TV-Club-Laboratoire/1.0'}});
  if(response.status>=300&&response.status<400){await response.body?.cancel();throw new Error('La fédération redirige cette adresse. Copiez le lien final affiché sur son site.');}
  if(!response.ok){await response.body?.cancel();throw new Error(response.status===403?'La fédération refuse cet accès (HTTP 403). Aucun match fictif ne sera ajouté.':`Le service fédéral répond HTTP ${response.status}.`);}
  const reader=response.body?.getReader();if(!reader)throw new Error('Réponse fédérale vide.');
  const chunks:Uint8Array[]=[];let size=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw new Error('Réponse fédérale trop volumineuse pour cet essai.');chunks.push(value);}}
  catch(e){await reader.cancel();throw e;}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  const charset=response.headers.get('content-type')?.match(/charset=([^;\s]+)/i)?.[1]||'utf-8';
  return new TextDecoder(/^(iso-8859-1|windows-1252)$/i.test(charset)?'windows-1252':'utf-8').decode(bytes);
}

export async function sportsLab(request:Request,env:Env):Promise<Response> {
  // This route cannot be activated on a normal installation.
  if(env.APP_DEMO!=='1')return Response.json({error:'Disponible uniquement dans le laboratoire.'},{status:404});
  if(request.method!=='GET')return Response.json({error:'Lecture uniquement.'},{status:405,headers:{Allow:'GET'}});
  const params=new URL(request.url).searchParams,sport=params.get('sport') as LabSport,value=params.get('source')||'';
  if(!['football','handball','volleyball'].includes(sport))return Response.json({error:'Choisissez football, handball ou volley.'},{status:400});
  let source:URL;try{source=sportsSourceUrl(sport,value);}catch(e){return Response.json({error:(e as Error).message},{status:400});}
  const cacheKey=new Request(new URL(`/api/lab/sports?${new URLSearchParams({sport,source:source.toString()})}`,request.url));
  const cache=typeof caches!=='undefined'?(caches as CacheStorage & {default?:Cache}).default:undefined;
  const cached=await cache?.match(cacheKey);if(cached){const response=new Response(cached.body,cached);response.headers.set('X-Lab-Cache','hit');return response;}
  try {
    const raw=await readPublic(source),warnings:string[]=[];
    let parsed:{teams:SportsFeed['teams'];matches:SportsFeed['matches']};
    if(sport==='handball')parsed=handballBlocks(raw);
    else if(sport==='volleyball')parsed=volleyballTable(raw);
    else {
      const body=JSON.parse(raw), rows=Array.isArray(body)?body:body['hydra:member'];
      if(!Array.isArray(rows))throw new Error('Format FFF non reconnu. Aucun import effectué.');
      const result=footballMatches(rows,value);parsed=result;
      if(result.skipped)warnings.push(`${result.skipped} rencontre(s) écartée(s) : appartenance au club ou données non confirmées.`);
      if(body['hydra:view']?.['hydra:next'])warnings.push('Réponse FFF partielle : une autre page existe. Ce connecteur ne garantit pas le calendrier complet.');
      warnings.push('FFF : calendrier renvoyé par cet endpoint uniquement. Les résultats ne sont confirmés que lorsque le statut fédéral indique un match terminé.');
    }
    const feed:SportsFeed={sport,source:sport==='football'?'FFF · API DOFA':sport==='handball'?'FFHandball · données publiques du site':'FFVolley · calendrier public',sourceUrl:source.toString(),fetchedAt:new Date().toISOString(),teams:parsed.teams,matches:parsed.matches,warnings};
    const response=Response.json(feed,{headers:{'Cache-Control':'public, max-age=300','X-Lab-Cache':'miss'}});
    if(cache)await cache.put(cacheKey,response.clone());
    return response;
  }catch(e){return Response.json({error:e instanceof Error?e.message:'Le service fédéral est indisponible.'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
