import {diffLines,diffWordsWithSpace,diffChars, type Change} from 'diff';
export type Segment = {text:string;kind:'same'|'added'|'removed'};
export type Finding = {topic:string;type:'agreement'|'conflict'|'unique'|'uncertain';a:string;b:string;explanation:string};
export type Result = {segments:Segment[];findings:Finding[];summary:string;added:number;removed:number;unchanged:number;changed?:number;error?:string;invalid?:('A'|'B')[]};
const kind=(x:Change):Segment['kind']=>x.added?'added':x.removed?'removed':'same';
const measure={line:(t:string)=>t?(t.match(/\n/g)?.length??0)+(t.endsWith('\n')?0:1):0,word:(t:string)=>t.match(/\S+/g)?.length??0,character:(t:string)=>t.length};
function fromChanges(changes:Change[],unit:string,size:(t:string)=>number):Result {const segments=changes.map(x=>({text:x.value,kind:kind(x)}));const count=(k:Segment['kind'])=>segments.filter(x=>x.kind===k).reduce((n,x)=>n+size(x.text),0);return {segments,findings:[],summary:`${unit} comparison · changes highlighted below`,added:count('added'),removed:count('removed'),unchanged:count('same')}}
function flatten(value:unknown,path='$',out:Record<string,string>={}):Record<string,string>{if(value!==null&&typeof value==='object'){const entries=Object.entries(value);if(entries.length===0)out[path]=Array.isArray(value)?'[]':'{}';for(const [k,v] of entries)flatten(v,Array.isArray(value)?`${path}[${k}]`:`${path}.${k}`,out)}else out[path]=JSON.stringify(value);return out}
const parse=(s:string):{ok:true;value:unknown}|{ok:false}=>{try{return {ok:true,value:JSON.parse(s)}}catch{return {ok:false}}};
function jsonDiff(a:string,b:string):Result {const pa=parse(a),pb=parse(b);if(!pa.ok||!pb.ok){const invalid:('A'|'B')[]=[...(pa.ok?[]:['A' as const]),...(pb.ok?[]:['B' as const])];return {segments:[],findings:[],summary:'Invalid JSON',added:0,removed:0,changed:0,unchanged:0,error:invalid.map(x=>`Input ${x} is not valid JSON`).join('\n'),invalid}}const x=flatten(pa.value),y=flatten(pb.value);const keys=[...new Set([...Object.keys(x),...Object.keys(y)])].sort();const findings:Finding[]=keys.filter(k=>x[k]!==y[k]).map(k=>({topic:k,type:x[k]===undefined||y[k]===undefined?'unique':'conflict',a:x[k]??'(missing)',b:y[k]??'(missing)',explanation:x[k]===undefined?'Added in B':y[k]===undefined?'Removed from B':'Value changed'}));return {segments:[],findings,summary:`${findings.length} changed JSON paths · ${keys.length-findings.length} unchanged`,added:findings.filter(f=>f.a==='(missing)').length,removed:findings.filter(f=>f.b==='(missing)').length,changed:findings.filter(f=>f.type==='conflict').length,unchanged:keys.length-findings.length}}
const stop=new Set('the a an and or but in on at to for from of is are was were be been being it this that these those with by as about into can should would could will use using we you they i he she do does did not only both same also'.split(' '));
const tokens=(s:string)=>new Set((s.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>w.length>2&&!stop.has(w)));
const similarity=(a:string,b:string)=>{const x=tokens(a),y=tokens(b);const intersection=[...x].filter(w=>y.has(w)).length;return x.size+y.size?2*intersection/(x.size+y.size):1};
const sentences=(s:string)=>s.split(/(?:\n+|(?<=[.!?])\s+)/).map(x=>x.trim()).filter(Boolean).slice(0,80);
function semantic(a:string,b:string):Result {const aa=sentences(a),bb=sentences(b),used=new Set<number>(),findings:Finding[]=[];for(const s of aa){let index=-1,best=0;bb.forEach((t,i)=>{if(!used.has(i)){const score=similarity(s,t);if(score>best){best=score;index=i}}});if(index>=0&&best>=0.34){used.add(index);const t=bb[index];const neg=/\b(no|not|never|without|avoid|disable|cannot|don't|doesn't|won't)\b/i;const mismatch=neg.test(s)!==neg.test(t);findings.push({topic:`Statement ${findings.length+1}`,type:mismatch?'uncertain':best>=0.78?'agreement':'uncertain',a:s,b:t,explanation:mismatch?'Possible polarity difference; verify manually':best>=0.78?'Strong lexical overlap; not proof of semantic agreement':'Related wording; review the meaning manually'})}else findings.push({topic:`Statement ${findings.length+1}`,type:'unique',a:s,b:'(no close match)',explanation:'Only found in A under the lexical matching threshold'})}bb.forEach((s,i)=>{if(!used.has(i))findings.push({topic:`Statement ${findings.length+1}`,type:'unique',a:'(no close match)',b:s,explanation:'Only found in B under the lexical matching threshold'})});return {segments:[],findings,summary:'Experimental lexical-semantic matching · NOT an LLM or contradiction detector',added:findings.filter(x=>x.type==='unique').length,removed:0,unchanged:findings.filter(x=>x.type==='agreement').length}}
// Every engine is described the same way; the page builds the selector, the view tabs, the counts and Copy JSON from this.
export type View='inline'|'side'|'findings';
export type Count={text:string;tone?:'green'|'red'|'amber'};
export type DiffEngine={
  id:string;label:string;
  views:View[]; // inline and side show the marked text; findings means the result is a list of findings
  separateReplacements?:boolean; // put a space between a removed part and the added part right after it
  sample?:{a:string;b:string}; // what Sample loads, if not the default text
  compare:(a:string,b:string)=>Result|Promise<Result>; // may be asynchronous, e.g. a language-model engine
  counts:(r:Result)=>Count[]; // the numbers in the results header, with their unit
};
const unitCounts=(one:string,many:string)=>(r:Result):Count[]=>{const u=(n:number)=>n===1?one:many;return [{text:`+${r.added} ${u(r.added)}`,tone:'green'},{text:`−${r.removed} ${u(r.removed)}`,tone:'red'},{text:`${r.unchanged} ${u(r.unchanged)} matched`}]};
const jsonCounts=(r:Result):Count[]=>[{text:`+${r.added} added`,tone:'green'},{text:`−${r.removed} removed`,tone:'red'},{text:`~${r.changed??0} changed`,tone:'amber'},{text:`${r.unchanged} unchanged`}];
const jsonSample={a:'{"model":"gpt-4.1","stream":false,"retry":1,"config":{"timeout":30}}',b:'{"model":"gpt-6","stream":true,"retry":3,"config":{"timeout":30}}'};
// The registry: the first entry is selected at start. A new engine needs only a new entry here.
export const engines:DiffEngine[]=[
  {id:'word',label:'Word diff',views:['inline','side'],separateReplacements:true,compare:(a,b)=>fromChanges(diffWordsWithSpace(a,b),'Word',measure.word),counts:unitCounts('word','words')},
  {id:'line',label:'Line diff',views:['inline','side'],compare:(a,b)=>fromChanges(diffLines(a,b),'Line',measure.line),counts:unitCounts('line','lines')},
  {id:'character',label:'Character diff',views:['inline','side'],compare:(a,b)=>fromChanges(diffChars(a,b),'Character',measure.character),counts:unitCounts('character','characters')},
  {id:'json',label:'JSON structural diff',views:['findings'],sample:jsonSample,compare:jsonDiff,counts:jsonCounts},
  {id:'semantic',label:'Semantic (heuristic)',views:['findings'],compare:semantic,counts:unitCounts('statement','statements')},
];
export const findEngine=(id:string)=>engines.find(e=>e.id===id)??engines[0];
export const failed=(e:unknown):Result=>({segments:[],findings:[],summary:'Comparison failed',added:0,removed:0,unchanged:0,error:e instanceof Error?e.message:String(e)});
