import { useEffect, useRef, useState } from "react";
import {
  List,
  X,
  LockKey,
  Moon,
  Sun,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { useClub } from "./context";
import { Home, Classes, Contact, Tournaments, News } from "./PublicPages";
import { Campus, Login } from "./PrivatePages";
import { Admin } from "./Admin";
import { NewsDetail } from "./NewsPages";
import { Intro, LinkButton, Logo, Loading } from "./components";
import { useScrollReveal } from "./useScrollReveal";

const navigation = [
  ["/", "Inicio"],
  ["/escuela", "Escuela Club Palentino"],
  ["/torneos", "Próximos torneos"],
  ["/noticias", "Noticias"],
  ["/contacto", "Contacto"],
];
const titleMap: Record<string, string> = {
  "/": "Inicio",
  "/escuela": "Escuela Club Palentino",
  "/clases": "Escuela Club Palentino",
  "/torneos": "Próximos torneos",
  "/noticias": "Noticias",
  "/contacto": "Contacto",
  "/acceso": "Acceso",
  "/aula": "Área de alumnos",
  "/aula/iniciacion": "Clases de iniciación",
  "/aula/avanzado": "Clases de avanzado",
  "/panel": "Panel de gestión",
};
function path() {
  return location.hash.slice(1).split("?")[0] || "/";
}
export default function App() {
  const [route, setRoute] = useState(path);
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("palentino-theme");
      return saved
        ? saved === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });
  const { session, ready, repository } = useClub();
  const main = useRef<HTMLElement>(null);
  useScrollReveal(main, route);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const navigate = () => {
      setRoute(path());
      setMenu(false);
      window.scrollTo({ top: 0 });
      requestAnimationFrame(() => main.current?.focus({ preventScroll: true }));
    };
    addEventListener("hashchange", navigate);
    return () => removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("palentino-theme", dark ? "dark" : "light");
    } catch {
      /* The theme still works when storage is unavailable. */
    }
  }, [dark]);
  useEffect(() => {
    document.title = `${titleMap[route] ?? "Página no encontrada"} | Club Palentino de Ajedrez`;
  }, [route]);
  useEffect(() => {
    if (!menu) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    addEventListener("keydown", escape);
    return () => removeEventListener("keydown", escape);
  }, [menu]);
  const isPrivate = [
    "/aula",
    "/aula/iniciacion",
    "/aula/avanzado",
    "/panel",
  ].includes(route);
  let content;
  if (isPrivate && !ready)
    content = (
      <div className="container inner-page">
        <Loading />
      </div>
    );
  else if (isPrivate && !session) content = <Login destination={route} />;
  else if (route === "/") content = <Home />;
  else if (route === "/clases" || route === "/escuela") content = <Classes />;
  else if (route === "/contacto") content = <Contact />;
  else if (route === "/torneos") content = <Tournaments />;
  else if (route === "/noticias") content = <News />;
  else if (route.startsWith("/noticias/"))
    content = <NewsDetail key={route} id={route.slice("/noticias/".length)} />;
  else if (route === "/acceso") content = <Login />;
  else if (route === "/aula") content = <Campus />;
  else if (route === "/aula/iniciacion")
    content = <Campus course="iniciacion" />;
  else if (route === "/aula/avanzado") content = <Campus course="avanzado" />;
  else if (route === "/panel" && session?.role !== "student")
    content = <Admin />;
  else if (route === "/panel")
    content = (
      <div className="container inner-page">
        <Intro
          eyebrow="ÁREA DE ALUMNOS"
          title="Este espacio es para el profesorado."
        />
        <LinkButton href="#/aula">Volver a mis clases</LinkButton>
      </div>
    );
  else
    content = (
      <div className="container inner-page">
        <Intro eyebrow="PÁGINA NO ENCONTRADA" title="Esta jugada no existe.">
          <p>
            La página que buscas no está disponible. Vuelve al inicio para
            seguir explorando el club.
          </p>
        </Intro>
        <LinkButton href="#/">Volver al inicio</LinkButton>
      </div>
    );
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav
            className={`main-navigation ${menu ? "is-open" : ""}`}
            id="main-navigation"
            aria-label="Navegación principal"
          >
            {navigation.map(([href, label]) => (
              <a
                key={href}
                href={`#${href}`}
                aria-current={route === href ? "page" : undefined}
                onClick={() => setMenu(false)}
              >
                {label}
              </a>
            ))}
            <a className="mobile-area" href="#/aula">
              Área de alumnos <LockKey aria-hidden="true" />
            </a>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button theme-toggle"
              aria-label={dark ? "Activar tema claro" : "Activar tema oscuro"}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <a className="header-area" href="#/aula">
              <LockKey size={17} aria-hidden="true" />
              Área de alumnos
            </a>
            <button
              ref={menuButton}
              className="icon-button menu-button"
              aria-expanded={menu}
              aria-controls="main-navigation"
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={26} /> : <List size={26} />}
            </button>
          </div>
        </div>
      </header>
      <main id="main" ref={main} tabIndex={-1}>
        {content}
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <Logo footer />
            <p className="club-motto">Fuerza y honor</p>
          </div>
          <nav aria-label="Enlaces del club">
            <h2>El club</h2>
            <a href="#/escuela">Escuela Club Palentino</a>
            <a href="#/torneos">Próximos torneos</a>
            <a href="#/noticias">Noticias</a>
            <a href="#/contacto">Contacto</a>
          </nav>
          <nav aria-label="Enlaces de acceso">
            <h2>Tu espacio</h2>
            <a href="#/aula">
              Área de alumnos <ArrowUpRight aria-hidden="true" />
            </a>
            <a href="#/panel">Acceso de profesores</a>
            <span>Palencia, Castilla y León</span>
          </nav>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Club Palentino de Ajedrez</span>
          <span>
            {repository.mode === "demo"
              ? "Vista previa del club"
              : "Ajedrez para compartir"}
          </span>
        </div>
      </footer>
    </>
  );
}
