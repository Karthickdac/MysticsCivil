import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { HardHat, Loader2 } from "lucide-react";

export default function Login() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regOrgName, setRegOrgName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) setLocation("/");
  }, [isAuthenticated, isLoading, setLocation]);

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login({ email: signinEmail.trim(), password: signinPassword });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err?.message ?? "Please try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await register({
        email: regEmail.trim(),
        password: regPassword,
        firstName: regFirstName.trim() || undefined,
        lastName: regLastName.trim() || undefined,
        orgName: regOrgName.trim(),
      });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.message ?? "Please try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary blur-[120px]" />
        <div className="absolute bottom-[0%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[100px]" />
      </div>
      <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">Mystics Civil</h1>
            <p className="text-zinc-400 text-sm">Construction Operations Cockpit</p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" data-testid="tab-signin">Sign in</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignin} className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" autoComplete="email" required value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} data-testid="input-signin-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-password">Password</Label>
                  <Input id="si-password" type="password" autoComplete="current-password" required value={signinPassword} onChange={(e) => setSigninPassword(e.target.value)} data-testid="input-signin-password" />
                </div>
                <Button type="submit" size="lg" className="w-full font-semibold h-11" disabled={busy} data-testid="button-signin">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-first">First name</Label>
                    <Input id="reg-first" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} data-testid="input-register-firstname" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-last">Last name</Label>
                    <Input id="reg-last" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} data-testid="input-register-lastname" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-org">Organisation name</Label>
                  <Input id="reg-org" required value={regOrgName} onChange={(e) => setRegOrgName(e.target.value)} data-testid="input-register-org" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" autoComplete="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} data-testid="input-register-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" autoComplete="new-password" required minLength={8} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} data-testid="input-register-password" />
                  <p className="text-xs text-zinc-500">Minimum 8 characters.</p>
                </div>
                <Button type="submit" size="lg" className="w-full font-semibold h-11" disabled={busy} data-testid="button-register">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-zinc-500 pt-2">Authorized personnel only. Access is logged and monitored.</p>
        </div>
      </div>
    </div>
  );
}
