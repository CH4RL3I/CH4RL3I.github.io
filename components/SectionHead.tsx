import { Reveal } from './Reveal';

export function SectionHead({
  eyebrow,
  title,
  intro,
  id,
  center = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  id: string;
  center?: boolean;
}) {
  return (
    <Reveal as="header" className={`mb-14 md:mb-20 ${center ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl'}`}>
      <p className="label mb-5">{eyebrow}</p>
      <h2 id={`${id}-title`} className="display text-balance text-5xl leading-[0.95] tracking-[-0.045em] text-text md:text-7xl">
        {title}
      </h2>
      {intro && <p className="mt-6 text-sm leading-relaxed text-muted md:text-base">{intro}</p>}
    </Reveal>
  );
}
