import type { Request, Response, NextFunction } from "express";
import { db, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userRole?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

async function loadRole(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ role: userProfilesTable.role })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));
  return row?.role ?? null;
}

export function requireRole(...allowed: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const role = req.userRole ?? (await loadRole(req.user!.id));
      req.userRole = role ?? undefined;
      if (!role || !allowed.includes(role)) {
        res.status(403).json({
          error: `Forbidden — required role: ${allowed.join(" | ")}`,
        });
        return;
      }
      next();
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? "RBAC check failed" });
    }
  };
}

export const ROLE_GROUPS = {
  ADMIN: ["admin"] as const,
  OWNER_PM: ["owner", "pm", "admin"] as const,
  OWNER_PM_QS: ["owner", "pm", "qs", "admin"] as const,
  OWNER_PM_FINANCE: ["owner", "pm", "finance", "admin"] as const,
  SITE_WRITE: ["owner", "pm", "site_engineer", "qc", "admin"] as const,
};
