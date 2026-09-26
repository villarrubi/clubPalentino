import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarBlank,
  Trophy,
  MapPin,
  EnvelopeSimple,
  Clock,
  Phone,
  UsersThree,
  GraduationCap,
  LockKey,
  Check,
  WhatsappLogo,
  Horse as Chess,
} from "@phosphor-icons/react";
import {
  Intro,
  LinkButton,
  Empty,
  Loading,
  ErrorMessage,
  TournamentCard,
} from "./components";
import { asset, news, formatDate, today, contact, school } from "./data";
import { useClub } from "./context";
import type { Tournament } from "./types";

export function NewsFeature({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`news-feature ${compact ? "news-compact" : ""}`}>
      <a
        className="news-art"
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="news-art-label">
          MEMORIAL
          <br />
          ALBERTO ACERO
        </span>
        <Chess className="news-chess" weight="duotone" aria-hidden="true" />
        <span className="news-art-bottom">
          AJEDREZ EN PALENCIA <ArrowUpRight size={24} aria-hidden="true" />
        </span>
      </a>
      <div className="news-copy">
        <div className="meta">
          <span className="tag">El club en la prensa</span>
          <time dateTime={news.date}>{formatDate(news.date)}</time>
        </div>
        <h3>
          <a href={news.url} target="_blank" rel="noopener noreferrer">
            {news.title}
          </a>
        </h3>
        <p>{news.description}</p>
        <a
          className="text-link"
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Leer en {news.source}
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
function TournamentList({ short = false }: { short?: boolean }) {
  const { repository } = useClub();
  const [items, setItems] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  useEffect(() => {
    let active = true;
    repository
      .tournaments()
      .then((items) => {
        if (active) setItems(items);
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository]);
  const filtered = items
    .filter((item) =>
      filter === "upcoming" ? item.date >= today() : item.date < today(),
    )
    .sort((a, b) =>
      filter === "upcoming"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
    );
  return (
    <>
      {!short && (
        <div className="segmented" aria-label="Filtrar torneos">
          <button
            className={filter === "upcoming" ? "selected" : ""}
            aria-pressed={filter === "upcoming"}
            onClick={() => setFilter("upcoming")}
          >
            Próximos torneos
          </button>
          <button
            className={filter === "past" ? "selected" : ""}
            aria-pressed={filter === "past"}
            onClick={() => setFilter("past")}
          >
            Torneos anteriores
          </button>
        </div>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : filtered.length ? (
        <div className="tournament-list">
          {(short ? filtered.slice(0, 2) : filtered).map((t) => (
            <TournamentCard tournament={t} key={t.id} />
          ))}
        </div>
      ) : (
        <Empty
          icon={<CalendarBlank size={32} />}
          title={
            filter === "upcoming"
              ? "Preparando la próxima jugada"
              : "Todavía no hay torneos anteriores"
          }
        >
          {filter === "upcoming"
            ? "Publicaremos aquí las fechas, los detalles y la información para participar en los próximos torneos."
            : "Los torneos publicados aparecerán aquí una vez celebrados."}
        </Empty>
      )}
    </>
  );
}
export function Home() {
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-board" aria-hidden="true" />
            TU CLUB DE AJEDREZ EN PALENCIA
          </p>
          <h1>
            La próxima
            <br />
            jugada empieza
            <br />
            <span>contigo.</span>
          </h1>
          <p className="hero-description">
            Un tablero, muchas formas de disfrutarlo.
            <br className="desktop-break" /> Aprende, compite y comparte tu
            pasión por el ajedrez.
          </p>
          <div className="button-row">
            <LinkButton href="#/escuela">Descubre la escuela</LinkButton>
            <a className="text-link" href="#/torneos">
              Ver torneos <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <div className="hero-foot">
            <UsersThree size={23} aria-hidden="true" />
            <span>
              Tu primera partida o tu próximo reto.
              <br />
              <strong>Aquí hay sitio para ti.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            className="hero-image"
            src={asset("ajedrez-hero.webp")}
            srcSet={`${asset("ajedrez-hero-mobile.webp")} 800w, ${asset("ajedrez-hero.webp")} 1120w`}
            sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1200px) 45vw, 580px"
            alt="Piezas de ajedrez blancas y moradas sobre un tablero"
            width="1024"
            height="1280"
            fetchPriority="high"
          />
          <div className="hero-caption">
            <span>Club Palentino de Ajedrez</span>
            <span>Juntos, sobre el tablero.</span>
          </div>
        </div>
      </section>
      <nav className="quick-links container" aria-label="Descubre el club">
        <a href="#/escuela">
          <span className="quick-icon">
            <GraduationCap size={28} weight="light" />
          </span>
          <span>
            <strong>Aprende a tu ritmo</strong>
            <small>Clases de iniciación y avanzado</small>
          </span>
          <ArrowUpRight aria-hidden="true" />
        </a>
        <a href="#/torneos">
          <span className="quick-icon">
            <Trophy size={28} weight="light" />
          </span>
          <span>
            <strong>Nos vemos en el tablero</strong>
            <small>Consulta los próximos torneos</small>
          </span>
          <ArrowUpRight aria-hidden="true" />
        </a>
        <a href="#/aula">
          <span className="quick-icon">
            <BookOpen size={28} weight="light" />
          </span>
          <span>
            <strong>Sigue aprendiendo</strong>
            <small>Tu espacio de materiales</small>
          </span>
          <ArrowUpRight aria-hidden="true" />
        </a>
      </nav>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ACTUALIDAD DEL CLUB</p>
            <h2>
              El ajedrez también
              <br />
              se cuenta.
            </h2>
          </div>
          <a className="text-link" href="#/noticias">
            Todas las noticias <ArrowRight aria-hidden="true" />
          </a>
        </div>
        <NewsFeature compact />
      </section>
      <section className="school-section">
        <div className="container school-grid">
          <div className="school-art" aria-hidden="true">
            <div className="school-board">
              {Array.from({ length: 16 }, (_, i) => (
                <span
                  key={i}
                  className={
                    (Math.floor(i / 4) + (i % 4)) % 2 ? "dark-square" : ""
                  }
                >
                  {i === 6 && <Chess weight="fill" />}
                  {i === 9 && <Chess weight="regular" />}
                </span>
              ))}
            </div>
            <span className="school-art-word">
              Siempre hay
              <br />
              algo que aprender.
            </span>
          </div>
          <div className="school-copy">
            <p className="eyebrow">ESCUELA CLUB PALENTINO</p>
            <h2>
              De tu primer movimiento
              <br />a pensar un paso más allá.
            </h2>
            <p>
              Ajedrez para todas las edades y niveles. Aprende y comparte cada
              descubrimiento en la Escuela Club Palentino.
            </p>
            <ul className="check-list">
              <li>
                <Check aria-hidden="true" />
                Iniciación y nivel avanzado
              </li>
              <li>
                <Check aria-hidden="true" />
                Materiales organizados por temas
              </li>
              <li>
                <Check aria-hidden="true" />
                Acceso a los dos niveles para todos los alumnos
              </li>
            </ul>
            <LinkButton href="#/escuela">Conoce las clases</LinkButton>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LA AGENDA</p>
            <h2>Próximos torneos.</h2>
          </div>
          <a className="text-link" href="#/torneos">
            Ver la agenda <ArrowRight aria-hidden="true" />
          </a>
        </div>
        <TournamentList short />
      </section>
      <section className="contact-cta container">
        <div>
          <p className="eyebrow">HABLEMOS DE AJEDREZ</p>
          <h2>Nos falta tu próxima jugada.</h2>
          <p>Conoce el club y encuentra tu lugar en el tablero.</p>
        </div>
        <LinkButton href="#/contacto">Contacta con el club</LinkButton>
      </section>
    </>
  );
}
export function Tournaments() {
  return (
    <div className="container inner-page">
      <Intro eyebrow="ENCUENTROS SOBRE EL TABLERO" title="Próximos torneos.">
        <p>
          El calendario del club, con toda la información para preparar tu
          próxima partida.
        </p>
      </Intro>
      <TournamentList />
    </div>
  );
}
export function News() {
  return (
    <div className="container inner-page">
      <Intro eyebrow="ACTUALIDAD DEL CLUB" title="Lo que pasa entre jugadas.">
        <p>Noticias y encuentros del ajedrez palentino.</p>
      </Intro>
      <NewsFeature />
      <p className="source-note">
        Los enlaces de prensa se abren en la web del medio original.
      </p>
    </div>
  );
}
export function Classes() {
  return (
    <div className="container inner-page">
      <Intro eyebrow={`CURSO ${school.season}`} title="Escuela Club Palentino">
        <p>
          Ajedrez para <strong>todas las edades y todos los niveles.</strong>{" "}
          Aprende desde cero o da un paso más en tu juego, compartiendo cada
          descubrimiento con el club.
        </p>
      </Intro>
      <div className="school-enrollment">
        <div>
          <CalendarBlank size={25} aria-hidden="true" />
          <span>
            <strong>Del 2 de octubre al 28 de mayo</strong>
            <small>Curso 2026/2027. Todos los viernes lectivos.</small>
          </span>
        </div>
        <a
          className="button"
          href={contact.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsappLogo size={21} aria-hidden="true" />
          Información e inscripciones
        </a>
      </div>
      <div className="course-grid">
        <article className="course-card">
          <div className="course-icon">
            <Chess weight="regular" />
          </div>
          <p className="eyebrow">LOS PRIMEROS PASOS</p>
          <h2>Iniciación</h2>
          <p className="course-schedule">
            <Clock size={18} aria-hidden="true" />
            Viernes, de 18:00 a 19:00
          </p>
          <p>
            Aprende las reglas y el movimiento de las piezas, el ataque y la
            defensa, el jaque mate, la táctica elemental y las primeras ideas de
            estrategia.
          </p>
          <a className="text-link" href="#/aula/iniciacion">
            Materiales de iniciación <ArrowRight aria-hidden="true" />
          </a>
        </article>
        <article className="course-card course-advanced">
          <div className="course-icon">
            <Chess weight="fill" />
          </div>
          <p className="eyebrow">UN PASO MÁS ALLÁ</p>
          <h2>Avanzado</h2>
          <p className="course-schedule">
            <Clock size={18} aria-hidden="true" />
            Viernes, de 19:00 a 20:00
          </p>
          <p>
            Profundiza en táctica y estrategia, cálculo de variantes, finales,
            planificación y análisis de partidas. Prepara tu juego para la
            competición.
          </p>
          <a className="text-link" href="#/aula/avanzado">
            Materiales de avanzado <ArrowRight aria-hidden="true" />
          </a>
        </article>
      </div>
      <p className="flexible-groups">
        <UsersThree size={22} aria-hidden="true" />
        Los grupos son flexibles. El profesor podrá cambiar a los alumnos de
        nivel según su evolución y sus necesidades de aprendizaje.
      </p>
      <section className="class-details">
        <div>
          <p className="eyebrow">NOS VEMOS LOS VIERNES</p>
          <h2>
            Una hora para aprender.
            <br />
            Muchas ideas para llevarte.
          </h2>
          <p>
            Del viernes <strong>2 de octubre de 2026</strong> al viernes{" "}
            <strong>28 de mayo de 2027</strong>. Las clases se celebran los
            viernes lectivos, excepto festivos y vacaciones escolares.
          </p>
          <p>
            Una actividad para desarrollar la concentración, la toma de
            decisiones, el pensamiento lógico y la capacidad de análisis, en un
            espacio de convivencia.
          </p>
        </div>
        <div className="school-facts">
          <div className="price-block">
            <span>Cuota del curso</span>
            <strong>
              {school.price}
              <small> / trimestre</small>
            </strong>
            <p>Por alumno. Pago por transferencia al club o en mano.</p>
          </div>
          <div className="school-venue">
            <MapPin size={25} aria-hidden="true" />
            <div>
              <strong>{school.venue}</strong>
              <p>
                {school.address}
                <br />
                {school.city}
              </p>
              <a
                className="text-link"
                href={contact.maps}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cómo llegar <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="enrollment-contact">
        <div>
          <h2>Haz tu primera jugada.</h2>
          <p>
            Contacta con el club para apuntarte o resolver cualquier duda sobre
            las clases.
          </p>
        </div>
        <div className="button-row">
          <a
            className="button"
            href={contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsappLogo aria-hidden="true" />
            Escríbenos por WhatsApp
          </a>
          <a className="text-link" href={contact.phoneLink}>
            <Phone aria-hidden="true" />
            {contact.phone}
          </a>
        </div>
      </section>
      <div className="student-callout">
        <LockKey size={30} aria-hidden="true" />
        <div>
          <h3>¿Ya eres alumno del club?</h3>
          <p>
            Accede a las presentaciones, los documentos y el material de ambos
            niveles.
          </p>
        </div>
        <LinkButton href="#/aula">Área de alumnos</LinkButton>
      </div>
    </div>
  );
}
export function Contact() {
  return (
    <div className="container inner-page">
      <Intro
        eyebrow="CERCA, DENTRO Y FUERA DEL TABLERO"
        title="Hablemos de ajedrez."
      >
        <p>
          ¿Quieres conocer el club, aprender a jugar o participar en un torneo?
          Escríbenos. Estaremos encantados de conocerte.
        </p>
      </Intro>
      <div className="contact-layout">
        <section className="contact-information">
          <h2>
            Club Palentino
            <br />
            de Ajedrez
          </h2>
          <p className="contact-location">
            <MapPin size={20} aria-hidden="true" />
            Palencia, Castilla y León
          </p>
          <div className="details-list">
            <div>
              <Phone aria-hidden="true" />
              <span>
                <strong>Teléfono</strong>
                <a className="contact-value" href={contact.phoneLink}>
                  {contact.phone}
                </a>
              </span>
            </div>
            <div>
              <EnvelopeSimple aria-hidden="true" />
              <span>
                <strong>Correo electrónico</strong>
                <a className="contact-value" href={contact.emailLink}>
                  {contact.email}
                </a>
              </span>
            </div>
            <div>
              <MapPin aria-hidden="true" />
              <span>
                <strong>Lugar de las clases</strong>
                <small>
                  {school.venue}
                  <br />
                  {school.address}, {school.city}
                </small>
                <a
                  className="text-link"
                  href={contact.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver en el mapa <ArrowUpRight aria-hidden="true" />
                </a>
              </span>
            </div>
          </div>
          <div className="contact-buttons">
            <a
              className="button"
              href={contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsappLogo aria-hidden="true" />
              Abrir WhatsApp
            </a>
            <a className="button button-secondary" href={contact.emailLink}>
              <EnvelopeSimple aria-hidden="true" />
              Enviar un correo
            </a>
          </div>
          <p className="muted">
            Abriremos WhatsApp o tu aplicación de correo con un mensaje
            preparado para que puedas revisarlo y enviarlo.
          </p>
        </section>
        <aside className="contact-brand">
          <img
            src={asset("logo-palentino.jpg")}
            width="280"
            height="280"
            alt="Escudo del Club Palentino de Ajedrez"
          />
          <h3>
            Una pasión compartida.
            <br />
            Un club en Palencia.
          </h3>
          <a className="text-link" href="#/escuela">
            Escuela Club Palentino <ArrowRight aria-hidden="true" />
          </a>
        </aside>
      </div>
    </div>
  );
}
