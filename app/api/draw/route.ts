import { demoState } from "@/lib/draw";
import { json } from "@/lib/server";
export async function GET(){return json(demoState());}
