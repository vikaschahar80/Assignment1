import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Editor from "@/pages/Editor";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Editor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-border bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 text-white shadow-sm">
            <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-white/15 ring-1 ring-white/30 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-semibold tracking-tight">SE</span>
                </div>
                <span className="text-xl font-semibold tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-200 to-rose-200">
                    Smart
                  </span>
                  <span className="ml-1 text-white/90">Editor</span>
                </span>
              </div>
              <span className="hidden text-xs font-medium text-white/80 sm:inline">
                AI‑powered writing assistant
              </span>
            </div>
          </header>
          <main className="flex-1">
            <Router />
          </main>
          <footer className="border-t border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 mt-12">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">SE</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    SmartEditor
                  </p>
                  <p className="text-xs text-muted-foreground">
                    AI-powered writing assistant
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  © {new Date().getFullYear()} Created by{" "}
                  <span className="font-medium text-foreground">Vikash Chahar</span>
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Built with ❤️ using React and Tailwind CSS
                </p>
              </div>
            </div>
          </footer>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
