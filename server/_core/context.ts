import type { User } from "../../drizzle/schema.js";
import { sdk } from "./sdk.js";

// Generic request/response types that work with both Express and Vercel
export type TrpcContext = {
  req: any;
  res: any;
  user: User | null;
};

export type CreateContextOptions = {
  req: any;
  res: any;
  info?: any;
};

export async function createContext(opts: CreateContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
