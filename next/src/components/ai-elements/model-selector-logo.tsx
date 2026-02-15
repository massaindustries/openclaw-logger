"use client";



// Mapping of provider names to logo URLs (placeholders). Add real images under public/logos if desired.
const LOGO_MAP: Record<string, string> = { "openai-compatible": "/logos/openai.jpg", "mistral": "/logos/mistral.png", "regolo": "/loghiprovider/logoregolo.png", 

};

/**
 * Renders the logo for a given LLM provider. If a specific logo file is
 * unavailable, a generic placeholder image is used.
 */
export function ModelSelectorLogo({
  provider,
  className,
  ...props
}: {
  provider: string;
} & React.ComponentProps<"img">) {
  const src = LOGO_MAP[provider] ?? "/logos/default.svg";
  const isOpenAI = provider === "openai-compatible";

  // Extract size from className (e.g., "size-7" -> 28px, "size-8" -> 32px)
  const sizeMatch = className?.match(/size-(\d+)/);
  const size = sizeMatch ? parseInt(sizeMatch[1]) * 4 : 32;

  const style: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'contain',
    ...(isOpenAI ? { borderRadius: '50%' } : {}),
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${provider} logo`}
      className={className}
      style={style}
      {...props}
    />
  );
}
