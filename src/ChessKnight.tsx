import { asset } from "./data";

/** Photographic Staunton cutout generated for the club, with genuine alpha. */
export function ChessKnight({
  className = "",
  large = false,
}: {
  className?: string;
  large?: boolean;
}) {
  return (
    <img
      className={className}
      src={asset(
        large ? "caballo-staunton.webp" : "caballo-staunton-small.webp",
      )}
      alt=""
      width="800"
      height="1000"
      draggable={false}
      fetchPriority={large ? "high" : undefined}
    />
  );
}
