import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, userProfilesTable, organisationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 12;

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function serializeUser(u: { id: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null }) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    profileImageUrl: u.profileImageUrl,
  };
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json({ user: req.isAuthenticated() ? req.user : null });
});

router.post("/auth/register", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const firstName = body.firstName ? String(body.firstName).trim() : null;
  const lastName = body.lastName ? String(body.lastName).trim() : null;
  const orgName = body.orgName ? String(body.orgName).trim() : null;

  if (!EMAIL_RE.test(email)) { res.status(400).json({ error: "Valid email required" }); return; }
  if (password.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters" }); return; }
  if (!orgName) { res.status(400).json({ error: "Organisation name required" }); return; }

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing) { res.status(409).json({ error: "An account with this email already exists" }); return; }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // First user in the system → admin; otherwise → owner of a newly created org.
  const existingUsers = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  const isFirstUser = existingUsers.length === 0;

  const [org] = await db.insert(organisationsTable).values({ name: orgName }).returning();
  const [user] = await db.insert(usersTable).values({ email, passwordHash, firstName, lastName }).returning();
  await db.insert(userProfilesTable).values({
    userId: user.id,
    role: isFirstUser ? "admin" : "owner",
    organisationId: org.id,
  });

  const sessionData: SessionData = { user: serializeUser(user) };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.status(201).json({ user: serializeUser(user) });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !user.passwordHash) {
    // Constant-ish error; hash anyway to mitigate timing leak when account does not exist.
    if (!user) { await bcrypt.hash(password, BCRYPT_ROUNDS); }
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const sessionData: SessionData = { user: serializeUser(user) };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json({ user: serializeUser(user) });
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

export default router;
