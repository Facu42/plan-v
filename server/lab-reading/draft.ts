const line=/^([A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .()+-]{2,80}?)\s*:\s*(\d+(?:[.,]\d+)?)\s*([A-Za-z/%μµ.]{1,20})(?:\s*\|\s*([^@|]{1,60}))?\s*$/;

export type LabDraftValue={name:string;value:string;unit:string;range:string};

/** Lectura local de un informe ya anonimizado. No llama a un proveedor y no guarda. */
export function parseLabDraft(text:string):LabDraftValue[]{
  if(/@|paciente\s*:|dni\s*:|\+?\d{8,}/i.test(text))return [];
  const seen=new Set<string>();
  const values:LabDraftValue[]=[];
  for(const raw of text.split(/\r?\n/)){
    const match=line.exec(raw.trim());
    if(!match)continue;
    const name=match[1].replace(/\s+/g,' ').trim();
    const key=name.toLowerCase();
    if(seen.has(key))continue;
    seen.add(key);
    values.push({name,value:match[2].replace(',','.'),unit:match[3],range:(match[4]??'').trim()});
    if(values.length===60)break;
  }
  return values;
}
