import { useRef } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react";
import { LinkButton } from "./components";
import { ChessKnight } from "./ChessKnight";
import "./journey.css";
import {
  LazyMotion,
  domAnimation,
  useScroll,
  useTransform,
} from "motion/react";
import * as m from "motion/react-m";

const chapters = [
  {
    title: "Aprende.",
    eyebrow: "ESCUELA CLUB PALENTINO",
    description:
      "Todo empieza con un movimiento. Descubre el ajedrez o encuentra nuevas ideas para seguir creciendo, tengas la edad y el nivel que tengas.",
    detail: "Iniciación y avanzado · Curso 2026/2027",
    link: "Conoce la escuela",
    href: "#/escuela",
  },
  {
    title: "Juega.",
    eyebrow: "ENCUENTROS Y TORNEOS",
    description:
      "Pon tus ideas sobre el tablero. Disfruta de la competición, encuentra nuevos rivales y comparte esa emoción que solo se vive frente a las piezas.",
    detail: "La próxima partida también puede ser la tuya.",
    link: "Consulta los torneos",
    href: "#/torneos",
  },
  {
    title: "Comparte.",
    eyebrow: "TU CLUB EN PALENCIA",
    description:
      "Las mejores partidas dejan algo más que un resultado. Dejan conversaciones, amistades y ganas de volver a sentarse al otro lado del tablero.",
    detail: "Un club para todas las edades y todos los niveles.",
    link: "Ven a conocernos",
    href: "#/contacto",
  },
];

export function HomeHero() {
  const hero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: hero,
    offset: ["start start", "end start"],
  });
  const pieceX = useTransform(scrollYProgress, [0, 1], [0, -65]);
  const pieceY = useTransform(scrollYProgress, [0, 1], [0, -75]);
  const pieceRotate = useTransform(scrollYProgress, [0, 1], [0, -9]);
  const boardRotate = useTransform(scrollYProgress, [0, 1], [-18, -4]);
  return (
    <LazyMotion features={domAnimation} strict>
      <section
        className="home-hero container"
        aria-labelledby="home-title"
        ref={hero}
      >
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
        </div>
        <div className="hero-scene" aria-hidden="true">
          <span className="hero-scene-word">Fuerza y honor</span>
          <m.div
            className="hero-board-plane"
            style={{
              rotateX: 50,
              rotateZ: boardRotate,
              transformPerspective: 650,
            }}
          >
            {Array.from({ length: 25 }, (_, i) => (
              <span
                key={i}
                className={(Math.floor(i / 5) + (i % 5)) % 2 ? "dark" : ""}
              />
            ))}
          </m.div>
          <div className="hero-piece-shadow" />
          <m.div
            className="hero-piece"
            style={{
              x: pieceX,
              y: pieceY,
              rotate: pieceRotate,
            }}
          >
            <div className="hero-piece-entrance">
              <ChessKnight className="knight-illustration" />
            </div>
          </m.div>
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
    </LazyMotion>
  );
}

const chapterIcons = [BookOpen, Trophy, UsersThree];

export function ChessJourney() {
  return (
    <section
      className="chess-journey"
      id="recorrido"
      aria-labelledby="recorrido-titulo"
    >
      <div className="container">
        <header className="journey-heading" data-reveal>
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
        <div className="journey-chapters">
          {chapters.map((chapter, i) => {
            const Icon = chapterIcons[i];
            return (
              <article
                className="journey-chapter"
                data-chapter={i}
                key={chapter.title}
              >
                <div
                  className="chapter-art"
                  data-reveal={i % 2 ? "right" : "left"}
                  aria-hidden="true"
                >
                  <span className="chapter-orbit" />
                  <span className="chapter-art-number">0{i + 1}</span>
                  <Icon weight="thin" />
                  <span className="chapter-art-caption">
                    {
                      [
                        "CADA IDEA CUENTA",
                        "ENCUENTRA TU JUGADA",
                        "EL AJEDREZ NOS UNE",
                      ][i]
                    }
                  </span>
                </div>
                <div
                  className="chapter-copy"
                  data-reveal={i % 2 ? "left" : "right"}
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
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
