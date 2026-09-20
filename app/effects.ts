import type { Entry } from './game';

// Only gameplay belongs in an answer. Keep the original description separately
// so the reveal can still show context without making it a grading requirement.
export function gameplayEffects(entry: Entry): string {
  let text = entry.description.replace(/\u00a0/g, ' ').replace(/([.!?])(?=[A-Z0-9])/g, '$1\n');
  if (entry.category === 'perk') return text.replace(/Activatable Button [12]/g, 'the ability button');
  const mechanic = /^(?:[•\s]*)(?:increas|decreas|reduc|add[ s]|grants?|gain|remov|reveal|unlock|allow|enabl|disabl|replac|extend|shorten|caus|prevent|suppress|recharg|releas|press|consum|tremendously|moderately|slightly|considerably|greatly|burning|calls (?:upon|on)|provides|start|begin|while|when|after|if|during|hitting|uncloak|instantly|rites of judgment|zombies|survivors? (?:can|are|suffer|that|injured|damaged|who|afflicted)|(?:all survivors|you) start|the (?:aura|killer (?:can|gains|sees|becomes)|survivor (?:can|gains|sees|becomes))|makes|fog cloud|\d)/i;
  const sentences = text.split(/(?<=[.!?])\s+|\n/).filter(Boolean);
  const first = sentences.findIndex(s => mechanic.test(s));
  if (first > 0) text = sentences.slice(first).join('\n');
  else if (first < 0 && text.includes('\n\n')) text=text.split(/\n\s*\n/).slice(1).join('\n');
  text = text
    .replace(/(?:A full heal|Repairing a generator|Sabotaging a hook) requires [^.]+\.?/gi, '')
    .replace(/(?:^|\n)\s*(?:Secret|Personal|Does not stack|Stacks)\.?\s*(?=\n|$)/gi, '')
    .replace(/(?:^|\n)\s*["“].*?["”](?:\s*[—–-].*)?(?=\n|$)/g, '')
    .replace(/(?:^|\n)\s*(?:Undetectable hides|Blindness prevents|Exhausted prevents|Mangled reduces|Hemorrhage (?:increases|regresses)|Mangled increases|Hindered reduces|Broken prevents|Oblivious prevents|Exposed allows)[^.]+\.?/gi, '')
    .replace(/(?:^|\n)\s*(?:\d+ charges\.?|(?:Begins with|Has) \d+ charges\.?|Consume a charge to:)\s*/gi, '\n')
    .replace(/Unlocks (?:hidden|awesome) potential in one's aura reading ability\./gi,'')
    .replace(/(\d+ seconds)(?=[A-Z])/g,'$1.\n')
    .replace(/This lasts for a set duration or until (?:fully )?healed\./gi,'')
    .replace(/Increases confetti by 100%\.|Considerably increases Friendly Ghosts in your life\.|Yay!/gi, '')
    .replace(/\n{3,}/g, '\n\n').trim();
  // The base use is otherwise only present in the item's flavour text.
  if (entry.category === 'item') {
    if (/flashlight|will o.? wisp/i.test(entry.name) && !/blind.*killer/i.test(text)) text = 'Shine the beam into the Killer’s eyes to blind them.\n' + text;
    if (/firecracker|party starter/i.test(entry.name)) text = 'Detonates with loud bangs and flashes that can distract and blind the Killer.';
  }
  return text.trim();
}
