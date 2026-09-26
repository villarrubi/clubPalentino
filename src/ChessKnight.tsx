import { asset } from "./data";

/** Cburnett's classic chess knight, served locally without changing its artwork. */
export function ChessKnight({ className = "" }: { className?: string }) {
  return (
    <img
      className={className}
      src={asset("caballo-clasico.svg")}
      width="450"
      height="450"
      alt=""
      draggable={false}
      fetchPriority="high"
    />
  );
}
