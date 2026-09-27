import { env } from 'cloudflare:workers';
import { handleLive } from '@/lib/live';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handleLive(request, env.OPENAI_API_KEY);
export const POST = (request: Request) => handleLive(request, env.OPENAI_API_KEY);
