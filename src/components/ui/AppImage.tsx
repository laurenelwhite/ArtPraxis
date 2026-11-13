import Image from "next/image";
import type { CSSProperties, SyntheticEvent } from "react";

type AppImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Intrinsic hints when CSS drives the displayed size (default 4:3). */
  width?: number;
  height?: number;
  /** Fill a `position: relative` parent (cover/contain via CSS / style). */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  draggable?: boolean;
  /** Force Next optimization off (default: remote, blob, and data URLs). */
  unoptimized?: boolean;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

function isDynamicSrc(src: string): boolean {
  return (
    src.startsWith("blob:") ||
    src.startsWith("data:") ||
    /^https?:\/\//i.test(src)
  );
}

/**
 * Shared image primitive — silences `no-img-element` while preserving layout
 * and pixel fidelity for dynamic lesson/reference URLs (`unoptimized`).
 */
export function AppImage({
  src,
  alt,
  className,
  style,
  width = 1600,
  height = 1200,
  fill = false,
  sizes,
  priority,
  loading,
  draggable = false,
  unoptimized,
  onLoad,
  onError,
}: AppImageProps) {
  const skipOptimize = unoptimized ?? isDynamicSrc(src);

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        style={style}
        fill
        sizes={sizes ?? "100vw"}
        priority={priority}
        loading={priority ? undefined : loading}
        unoptimized={skipOptimize}
        draggable={draggable}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : loading}
      unoptimized={skipOptimize}
      draggable={draggable}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
