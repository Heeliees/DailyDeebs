import { env } from "cloudflare:workers";
export function rawDb(){ if(!env.DB) throw new Error("Statistics unavailable"); return env.DB; }
