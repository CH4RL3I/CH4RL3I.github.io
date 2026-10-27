import { TerminalHost } from './TerminalHost';

/** The page sits in .page so the terminal overlay can make it inert while it is open. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="page">{children}</div>
      <TerminalHost />
    </>
  );
}
