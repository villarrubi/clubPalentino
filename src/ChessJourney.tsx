import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react";
import { LinkButton } from "./components";
import { ChessKnight } from "./ChessKnight";
import "./journey.css";

const chapters = [
  {
    title: "Aprende.",
    square: "a1",
    x: 60,
    y: 340,
    eyebrow: "ESCUELA CLUB PALENTINO",
    description:
      "Todo empieza con un movimiento. Descubre el ajedrez o encuentra nuevas ideas para seguir creciendo, tengas la edad y el nivel que tengas.",
    detail: "Iniciación y avanzado · Curso 2026/2027",
    link: "Conoce la escuela",
    href: "#/escuela",
  },
  {
    title: "Juega.",
    square: "b3",
    x: 100,
    y: 260,
    eyebrow: "ENCUENTROS Y TORNEOS",
    description:
      "Pon tus ideas sobre el tablero. Disfruta de la competición, encuentra nuevos rivales y comparte esa emoción que solo se vive frente a las piezas.",
    detail: "La próxima partida también puede ser la tuya.",
    link: "Consulta los torneos",
    href: "#/torneos",
  },
  {
    title: "Comparte.",
    square: "d4",
    x: 180,
    y: 220,
    eyebrow: "TU CLUB EN PALENCIA",
    description:
      "Las mejores partidas dejan algo más que un resultado. Dejan conversaciones, amistades y ganas de volver a sentarse al otro lado del tablero.",
    detail: "Un club para todas las edades y todos los niveles.",
    link: "Ven a conocernos",
    href: "#/contacto",
  },
];

export function HomeHero() {
  const journey = () => {
    document.getElementById("recorrido")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    document.getElementById("recorrido-titulo")?.focus({ preventScroll: true });
  };
  return (
    <section className="home-hero container" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <p className="eyebrow">TU CLUB DE AJEDREZ EN PALENCIA</p>
        <h1 id="home-title">
          La próxima
          <br />
          jugada empieza
          <br />
          <em>contigo.</em>
        </h1>
        <p className="home-hero-description">
          Un tablero. Infinitas formas de encontrarnos. <br />
          Aprende, juega y comparte tu pasión por el ajedrez.
        </p>
        <div className="button-row">
          <LinkButton href="#/escuela">Descubre la escuela</LinkButton>
          <a className="text-link" href="#/torneos">
            Ver torneos <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
        <button className="journey-invitation" onClick={journey}>
          Cada partida tiene un comienzo{" "}
          <ArrowDown size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="hero-scene" aria-hidden="true">
        <span className="hero-scene-word">Tu jugada.</span>
        <div className="hero-board-plane">
          {Array.from({ length: 25 }, (_, i) => (
            <span
              key={i}
              className={(Math.floor(i / 5) + (i % 5)) % 2 ? "dark" : ""}
            />
          ))}
        </div>
        <div className="hero-piece-shadow" />
        <ChessKnight className="hero-piece" />
        <div className="hero-scene-caption">
          <span>01 / EL PRIMER MOVIMIENTO</span>
          <span>Siempre hay una nueva posibilidad.</span>
        </div>
      </div>
      <div className="hero-bottom">
        <span>Club Palentino de Ajedrez</span>
        <span>Aprender. Jugar. Volver a encontrarnos.</span>
        <span>Palencia, Castilla y León</span>
      </div>
    </section>
  );
}

export function ChessJourney() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const setup = () => {
      observer?.disconnect();
      if (media.matches) {
        setActive(0);
        return;
      }
      // Pixel margins track viewport height; IO percentage margins use its width.
      const readingLine = Math.round(innerHeight * 0.55);
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting)
              setActive(Number((entry.target as HTMLElement).dataset.chapter));
          });
        },
        {
          rootMargin: `-${readingLine}px 0px -${innerHeight - readingLine - 2}px 0px`,
          threshold: 0,
        },
      );
      root.current
        ?.querySelectorAll("[data-chapter]")
        .forEach((step) => observer!.observe(step));
    };
    setup();
    media.addEventListener("change", setup);
    addEventListener("resize", setup);
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", setup);
      removeEventListener("resize", setup);
    };
  }, []);
  const position = chapters[active];
  return (
    <section
      className="chess-journey"
      id="recorrido"
      ref={root}
      aria-labelledby="recorrido-titulo"
      data-active-step={active}
    >
      <div className="container">
        <header className="journey-heading">
          <p className="eyebrow">MUCHO MÁS QUE UN JUEGO</p>
          <h2 id="recorrido-titulo" tabIndex={-1}>
            Un tablero.
            <br />
            <em>Todo por descubrir.</em>
          </h2>
          <p>
            Tres formas de vivir el ajedrez.
            <br />
            Un lugar para compartirlas.
          </p>
        </header>
        <div className="journey-layout">
          <div className="journey-visual" aria-hidden="true">
            <div className="journey-board-wrap">
              <svg
                className="journey-board"
                viewBox="0 0 400 400"
                focusable="false"
              >
                <rect
                  x="29"
                  y="33"
                  width="344"
                  height="344"
                  rx="3"
                  fill="#0e2436"
                />
                {Array.from({ length: 64 }, (_, i) => (
                  <rect
                    key={i}
                    x={40 + (i % 8) * 40}
                    y={40 + Math.floor(i / 8) * 40}
                    width="40"
                    height="40"
                    fill={
                      (Math.floor(i / 8) + (i % 8)) % 2 ? "#698599" : "#d9e0da"
                    }
                  />
                ))}
                {chapters.map((chapter, i) => (
                  <rect
                    key={chapter.square}
                    x={chapter.x - 20}
                    y={chapter.y - 20}
                    width="40"
                    height="40"
                    className={`journey-square ${active >= i ? "visited" : ""}`}
                  />
                ))}
                <path
                  className={`journey-path ${active >= 1 ? "traced" : ""}`}
                  d="M60 340L100 260"
                  pathLength="1"
                />
                <path
                  className={`journey-path ${active >= 2 ? "traced" : ""}`}
                  d="M100 260L180 220"
                  pathLength="1"
                />
                {Array.from({ length: 8 }, (_, i) => (
                  <g key={i} className="board-coordinate">
                    <text x={60 + i * 40} y="387" textAnchor="middle">
                      {String.fromCharCode(97 + i)}
                    </text>
                    <text x="16" y={65 + i * 40} textAnchor="middle">
                      {8 - i}
                    </text>
                  </g>
                ))}
                <g
                  className="journey-knight"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                  }}
                >
                  <ellipse cy="8" rx="20" ry="8" fill="#102839" opacity=".4" />
                  <svg
                    x="-31"
                    y="-65"
                    width="62"
                    height="78"
                    viewBox="0 0 240 300"
                  >
                    <ChessKnight />
                  </svg>
                </g>
              </svg>
            </div>
            <div className="journey-notation">
              <span>UN CABALLO. TRES POSIBILIDADES.</span>
              <span>
                {chapters.map((chapter, i) => (
                  <span
                    key={chapter.square}
                    className={i === active ? "current" : ""}
                  >
                    {chapter.square}
                    {i < 2 && <b> → </b>}
                  </span>
                ))}
              </span>
            </div>
            <div className="journey-progress">
              {chapters.map((chapter, i) => (
                <span
                  key={chapter.square}
                  className={i <= active ? "filled" : ""}
                />
              ))}
            </div>
          </div>
          <div className="journey-chapters">
            {chapters.map((chapter, i) => (
              <article
                className={`journey-chapter ${active === i ? "active" : ""}`}
                data-chapter={i}
                key={chapter.square}
              >
                <div className="chapter-meta">
                  <span>0{i + 1}</span>
                  <span>{chapter.eyebrow}</span>
                </div>
                <h3>{chapter.title}</h3>
                <p>{chapter.description}</p>
                <small>{chapter.detail}</small>
                <a className="journey-link" href={chapter.href}>
                  {chapter.link}
                  <ArrowUpRight size={22} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
