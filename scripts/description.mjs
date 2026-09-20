// Keep gameplay names: deleting braces also deletes status effects and controls.
export function cleanDescription(raw, record) {
 const humanize = value => value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([a-z])([0-9])/gi, '$1 $2');
 let text=String(raw||'').replace(/\{(?:Keyword|Input)\.([^}]+)\}/gi,(_,name)=>humanize(name));
 text=text.replace(/\{Tunable\.[^.}]+\.([^}]+)\}/gi,(match,key)=>{
  const values=record.tunables?.[key.toLowerCase()];
  return Array.isArray(values)&&values.length?String(values.at(-1)):match;
 });
 if(Array.isArray(record.tunables))text=text.replace(/\{(\d+)\}/g,(match,index)=>{
  const values=record.tunables[Number(index)];
  return Array.isArray(values)&&values.length?String(values.at(-1)):match;
 });
 if(/\{[^}]+\}/.test(text))throw new Error(`Unresolved gameplay reference in ${record.name}: ${text.match(/\{[^}]+\}/g)?.join(', ')}`);
 text=text.replace(/<br\s*\/?>/gi,'\n').replace(/<\/li>/gi,'\n').replace(/<li[^>]*>/gi,'• ').replace(/<\/(?:p|ul|ol)>/gi,'\n').replace(/<[^>]+>/g,'')
  .replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
  .replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/[ \t]{2,}/g,' ').trim();
 if(!text)throw new Error(`Empty gameplay description: ${record.name}`);
 return text;
}
