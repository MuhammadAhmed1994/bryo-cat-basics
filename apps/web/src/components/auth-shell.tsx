import { ReactNode } from 'react';
import { Logo, PoweredBy } from './brand';

/**
 * Split-screen frame for the signed-out screens: form on the left, a pasture
 * scene on the right. The scene is drawn in CSS so the app ships no binary
 * asset; swap the right pane for the real photograph when it is available.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col px-8 py-10 lg:w-[40%] lg:px-16">
        <Logo />

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <div className="flex justify-center">
          <PoweredBy />
        </div>
      </div>

      <div className="relative hidden flex-1 overflow-hidden lg:block" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-amber-100 to-lime-700" />
        {/* Sun */}
        <div className="absolute left-1/2 top-[38%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-50 blur-xl" />
        <div className="absolute left-1/2 top-[38%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        {/* Pasture */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-lime-600/80 to-green-900" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-green-950/70" />
      </div>
    </main>
  );
}
