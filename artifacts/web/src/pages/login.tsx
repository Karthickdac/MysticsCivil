import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HardHat } from "lucide-react";

export default function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary blur-[120px]" />
        <div className="absolute bottom-[0%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">OCMS Platform</h1>
            <p className="text-zinc-400 text-sm">
              Construction Operations Cockpit
            </p>
          </div>

          <div className="w-full pt-4">
            <Button 
              size="lg" 
              className="w-full font-semibold text-base h-12"
              onClick={login}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </div>
          
          <p className="text-xs text-zinc-500 pt-4">
            Authorized personnel only. Access is logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
