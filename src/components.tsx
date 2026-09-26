import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  X,
  Info,
  CalendarBlank,
  MapPin,
} from "@phosphor-icons/react";
import { useClub } from "./context";
import { asset, formatDate } from "./data";
import type { Tournament } from "./types";

export function Logo({ footer = false }: { footer?: boolean }) {
  return (
    <a
      className={`brand ${footer ? "brand-footer" : ""}`}
      href="#/"
    >
      <img src={asset("logo-palentino.jpg")} alt="" width="64" height="64" />
      <span>
        CLUB PALENTINO <span>DE AJEDREZ</span>
      </span>
    </a>
  );
}
export function LinkButton({
  href,
  children,
  secondary = false,
  external = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  external?: boolean;
}) {
  return (
    <a
      className={`button ${secondary ? "button-secondary" : ""}`}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {external ? (
        <ArrowUpRight aria-hidden="true" />
      ) : (
        <ArrowRight aria-hidden="true" />
      )}
    </a>
  );
}
export function Intro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <div className="intro-copy">{children}</div>}
    </header>
  );
}
export function DemoNotice() {
  const { repository } = useClub();
  if (repository.mode !== "demo") return null;
  return (
    <aside className="demo-notice">
      <Info size={22} aria-hidden="true" />
      <p>
        <strong>Vista previa de solo lectura.</strong> Puedes consultar los
        materiales de prueba guardados en este navegador. El acceso con cuenta
        y la gestión de contenidos aún no están disponibles.
      </p>
    </aside>
  );
}
export function Empty({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function ErrorMessage({ children }: { children: ReactNode }) {
  return children ? (
    <p className="form-error" role="alert">
      {children}
    </p>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <div />
      <div />
      <div />
      <span className="sr-only">Cargando contenido…</span>
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            close();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Cerrar ventana"
          onClick={close}
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <article className="tournament-card">
      <div className="date-block">
        <span>
          {formatDate(tournament.date, { month: "short" }).replace(".", "")}
        </span>
        <strong>{formatDate(tournament.date, { day: "2-digit" })}</strong>
        <small>{formatDate(tournament.date, { year: "numeric" })}</small>
      </div>
      <div className="tournament-content">
        <h3>{tournament.title}</h3>
        <div className="meta">
          <span>
            <MapPin size={16} aria-hidden="true" />
            {tournament.location}
          </span>
          {tournament.time && (
            <span>
              <CalendarBlank size={16} aria-hidden="true" />
              {tournament.time} h
            </span>
          )}
        </div>
        {tournament.description && (
          <p className="preserve-lines">{tournament.description}</p>
        )}
        {tournament.url && (
          <a
            className="text-link"
            href={tournament.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Información e inscripción <ArrowUpRight aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}
