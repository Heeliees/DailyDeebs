import { rawDb } from '../../../db/raw';
import { dayNumber, makeQuestions, isCategoryChoice } from '../../game';
import { gradeAnswer } from '../../grading';

function cors(request: Request) {
 return {'Access-Control-Allow-Origin':request.headers.get('origin')==='https://heeliees.github.io'?'https://heeliees.github.io':new URL(request.url).origin,'Vary':'Origin','Cache-Control':'no-store'};
}
function summarize(distribution: number[]) {
 const players=distribution.reduce((sum,count)=>sum+count,0);
 return {distribution,players,average:players?distribution.reduce((sum,count,score)=>sum+score*count,0)/players:null};
}
async function handle(request: Request) {
 const headers=cors(request);
 const fail=(message:string,status:number)=>Response.json({error:message},{status,headers});
 try {
  const db=rawDb(); const today=dayNumber();
  const existing=(request.headers.get('cookie')||'').match(/(?:^|; )deebs_player=([a-f0-9-]{36})(?:;|$)/)?.[1];
  const supplied=request.headers.get('X-Deebs-Player');
  const player=supplied&&/^[a-f0-9-]{36}$/.test(supplied)?supplied:(existing||crypto.randomUUID());
  if(request.method==='POST') {
   if(request.headers.get('origin')!==new URL(request.url).origin&&request.headers.get('origin')!=='https://heeliees.github.io')return fail('Invalid origin',403);
   if(Number(request.headers.get('content-length')||0)>12000)return fail('Result too large',413);
   const body=await request.json() as {day:number;picks:unknown;mode?:string};
   const mode=body.mode??'easy';
   if(body.day!==today||!['easy','hard'].includes(mode)||!Array.isArray(body.picks)||body.picks.length!==4||body.picks.some(p=>typeof p!=='string'||p.length>2000))return fail('Invalid result',400);
   const picks=body.picks as string[]; const questions=makeQuestions(today);
   if(mode==='easy'&&picks.some((pick,i)=>!isCategoryChoice(pick,questions[i].category)))return fail('Invalid choices',400);
   const score=picks.filter((pick,i)=>mode==='hard'?gradeAnswer(questions[i].answer,pick).correct:questions[i].answer.id===pick).length;
   // One scored run per browser/day, including across difficulties and retries.
   await db.prepare('INSERT INTO results(player,day,score,mode) VALUES(?,?,?,?) ON CONFLICT(player,day) DO NOTHING').bind(player,today,score,mode).run();
  }
  const rows=await db.prepare('SELECT day,score FROM results WHERE player=? ORDER BY day DESC').bind(player).all<{day:number;score:number}>();
  const grouped=await db.prepare('SELECT mode,score,COUNT(*) AS players FROM results WHERE day=? GROUP BY mode,score').bind(today).all<{mode:string;score:number;players:number}>();
  const easy=[0,0,0,0,0],hard=[0,0,0,0,0];
  for(const row of grouped.results){if(Number.isInteger(row.score)&&row.score>=0&&row.score<=4)(row.mode==='hard'?hard:easy)[row.score]+=Number(row.players);}
  const combined=summarize(easy.map((n,i)=>n+hard[i]));
  let streak=0;let expected=rows.results[0]?.day===today?today:today-1;
  for(const row of rows.results){if(row.day!==expected)break;streak++;expected--;}
  const scores=rows.results.map(r=>r.score);
  return Response.json({best:scores.length?Math.max(...scores):null,worst:scores.length?Math.min(...scores):null,streak,...combined,easy:summarize(easy),hard:summarize(hard)}, {headers:{...headers,'Set-Cookie':`deebs_player=${player}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`}});
 }catch(error){console.error(error);return fail('Statistics unavailable',503);}
}
export const GET=handle;export const POST=handle;
export function OPTIONS(request:Request){
 if(request.headers.get('origin')!=='https://heeliees.github.io')return new Response(null,{status:403});
 return new Response(null,{status:204,headers:{...cors(request),'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-Deebs-Player'}});
}
