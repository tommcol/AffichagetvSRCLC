export type PosterAspectRatio = '4:5' | '9:16' | '1:1' | '16:9';

export type TemplateField = 'title' | 'team' | 'opponent' | 'score' | 'date';
export type TemplateShape = 'rectangle' | 'rounded' | 'pill' | 'outline' | 'text';
export interface GraphicTextStyle {
  font: string; size: number; minSize: number; color: string; background: string;
  shape: TemplateShape; borderColor: string; borderWidth: number; opacity: number;
  align: 'left' | 'center' | 'right';
}
export interface GraphicBox { x: number; y: number; width: number; height: number }
export interface GraphicLayout {
  title: GraphicBox; area: GraphicBox; fields: Record<Exclude<TemplateField, 'title'>, GraphicBox>;
  gap: number; minRowHeight: number; maxRowHeight: number; capacity: number;
}
export interface GraphicTemplate {
  schemaVersion: 1; id: string; name: string;
  background: string; backgroundOpacity: number; useClubBackground: boolean;
  styles: Record<TemplateField, GraphicTextStyle>;
  layouts: Record<PosterAspectRatio, GraphicLayout>;
}
export interface ClubFont { id: string; name: string; family: string; url: string; format: 'woff2' | 'woff' | 'truetype' | 'opentype' }
export interface GraphicLibrary {
  schemaVersion: 1; models: GraphicTemplate[]; fonts: ClubFont[];
  selected: Partial<Record<'matches' | 'results', string>>;
}
export const TEMPLATE_FORMATS: PosterAspectRatio[] = ['4:5', '9:16', '1:1', '16:9'];
export const FIELD_LABELS: Record<TemplateField, string> = { title:'Titre', team:'Notre équipe', opponent:'Adversaire', score:'Heure / score', date:'Date / lieu' };
export function readGraphicLibrary(value?: GraphicLibrary): GraphicLibrary {
  if (value && value.schemaVersion !== 1) throw new Error('Ces modèles nécessitent une version plus récente de l’application.');
  return { schemaVersion:1, models:value?.models || [], fonts:value?.fonts || [], selected:{...value?.selected} };
}
const box = (x:number,y:number,width:number,height:number): GraphicBox => ({x,y,width,height});
function layout(format: PosterAspectRatio): GraphicLayout {
  return {
    title:box(6,4,88,12), area:box(6,21,88,71),
    fields:{date:box(0,0,100,25),team:box(0,30,38,65),score:box(40,30,20,65),opponent:box(62,30,38,65)},
    gap:20, minRowHeight:format==='16:9'?180:150, maxRowHeight:270, capacity:format==='9:16'?7:format==='4:5'?5:4,
  };
}
function style(font:string,size:number,color:string,background:string,shape:TemplateShape):GraphicTextStyle {
  return {font,size,minSize:24,color,background,shape,borderColor:color,borderWidth:2,opacity:1,align:'center'};
}
const designs: [string,string,string,string,TemplateShape,boolean][] = [
  ['Énergie','#ef233c','#080e20','#ffffff','pill',true],
  ['Tribune','#f97316','#111827','#ffffff','rectangle',true],
  ['Épuré','#172554','#f8fafc','#172554','text',false],
  ['Contours','#38bdf8','#071827','#f8fafc','outline',false],
  ['Élégance','#c6a55b','#151515','#faf6e8','rounded',false],
  ['Émeraude','#047857','#ecfdf5','#052e16','rectangle',false],
  ['Nuit électrique','#a855f7','#100920','#faf5ff','outline',true],
  ['Journal','#111827','#fffdf4','#111827','text',false],
  ['Bleu glacier','#0369a1','#f0f9ff','#0c4a6e','rounded',false],
  ['Contraste','#facc15','#171717','#ffffff','rectangle',false],
];
export const GRAPHIC_PRESETS: GraphicTemplate[] = designs.map(([name,accent,bg,text,shape,useClubBackground],i)=> {
  const layouts = Object.fromEntries(TEMPLATE_FORMATS.map(format=>[format,layout(format)])) as GraphicTemplate['layouts'];
  if (shape==='text') for (const l of Object.values(layouts)) {
    l.fields={date:box(0,0,100,25),team:box(0,32,37,63),score:box(39,32,22,63),opponent:box(63,32,37,63)};
    l.gap=32;
  }
  return { schemaVersion:1,id:`preset-${i}`,name,background:bg,backgroundOpacity:.8,useClubBackground,layouts,
    styles:{title:style('Bebas Neue',88,text,accent,shape),team:style('Oswald',54,shape==='text'?text:'#ffffff',accent,shape),opponent:style('Oswald',46,text,bg,shape),score:style('Montserrat',40,text,bg,shape),date:style('Montserrat',28,text,bg,'text')},
  };
});
export function templateCapacity(model:GraphicTemplate,format:PosterAspectRatio):number {
  const height = format==='9:16'?1920:format==='4:5'?1350:1080;
  const l=model.layouts[format];
  return Math.max(1,Math.min(l.capacity,Math.floor((height*l.area.height/100+l.gap)/(l.minRowHeight+l.gap))));
}
export function saveGraphicModel(library:GraphicLibrary,model:GraphicTemplate):GraphicLibrary {
  return {...library,models:[...library.models.filter(m=>m.id!==model.id),structuredClone(model)]};
}
export function validateGraphicModel(model:GraphicTemplate):string[] {
  const errors:string[]=[];
  if (!model.name.trim()) errors.push('Donnez un nom au modèle.');
  for (const [format,l] of Object.entries(model.layouts)) {
    for (const [name,b] of Object.entries({titre:l.title,rencontres:l.area,...l.fields})) {
      if (![b.x,b.y,b.width,b.height].every(Number.isFinite) || b.width<=0 || b.height<=0 || b.x<0 || b.y<0 || b.x+b.width>100.01 || b.y+b.height>100.01) errors.push(`${format} : le bloc ${name} dépasse de sa zone.`);
    }
    const overlap=(a:GraphicBox,b:GraphicBox)=>a.x<b.x+b.width && b.x<a.x+a.width && a.y<b.y+b.height && b.y<a.y+a.height;
    if(overlap(l.title,l.area)) errors.push(`${format} : le titre chevauche les rencontres.`);
    const fields=Object.entries(l.fields);
    for(let i=0;i<fields.length;i++) for(let j=i+1;j<fields.length;j++) if(overlap(fields[i][1],fields[j][1])) errors.push(`${format} : ${FIELD_LABELS[fields[i][0] as TemplateField]} chevauche ${FIELD_LABELS[fields[j][0] as TemplateField]}.`);
    const canvasHeight=format==='9:16'?1920:format==='4:5'?1350:1080;
    if(canvasHeight*l.area.height/100<l.minRowHeight) errors.push(`${format} : la zone est trop petite pour une rencontre.`);
    if(l.minRowHeight<120 || l.maxRowHeight<l.minRowHeight || l.gap<0 || l.capacity<1) errors.push(`${format} : hauteur ou espacement invalide.`);
  }
  for(const s of Object.values(model.styles)) if(s.minSize<20 || s.size<s.minSize) errors.push('La taille minimale doit être au moins 20 et inférieure à la taille souhaitée.');
  return [...new Set(errors)];
}
