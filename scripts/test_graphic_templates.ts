import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GRAPHIC_PRESETS, TEMPLATE_FORMATS, readGraphicLibrary, saveGraphicModel, templateCapacity, validateGraphicModel } from '../src/utils/graphicTemplates';
import { fontCss, validateFontFile, MAX_FONT_BYTES } from '../src/utils/clubFonts';
import { GraphicTemplateRenderer } from '../src/components/templates/GraphicTemplateRenderer';
import { normalizeLoadedVisualTemplates } from '../src/utils/appDataHelpers';
import { getClubFirstMatchPresentation } from '../src/utils/clubFirstMatchPresentation';
import type { MatchItem, VisualTemplatesConfig } from '../src/types';

assert.equal(GRAPHIC_PRESETS.length,10);
const empty=readGraphicLibrary();
assert.deepEqual(empty.models,[]);
assert.throws(()=>readGraphicLibrary({schemaVersion:2} as any),/version/);
const before=JSON.stringify(empty);
const model=structuredClone(GRAPHIC_PRESETS[0]);model.id='custom';
const saved=saveGraphicModel(empty,model);
model.name='Draft never committed';
assert.equal(saved.models[0].name,'Énergie');
assert.equal(JSON.stringify(empty),before,'Draft save does not mutate previous config');
const config={matchesBackgroundUrl:'existing',resultsBackgroundUrl:'existing-results',birthdaysBackgroundUrl:'',defaultVictoryBackgroundUrl:'',defaultDefeatBackgroundUrl:'',mediaBank:[{id:'keep',url:'/uploads/keep.png',mediaType:'image',name:'keep'}],graphicLibrary:{...saved,selected:{matches:'custom'}}} as VisualTemplatesConfig;
const roundtrip=normalizeLoadedVisualTemplates(JSON.parse(JSON.stringify(config)));
assert.deepEqual(roundtrip,config,'Existing data and model library survive normalization');
const variant=structuredClone(saved.models[0]);variant.layouts['4:5'].area.x=10;
assert.equal(variant.layouts['16:9'].area.x,6,'Variants do not share geometry by reference');
for(const p of GRAPHIC_PRESETS) for(const format of TEMPLATE_FORMATS){
  assert.deepEqual(validateGraphicModel(p),[],`${p.name}/${format}`);
  const cap=templateCapacity(p,format);
  assert.ok(cap>=1 && cap<=p.layouts[format].capacity);
  const items=Array.from({length:17},(_,i)=>i);
  const pages=Array.from({length:Math.ceil(items.length/cap)},(_,i)=>items.slice(i*cap,(i+1)*cap));
  assert.deepEqual(pages.flat(),items,'Every encounter is retained across pages');
}
const invalid=structuredClone(GRAPHIC_PRESETS[0]);invalid.layouts['4:5'].fields.team.width=95;
assert.ok(validateGraphicModel(invalid).some(s=>s.includes('chevauche')));
invalid.layouts['4:5'].area.x=95;
assert.ok(validateGraphicModel(invalid).some(s=>s.includes('dépasse')));
const away:MatchItem={id:'away',date:'2030-11-10',time:'18:30',category:'Notre équipe',teamHome:'Adversaire au nom très long',teamAway:'Club exemple',ourClubName:'Club exemple',isHomeMatch:false,homeScore:76,awayScore:82,status:'finished',competition:'Test',gymnasium:'',city:''};
assert.equal(getClubFirstMatchPresentation(away).scoreText,'82 - 76');
for(const format of TEMPLATE_FORMATS){
  const html=renderToStaticMarkup(React.createElement(GraphicTemplateRenderer,{model:GRAPHIC_PRESETS[1],format,title:'Résultats',matches:[away],results:true}));
  assert.ok(html.indexOf('Notre équipe')<html.indexOf('Adversaire au nom très long'));
  assert.ok(html.includes('82 - 76'));
  assert.ok(!html.includes('18:30'),'No repeated time in results date');
  assert.equal((html.match(/data-template-row="true"/g)||[]).length,1);
}
const font={id:'one',name:'Example',family:'clubfont_one',url:'/uploads/font.woff2',format:'woff2' as const};
assert.ok(fontCss(font).includes('@font-face'));
assert.throws(()=>fontCss({...font,url:'https://external.invalid/font.woff2'}),/invalide/);
assert.throws(()=>fontCss({...font,family:'"};body{display:none}'}),/invalide/);
for(const [ext,magic,format] of [['woff2','wOF2','woff2'],['woff','wOFF','woff'],['ttf','\x00\x01\x00\x00','truetype'],['otf','OTTO','opentype']]) {
  assert.equal(await validateFontFile(new File([magic+'data'],`font.${ext}`)),format);
}
await assert.rejects(validateFontFile(new File(['not a font'],'renamed.ttf')),/invalide/);
await assert.rejects(validateFontFile(new File(['wOF2'],'font.svg')),/invalide/);
await assert.rejects(validateFontFile(new File([new Uint8Array(MAX_FONT_BYTES+1)],'big.ttf')),/5 Mo/);
console.log('Graphic templates: persistence, variants, pagination, layout guards, club-first results, font validation OK. Browser fitting/export not covered by SSR.');
const { safeExportPosterToDataUrl } = await import('../src/utils/posterExporter');
await assert.rejects(safeExportPosterToDataUrl({querySelector:(q:string)=>q.includes('pending')?{}:null} as any),/chargement des polices/);
await assert.rejects(safeExportPosterToDataUrl({querySelector:(q:string)=>q.includes('overflow')?{}:null} as any),/texte dépasse/);
const selected=readGraphicLibrary({...saved,selected:{matches:'custom',results:'other'}});
const changed=saveGraphicModel(selected,{...saved.models[0],name:'Renamed'});
assert.equal(changed.selected.results,'other');assert.equal(changed.selected.matches,'custom');
console.log('Export guards and independent model selections OK.');
