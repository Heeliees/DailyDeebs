import type { Entry } from './game';
import { gameplayEffects } from './effects';

export type Grade = { correct: boolean; missing: string[] };
const aliases: [RegExp, string][] = [
  [/\b(?:gens?|generators?)\b/g, 'generator'], [/\b(?:survs?|survivors?|teammates?|team mates?|allies)\b/g, 'survivor'],
  [/\b(?:heals?|healing|healed)\b/g, 'heal'], [/\b(?:repairs?|repairing|repaired|fix(?:es|ing|ed)?)\b/g, 'repair'],
  [/\b(?:sabotag\w*|sabo)\b/g, 'sabotage'], [/\b(?:auras?|outlines?)\b/g, 'aura'],
  [/\b(?:exhaustion|exhausted)\b/g, 'exhausted'], [/\b(?:haemorrhage|hemorrhage)\b/g, 'hemorrhage'],
  [/\b(?:seconds?|secs?|s)\b/g, 'second'], [/\b(?:metres?|meters?|m)\b/g, 'meter'],
  [/\b(?:percent|per cent)\b/g, '%'], [/\b(?:cool down|cooldown)\b/g, 'cooldown'],
  [/\b(?:increas\w*|boost\w*|rais\w*|faster|quicker|higher|more quickly)\b/g, 'increase'],
  [/\b(?:decreas\w*|reduc\w*|lower\w*|shorter|slower|lessen\w*)\b/g, 'decrease'],
  [/\b(?:loud noise notification|noise notification|notifications?|alerts?|alerted|notify|notifies|notification|sound cue|notified)\b/g, 'alert'],
  [/\b(?:one time|a single time|only once|one activation|once only)\b/g, 'once'],
  [/\b(?:self[- ]heal(?:ing)?|heal (?:yourself|myself)|healing (?:yourself|myself))\b/g, 'selfheal'],
  [/\b(?:heal (?:other|others)|healing (?:other|others))\b/g, 'heal survivor'],
  [/\b(?:dying state|on the ground|downed|slugged)\b/g, 'downed'],
  [/\b(?:pick(?:ing)? up|get(?:ting)? up|reviv\w*)\b/g, 'recover'],
  [/\b(?:blood ?points?|bps?)\b/g, 'bloodpoint'], [/\b(?:everyone|everybody|all players)\b/g, 'all player'], [/\b(?:terror radius|tr)\b/g, 'terrorradius'],
  [/\b(?:scratch marks?|scratches)\b/g, 'scratchmark'], [/\b(?:pools? of blood|blood trails?)\b/g, 'bloodpool'],
  [/\b(?:grunts? of pain|pain noises?|injured sounds?)\b/g, 'painnoise'],
  [/\b(?:skill[- ]checks?)\b/g, 'skillcheck'], [/\b(?:health states?|health stages?)\b/g, 'healthstate'],
  [/\b(?:breakable walls?)\b/g, 'wall'], [/\b(?:vault locations?|vaults?|vaulting|vaulted|windows?)\b/g, 'vault'],
  [/\b(?:unhook\w*|rescue[sd]?)\b/g, 'unhook'], [/\b(?:hooking|hooked|hooks?)\b/g, 'hook'],
  [/\b(?:cloaked|cloaking|cloak|invisible|invisibility)\b/g, 'cloak'],
  [/\b(?:exit gates?|doors?)\b/g, 'gate'], [/\b(?:match|round|game|trial)\b/g, 'trial'],
  [/\b(?:lasts?|lasting|duration)\b/g, 'duration'], [/\b(?:activat\w*|trigger\w*)\b/g, 'trigger'],
  [/\b(?:can not|cannot|can't|does not|doesn't|do not|don't|no|never|without|prevents?|blocks?|blocked|suppress\w*|hides?|hidden)\b/g, 'not'],
  [/\b(?:reveal\w*|see|sees|seeing|show\w*|visible|visibility)\b/g, 'reveal'],
  [/\b(?:allow\w*|enabl\w*|unlock\w*)\b/g, 'allow'],
];
const numbers: Record<string,string> = {one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',twelve:'12',sixteen:'16',twenty:'20',thirty:'30',forty:'40',fifty:'50',sixty:'60',seventy:'70',eighty:'80',ninety:'90',hundred:'100'};
const stop = new Set('a an the you your yourself i my me we us our they their them it its this that these those to of in on at by for from with and or then than as is are be being been become becomes gain gains give gives granted grants have has had get gets earn earns while when whenever after before until during next all each every per only up within through into out upon also both can will would which who other another additional ability button use using action status effect basic time start starts first end ends progress trial reaches reach hit hits location trigger reveal allow'.split(' '));
export function normalizeAnswer(input: string): string {
  let s=input.normalize('NFKD').toLowerCase().replace(/[’‘]/g,"'").replace(/(\d)([a-z%])/g,'$1 $2').replace(/\b([a-z]+)\b/g,w=>numbers[w]??w);
  for(const [pattern,replacement] of aliases)s=s.replace(pattern,replacement);
  // "50% movement speed" and "50% Haste" express the same buff.
  s=s.replace(/(?:movement|running|run|move) speed(?: increase)?/g,'haste').replace(/increase (\d+(?:\.\d+)?\s*%)?\s*haste/g,'$1 haste');
  return s.replace(/[^a-z0-9%.\s-]/g,' ').replace(/\s+/g,' ').trim();
}
function tokens(text: string): string[] {
  return [...new Set(normalizeAnswer(text).match(/[a-z]+|\d+(?:\.\d+)?|%/g)??[])].filter(w=>!stop.has(w)).map(w=>w.length>4?w.replace(/(?:ing|ed|s)$/,''):w);
}
function close(a:string,b:string) {
  if(a===b)return true;
  if(a.length<5||b.length<5||Math.abs(a.length-b.length)>1||/\d/.test(a+b))return false;
  let i=0,j=0,edits=0;
  while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}
  return edits+(a.length-i)+(b.length-j)<=1;
}
const statuses=['undetectable','exhausted','endurance','exposed','oblivious','blindness','broken','mangled','hemorrhage','hindered','haste','elusive','deep wound'];
export function answerRequirements(entry: Entry): string[] {
  return gameplayEffects(entry).replace(/\buse the ability button\b/gi,'activate').split(/\n+|•|(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x&&tokens(x).length>0);
}
export function gradeAnswer(entry: Entry, answer: string): Grade {
  answer=answer.replace(/(?:a full heal|repairing a generator|sabotaging a hook) requires [^.]+\.?/gi,'');
  const guess=normalizeAnswer(answer);
  if(!guess||answer.length>2000)return {correct:false,missing:answerRequirements(entry)};
  const expected=gameplayEffects(entry);
  if(entry.key === 'Tinkerer') {
    const checks: [boolean,string][] = [
      [/\bgenerator\b/.test(guess) && /\b70\s*%/.test(guess), 'A generator reaches 70% repair progress.'],
      [/\balert\b/.test(guess), 'A loud noise notification reveals that generator’s location.'],
      [/\bundetectable\b/.test(guess) && /\b16\s*second/.test(guess), 'Gain Undetectable for 16 seconds.'],
      [/\bonce\b/.test(guess), 'Triggers once per generator per trial.'],
    ];
    const missing=checks.filter(([ok])=>!ok).map(([,text])=>text);
    if(/\bnot\b/.test(guess)||/\b(?:haste|hindered|exposed)\b/.test(guess))missing.push('Check the status effect.');
    return {correct:missing.length===0,missing};
  }
  // Exact effect text remains valid regardless of punctuation/capitalisation.
  if(guess===normalizeAnswer(expected))return {correct:true,missing:[]};
  const guessTokens=tokens(answer);
  const missing=answerRequirements(entry).filter(requirement=>{
    const wanted=tokens(requirement);
    const normalized=normalizeAnswer(requirement);
    const digits=normalized.match(/\d+(?:\.\d+)?/g)??[];
    if(digits.some(n=>!guessTokens.includes(n)))return true;
    if(statuses.some(s=>normalized.includes(s)&&!guess.includes(s)))return true;
    // Do not accept the opposite direction or an explicit negation of an effect.
    if(/\bincrease\b/.test(normalized)&&/\bdecrease\b/.test(guess)&&! /\bincrease\b/.test(guess))return true;
    if(/\bdecrease\b/.test(normalized)&&/\bincrease\b/.test(guess)&&! /\bdecrease\b/.test(guess))return true;
    if(/\bnot\b/.test(guess)&&!/\bnot\b/.test(normalizeAnswer(expected)))return true;
    // Bind percentages to their effect, so repair/sabotage or self/other-heal
    // values cannot be swapped and still pass by sharing the same numbers.
    const percentage = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
    const topic = ['selfheal','sabotage','repair','heal','haste'].find(t=>new RegExp(`\\b${t}\\b`).test(normalized));
    if(percentage && topic) {
      const clauses=guess.split(/[;,\n]|\.(?!\d)|\band\b/).filter(c=>new RegExp(`\\b${topic}\\b`).test(c));
      if(clauses.length && !clauses.some(c=>new RegExp(`\\b${percentage[1].replace('.', '\\.')}\\s*%`).test(c))) return true;
      if(clauses.length && /\bincrease\b/.test(normalized) && clauses.every(c=>/\bdecrease\b/.test(c)&&!/\bincrease\b/.test(c))) return true;
      if(clauses.length && /\bdecrease\b/.test(normalized) && clauses.every(c=>/\bincrease\b/.test(c)&&!/\bdecrease\b/.test(c))) return true;
    }
    const matched=wanted.filter(w=>guessTokens.some(g=>close(w,g))).length;
    return matched<Math.ceil(wanted.length*.6);
  });
  // Check units as well as values: 70 seconds cannot stand in for 70%.
  const expectedUnits = [...normalizeAnswer(expected).matchAll(/(\d+(?:\.\d+)?)\s*(%|second|meter)/g)];
  for (const [,amount,unit] of expectedUnits) {
    const actual = [...guess.matchAll(new RegExp(`\\b${amount.replace('.', '\\.')}\\s*(%|second|meter)`, 'g'))];
    if (actual.length && !actual.some(m=>m[1]===unit)) {missing.push('Check the percentages, durations and ranges.');break;}
  }
  return {correct:missing.length===0,missing};
}
