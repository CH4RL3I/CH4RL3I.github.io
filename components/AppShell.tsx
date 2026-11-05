import { TerminalHost } from './TerminalHost';

/** The page sits in .page so the terminal overlay can make it inert while it is open. */
export function AppShell({ children, answersEnabled }: { children: React.ReactNode; answersEnabled: boolean }) {
  return (
    <>
      <div className="page">{children}</div>
      <TerminalHost answersEnabled={answersEnabled} />
    </>
  );
}
