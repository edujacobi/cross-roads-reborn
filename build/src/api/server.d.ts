import { type FastifyInstance } from "fastify";
export declare function createApiServer(): Promise<FastifyInstance>;
export declare function startApiServer(port?: number): Promise<FastifyInstance>;
export declare function stopApiServer(): Promise<void>;
