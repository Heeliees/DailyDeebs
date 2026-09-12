import { rawDb } from "../../../db/raw";
import { dayNumber, makeQuestions } from "../../game";
async function handle(request: Request) {
 try {
 const db=rawDb(); const today=dayNumber();
 const cookie=request.headers.get('cookie') || '';
 const existing=cookie.match(/(?:^|; )deebs_player=([a-f0-9-]{36})(?:;|$)/)?.[1];
 const supplied=request.headers.get('X-Deebs-Player');
 const player=supplied && /^[a-f0-9-]{36}$/.test(supplied)?supplied:(existing || crypto.randomUUID());
 if(request.method==='POST') {
  if(request.headers.get('origin') !== new URL(request.url).origin && request.headers.get('origin') !== 'https://heeliees.github.io') return new Response('Invalid origin',{status:403});
  const body=await request.json() as {day:number;picks:string[]};
  if(body.day!==today || !Array.isArray(body.picks) || body.picks.length!==4) return new Response('Invalid result',{status:400});
  const questions=makeQuestions(today);
  if(body.picks.some((pick,i)=>!questions[i].options.some(o=>o.id===pick))) return new Response('Invalid choices',{status:400});
  const score=body.picks.filter((pick,i)=>questions[i].answer.id===pick).length;
  await db.prepare('INSERT INTO results(player,day,score) VALUES(?,?,?) ON CONFLICT(player,day) DO NOTHING').bind(player,today,score).run();
 }
 const rows=await db.prepare('SELECT day,score FROM results WHERE player=? ORDER BY day DESC').bind(player).all<{day:number;score:number}>();
 const daily=await db.prepare('SELECT AVG(score) AS average,COUNT(*) AS players FROM results WHERE day=?').bind(today).first<{average:number|null;players:number}>();
 let streak=0;let expected=rows.results[0]?.day===today ? today : today-1;
 for(const row of rows.results){if(row.day!==expected)break;streak++;expected--;}
 const scores=rows.results.map(r=>r.score);
 return Response.json({best:scores.length?Math.max(...scores):null,worst:scores.length?Math.min(...scores):null,streak,average:daily?.average??null,players:daily?.players??0},{headers:{'Access-Control-Allow-Origin':request.headers.get('origin') === 'https://heeliees.github.io'?'https://heeliees.github.io':new URL(request.url).origin,'Vary':'Origin','Cache-Control':'no-store','Set-Cookie':`deebs_player=${player}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`}});
 }catch(error){console.error(error);return Response.json({error:'Statistics unavailable'},{status:503});}
}
export const GET=handle;export const POST=handle;

export function OPTIONS(request:Request){
 if(request.headers.get('origin')!=='https://heeliees.github.io')return new Response(null,{status:403});
 return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'https://heeliees.github.io','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-Deebs-Player','Vary':'Origin'}});
}
