/** The section's heading: a full-bleed sticky bar on mobile (sized from its parent, not 100vw, so a scrollbar can't cause sideways scroll), hidden on desktop where the left nav names the sections. */
export function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 -mx-6 mb-4 w-[calc(100%+3rem)] bg-bg/75 px-6 py-5 backdrop-blur md:-mx-12 md:w-[calc(100%+6rem)] md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
      <h2 id={id} className="text-sm font-semibold uppercase tracking-[0.16em] text-text lg:sr-only">
        {children}
      </h2>
    </div>
  );
}
