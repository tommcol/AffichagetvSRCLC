import type { MatchItem } from '../types';

export type LabSport = 'football' | 'handball' | 'volleyball';
export interface SportsTeam { id: string; name: string }
export interface SportsMatch {
  id: string; home: SportsTeam; away: SportsTeam;
  date: string; time: string; homeScore?: number; awayScore?: number;
  played: boolean; label: string; competition: string;
}
export interface SportsFeed {
  sport: LabSport; source: string; sourceUrl: string; fetchedAt: string;
  teams: SportsTeam[]; matches: SportsMatch[]; warnings: string[];
}
type Row = Record<string, any>;
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|eacute|egrave|agrave|ecirc|ocirc|ccedil);/gi, (all, code: string) => {
    if (code.startsWith('#')) { const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2),16) : Number(code.slice(1)); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : all; }
    return ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',eacute:'é',egrave:'è',agrave:'à',ecirc:'ê',ocirc:'ô',ccedil:'ç'} as Record<string,string>)[code.toLowerCase()] || all;
  });
}
const clean = (text: string) => decodeEntities(text.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
const score = (v: unknown): number | undefined => v !== null && v !== undefined && String(v).trim() !== '' && /^\d+$/.test(String(v)) ? Number(v) : undefined;
const dateParts = (v: unknown) => { const s = String(v || ''); return {date: /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0,10) : '', time: /[T ]\d{2}:\d{2}/.test(s) ? s.slice(11,16) : ''}; };

/** Only a fixed public federation endpoint can be reached. Never accept a proxy URL. */
export function sportsSourceUrl(sport: LabSport, value: string): URL {
  if (sport === 'football') {
    if (!/^\d{1,9}$/.test(value)) throw new Error('Indiquez le numéro interne du club FFF (cl_no).');
    return new URL(`https://api-dofa.fff.fr/api/clubs/${value}/calendrier`);
  }
  let u: URL; try { u = new URL(value); } catch { throw new Error('Collez le lien de la page fédérale.'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) throw new Error('Utilisez un lien HTTPS public de la fédération.');
  if (sport === 'handball') {
    if (u.hostname !== 'www.ffhandball.fr' || !/^\/competitions\/saison-\d{4}-\d{4}-\d+\/(?:[a-z0-9-]+\/)+equipe-\d+\/?$/.test(u.pathname)) throw new Error('Ouvrez une équipe sur ffhandball.fr/competitions et copiez son lien (equipe-…).');
    return new URL(u.origin + u.pathname.replace(/\/?$/, '/'));
  }
  if (sport !== 'volleyball' || !['www.ffvbbeach.org','ffvbbeach.org'].includes(u.hostname) || u.pathname !== '/ffvbapp/resu/vbspo_calendrier.php') throw new Error('Collez le lien du calendrier de poule FFVolley (vbspo_calendrier.php).');
  const season=u.searchParams.get('saison') || '', org=u.searchParams.get('codent') || '', pool=u.searchParams.get('poule') || '';
  if (!/^20\d{2}\/20\d{2}$/.test(season) || !/^[A-Z0-9]{2,12}$/i.test(org) || !/^[A-Z0-9_-]{1,20}$/i.test(pool)) throw new Error('Le lien FFVolley doit contenir saison, codent et poule.');
  const target=new URL('https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php');
  for (const [k,v] of Object.entries({saison:season,codent:org,poule:pool,calend:'COMPLET'})) target.searchParams.set(k,v);
  return target;
}

export function handballBlocks(html: string): { teams: SportsTeam[]; matches: SportsMatch[] } {
  const blocks: Record<string, Row> = {};
  for (const tag of html.matchAll(/<smartfire-component\b[^>]*>/gi)) {
    const name=tag[0].match(/\bname=['"]([^'"]+)['"]/i)?.[1];
    if (!name || !['competitions---poule-selector','competitions---rencontre-list'].includes(name)) continue;
    const attrs=tag[0].match(/\battributes="([^"]*)"/i)?.[1];
    if (attrs) blocks[name]=JSON.parse(decodeEntities(attrs));
  }
  const pool=blocks['competitions---poule-selector'], list=blocks['competitions---rencontre-list'];
  if (!pool?.selected_equipe?.id || !Array.isArray(list?.rencontres)) throw new Error('Le format public FFHandball a changé ou cette équipe est indisponible.');
  const selected=pool.selected_equipe, id=String(selected.id), name=String(selected.libelle || 'Équipe');
  const matches: SportsMatch[]=list.rencontres.filter((r: Row)=>String(r.equipe1Id)===id || String(r.equipe2Id)===id).map((r: Row)=>{
    const homeScore=score(r.equipe1Score),awayScore=score(r.equipe2Score);
    return {id:`handball:${r.ext_rencontreId || r.id}`,home:{id:String(r.equipe1Id),name:String(r.equipe1Libelle || '')},away:{id:String(r.equipe2Id),name:String(r.equipe2Libelle || '')},...dateParts(r.date),homeScore,awayScore,played:homeScore!==undefined && awayScore!==undefined,label:r.date?'':'Date à confirmer',competition:String(r.phaseLibelle || pool.selected_poule?.libelle || '')};
  });
  return {teams:[{id,name}],matches};
}

export function volleyballTable(html: string): {teams: SportsTeam[]; matches: SportsMatch[]} {
  const matches: SportsMatch[]=[], teams=new Map<string,SportsTeam>();
  for (const row of html.matchAll(/<tr\b[^>]*>(.*?)<\/tr>/gis)) {
    const cells=Array.from(row[1].matchAll(/<td\b[^>]*>(.*?)<\/td>/gis),m=>clean(m[1]));
    const date=cells[1]?.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
    if (!date || cells.length<7 || !/^[A-Z0-9_-]+$/i.test(cells[0]) || !cells[3] || !cells[5]) continue;
    const team=(name:string)=>{const t={id:name,name};teams.set(t.id,t);return t;};
    const homeScore=score(cells[6]),awayScore=score(cells[7]);
    matches.push({id:`volleyball:${cells[0]}`,home:team(cells[3]),away:team(cells[5]),date:`${date[3].length===2?'20':''}${date[3]}-${date[2]}-${date[1]}`,time:/^\d{2}:\d{2}$/.test(cells[2])?cells[2]:'',homeScore,awayScore,played:homeScore!==undefined&&awayScore!==undefined,label:'',competition:'FFVolley'});
  }
  if (!matches.length) throw new Error('Aucune rencontre lisible dans cette poule. Vérifiez le lien et la saison ; le format FFVolley peut avoir changé.');
  return {teams:[...teams.values()].sort((a,b)=>a.name.localeCompare(b.name)),matches:[...new Map(matches.map(m=>[m.id,m])).values()]};
}

/** Club membership uses federation IDs, never a partial name match. */
export function footballMatches(rows: Row[], clubId: string, now=Date.now()): {teams:SportsTeam[]; matches:SportsMatch[]; skipped:number} {
  const teams=new Map<string,SportsTeam>(),matches:SportsMatch[]=[];let skipped=0;
  const owns=(t:Row)=>[t.cl_no,t.club?.cl_no,t.club?.id,String(t.club?.['@id']||'').match(/\/clubs\/(\d+)/)?.[1]].some(v=>String(v)===clubId);
  for (const r of rows) {
    if (!r.home || !r.away || (!owns(r.home)&&!owns(r.away))) {skipped++;continue;}
    const team=(t:Row):SportsTeam=>({id:String(t['@id']||t.code||t.id||''),name:String(t.short_name||t.name||'')});
    const home=team(r.home),away=team(r.away);
    if (!home.id || !away.id || !home.name || !away.name || !(r.ma_no || r.id || r['@id'])) {skipped++;continue;}
    if(owns(r.home))teams.set(home.id,home);if(owns(r.away))teams.set(away.id,away);
    const homeScore=score(r.home_score),awayScore=score(r.away_score),label=String(r.status_label||'');
    // Never turn future 0–0 placeholders into results, nor infer forfeits.
    const played=homeScore!==undefined&&awayScore!==undefined&&Date.parse(r.date)<now&&/termin|joué|final/i.test(label);
    matches.push({id:`football:${r.ma_no||r.id||r['@id']}`,home,away,...dateParts(r.date),homeScore:played?homeScore:undefined,awayScore:played?awayScore:undefined,played,label,competition:String(r.competition?.name||r.compet?.name||r.poule?.name||'FFF')});
  }
  return {teams:[...teams.values()],matches,skipped};
}

export function sportsMatchForPoster(m:SportsMatch,team:SportsTeam):MatchItem {
  const home=m.home.id===team.id;
  return {id:m.id,date:m.date,time:m.time,category:team.name,competition:m.competition,teamHome:m.home.name,teamAway:m.away.name,isHomeMatch:home,ourClubName:team.name,gymnasium:'',city:'',homeScore:m.homeScore,awayScore:m.awayScore,status:m.played?'finished':'upcoming',selectedForWeekend:true};
}
