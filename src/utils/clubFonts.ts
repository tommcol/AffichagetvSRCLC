import type { ClubFont } from './graphicTemplates';
export const MAX_FONT_BYTES = 5 * 1024 * 1024;
export async function validateFontFile(file:File):Promise<ClubFont['format']> {
  if(!file.size || file.size>MAX_FONT_BYTES) throw new Error('Choisissez une police de moins de 5 Mo.');
  const ext=file.name.split('.').pop()?.toLowerCase();
  const bytes=new Uint8Array(await file.slice(0,4).arrayBuffer());
  const magic=String.fromCharCode(...bytes);
  const formats:Record<string,[string,ClubFont['format']]>={woff2:['wOF2','woff2'],woff:['wOFF','woff'],otf:['OTTO','opentype'],ttf:['\x00\x01\x00\x00','truetype']};
  if(!ext || !formats[ext] || (magic!==formats[ext][0] && !(ext==='ttf' && magic==='true'))) throw new Error('Fichier invalide. Formats acceptés : WOFF2, WOFF, TTF, OTF.');
  return formats[ext][1];
}
export function fontCss(font:ClubFont):string {
  // Only this application's uploaded resources; no external URL or CSS injection.
  if(!['woff2','woff','truetype','opentype'].includes(font.format)) throw new Error('Format de police invalide.');
  if(!/^clubfont_[a-z0-9_]+$/.test(font.family) || !/^\/(?:api\/media|uploads)\/[^\s"'<>\\]+$/.test(font.url)) throw new Error('Référence de police invalide.');
  return `@font-face{font-family:"${font.family}";src:url(${JSON.stringify(font.url)}) format("${font.format}");font-display:block;}`;
}
const loaded=new Map<string,Promise<void>>();
export function loadClubFont(font:ClubFont):Promise<void> {
  const key=font.family+'|'+font.url;
  if(loaded.has(key)) return loaded.get(key)!;
  const task=(async()=>{
    const css=fontCss(font);
    let tag=document.getElementById(font.family) as HTMLStyleElement|null;
    if(!tag){tag=document.createElement('style');tag.id=font.family;tag.textContent=css;document.head.appendChild(tag);}
    const faces=await document.fonts.load(`32px "${font.family}"`);
    if(!faces.length) throw new Error(`Impossible de charger la police « ${font.name} ».`);
  })().catch(error=>{loaded.delete(key);document.getElementById(font.family)?.remove();throw error;});
  loaded.set(key,task);return task;
}
export async function importClubFont(file:File):Promise<ClubFont> {
  const format=await validateFontFile(file);
  const id=crypto.randomUUID().replace(/-/g,'');
  const family=`clubfont_${id}`;
  // Parse before persisting; a renamed or corrupt font is not uploaded.
  await new FontFace(family,await file.arrayBuffer()).load();
  const body=new FormData();body.append('file',file);
  const response=await fetch('/api/upload',{method:'POST',body});
  if(!response.ok) throw new Error('Import impossible. Vérifiez votre connexion et votre accès administrateur.');
  const data=await response.json();
  const font:ClubFont={id,name:file.name.replace(/\.[^.]+$/,''),family,url:data.url,format};
  fontCss(font);await loadClubFont(font);return font;
}
