import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grain min-h-[100dvh] flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto overflow-hidden relative">
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {children}
        </main>
        <Sidebar />
      </div>
    </div>
  );
}
