import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers.js";
import { COOKIE_NAME } from "../shared/const.js";
import type { TrpcContext } from "../server/_core/context.js";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; setCookieHeaders: string[] } {
  const setCookieHeaders: string[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      setHeader: (name: string, value: string) => {
        if (name === 'Set-Cookie') {
          setCookieHeaders.push(value);
        }
      },
      headers: {
        set: (name: string, value: string) => {
          if (name === 'Set-Cookie') {
            setCookieHeaders.push(value);
          }
        },
      },
    } as unknown as TrpcContext["res"],
  };

  return { ctx, setCookieHeaders };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, setCookieHeaders } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(setCookieHeaders).toHaveLength(1);
    
    // Verificar que la cookie se establece con Max-Age=0 para eliminarla
    const cookieHeader = setCookieHeaders[0];
    expect(cookieHeader).toContain(COOKIE_NAME);
    expect(cookieHeader).toContain('Max-Age=0');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('Path=/');
  });
});
