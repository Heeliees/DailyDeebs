import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {cleanDescription} from './description.mjs';
const temporary=mkdtempSync(join(tmpdir(),'deebs-check-'));
try {
 for(const name of ['effects','grading','game'])writeFileSync(join(temporary,name+'.js'),ts.transpile(readFileSync(new URL('../app/'+name+'.ts',import.meta.url),'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}));
 mkdirSync(join(temporary,'data'));writeFileSync(join(temporary,'data/catalog.json'),readFileSync(new URL('../app/data/catalog.json',import.meta.url)));
 const require=createRequire(join(temporary,'check.cjs'));
 const {gameplayEffects}=require('./effects.js');const {gradeAnswer}=require('./grading.js');const {makeQuestions,dayNumber}=require('./game.js');
 const catalog=JSON.parse(readFileSync(new URL('../app/data/catalog.json',import.meta.url)));
 const entries=['perk','item','addon','offering'].flatMap(k=>catalog[k]).filter(e=>e.icon&&!e.retired);
 const entry=name=>entries.find(e=>e.name===name);
 const check=(name,answer,expected)=>assert.equal(gradeAnswer(entry(name),answer).correct,expected,`${name}: ${answer}`);
 check('Tinkerer','Undetectable for 16s and a notification when a gen hits 70%, once per gen',true);
 check('Tinkerer','At 70% gen repair you get undetectable for 16 seconds and a loud noise notification. Only once per generator per trial.',true);
 check('Tinkerer','At 70% gen repair you get haste for 16 seconds and a loud noise notification. Only once per generator per trial.',false);
 check('Tinkerer','At 70% gen repair you get undetectable for 12 seconds and a loud noise notification. Only once per generator per trial.',false);
 check('Tinkerer','Undetectable for 16s when a gen hits 70%, once per gen',false);
 check('Ranger Med-kit','Heal others 50% faster, allows self healing with 33% reduced speed and efficiency.',true);
 check('Ranger Med-kit','Heal others 50% faster, allows self healing with 33% reduced speed and efficiency. A full heal requires 16 charges.',true);
 check('Ranger Med-kit','Heal others 40% faster, allows self healing with 33% reduced speed and efficiency.',false);
 check('Ranger Med-kit','Heal others 50% faster.',false);
 check("Alex's Toolbox",'Increases repair speed by 100%, unlocks sabotage and increases sabotage speed by 10%.',false);
 check("Alex's Toolbox",'Increases repair speed by 10%, unlocks sabotage and increases sabotage speed by 100%.',true);
 check('Bloody Party Streamers','100% bonus BP in all categories for everyone',true);
 check('Bloody Party Streamers','25% bonus BP in all categories for everyone',false);
 check('"Windstorm" - Blood','Increases cloaked movement speed by 9%',true);
 check('"Windstorm" - Blood','Increases cloaked movement speed by 5%',false);
 for(const e of entries) {
  const effects=gameplayEffects(e);assert.ok(effects.length>5,`Empty effects: ${e.name}`);
  assert.equal(gradeAnswer(e,effects).correct,true,`Canonical effects rejected: ${e.name}`);
  assert.equal(gradeAnswer(e,'').correct,false);
  assert.equal(gradeAnswer(e,e.name).correct,false,`Name-only guess accepted: ${e.name}`);
  if(e.category==='perk'){assert.equal(e.tier,3);assert.doesNotMatch(e.description,/\{[^}]+\}|\bgain(?:s)? (?:for|\.)/);}
 }
 const fixture={name:'Tier test',tunables:{duration:['12','14','16'],'haste%':['3','4','5']}};
 assert.equal(cleanDescription('Gain {Keyword.Undetectable} for {Tunable.Perk.Duration}s with {Tunable.Perk.Haste%}% {Keyword.Haste}. {Input.ActivatableButton1}',fixture),'Gain Undetectable for 16s with 5% Haste. Activatable Button 1');
 assert.equal(cleanDescription('{0}',{name:'legacy',tunables:[['12','14','16']]}),'16');
 assert.throws(()=>cleanDescription('Gain {Tunable.X.Unknown}',fixture),/Unresolved/);
 assert.equal(dayNumber(new Date('2026-09-11T12:00:00Z')),1);
 assert.equal(makeQuestions(9)[0].answer.name,'Tinkerer');
 for(let day=1;day<=30;day++) for(const question of makeQuestions(day)){assert.equal(question.options.length,4);assert.equal(new Set(question.options.map(gameplayEffects).map(s=>s.toLowerCase().replace(/\s+/g,' ').trim())).size,4);}
 console.log(`Passed grading regressions, Tier III/import checks, daily anchor, and ${entries.length} playable effect descriptions.`);
} finally {rmSync(temporary,{recursive:true,force:true});}
