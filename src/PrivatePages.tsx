import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  LockKey,
  Eye,
  EyeSlash,
  Folder,
  DownloadSimple,
  MagnifyingGlass,
  FilePdf,
  FilePpt,
  FileText,
  GraduationCap,
  Strategy,
  PuzzlePiece,
  SignOut,
} from "@phosphor-icons/react";
import {
  Intro,
  DemoNotice,
  Empty,
  ErrorMessage,
  Loading,
  LinkButton,
} from "./components";
import { useClub } from "./context";
import {
  courseNames,
  sectionNames,
  type Course,
  type Material,
  type MaterialSection,
} from "./types";
import { fileSize } from "./data";

export function Login({ destination = "/aula" }: { destination?: string }) {
  const { login, repository, session, logout } = useClub();
  const staff = destination === "/panel";
  const available = repository.mode === "remote";
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setPassword("");
    setEmail("");
    setShow(false);
    setError("");
  }, [staff]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const authenticated = await login(staff ? { email, password } : { password });
      location.hash = authenticated.role === "student"
        ? staff ? "/aula" : destination
        : "/panel";
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setPassword("");
      setShow(false);
      setBusy(false);
    }
  }
  if (session)
    return (
      <div className="container inner-page">
        <Intro eyebrow="TU ESPACIO EN EL CLUB" title="Ya has iniciado sesión." />
        <LinkButton href={session.role === "student" ? "#/aula" : "#/panel"}>Ir a mi espacio</LinkButton>
        {staff && session.role === "student" && <>
          <p>Para gestionar los materiales, cierra la sesión de alumno y accede con tu cuenta del club.</p>
          <button className="button button-secondary" onClick={async () => {
            try { await logout(); location.hash = "/acceso-equipo"; }
            catch (error) { setError((error as Error).message); }
          }}>Acceder con otra cuenta</button>
          <ErrorMessage>{error}</ErrorMessage>
        </>}
      </div>
    );
  return (
    <div className="container inner-page">
      <div className="login-layout">
        <div className="login-intro">
          <p className="eyebrow">{staff ? "ACCESO DEL EQUIPO" : "ÁREA DE ALUMNOS"}</p>
          <h1>{staff ? <>Tu espacio<br />para <span>enseñar.</span></> : <>
            Tu siguiente<br />jugada empieza<br /><span>aprendiendo.</span>
          </>}</h1>
          <p>{staff
            ? "Accede con tu cuenta del club para subir y organizar el temario, los ejercicios y los recursos."
            : "Todos los materiales de tus clases, en un mismo lugar. Accede con la contraseña que te ha facilitado el club."}</p>
          <div className="login-benefit">
            <BookOpen size={24} aria-hidden="true" />
            <span>Documentos y presentaciones<br /><strong>Temario, ejercicios y recursos</strong></span>
          </div>
        </div>
        <section className="login-card">
          <span className="login-lock"><LockKey size={26} aria-hidden="true" /></span>
          <h2>{staff ? "Profesores y administración" : "Bienvenido al aula"}</h2>
          <p>{staff ? "Introduce el correo y la contraseña de tu cuenta." : "Introduce la contraseña de las clases."}</p>
          <form onSubmit={submit}>
            {staff && <label>
              Correo electrónico
              <input required type="email" name="email" autoComplete="username"
                value={email} onChange={(event) => setEmail(event.target.value)} disabled={!available} />
            </label>}
            <label htmlFor="access-password">{staff ? "Contraseña" : "Contraseña de las clases"}</label>
            <div className="password-field">
              <input id="access-password" name="password" autoComplete="current-password"
                type={show ? "text" : "password"} value={password} disabled={!available}
                onChange={(event) => setPassword(event.target.value)} required aria-describedby="password-help" />
              <button type="button" className="icon-button" onClick={() => setShow(!show)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} disabled={!available}>
                {show ? <EyeSlash /> : <Eye />}
              </button>
            </div>
            <p className="field-help" id="password-help">{available
              ? staff ? "Utiliza tu cuenta personal del club." : "Si no tienes la contraseña, pídela a tu profesor."
              : "Estamos preparando el acceso privado. Todavía no es posible entrar; contacta con el club para más información."}</p>
            <ErrorMessage>{error}</ErrorMessage>
            <button className="button full-width" disabled={busy || !available} type="submit">
              {busy ? "Accediendo…" : "Entrar"}<ArrowRight aria-hidden="true" />
            </button>
          </form>
          <a className="login-help" href="/contacto">¿Necesitas ayuda? Contacta con el club</a>
          {staff && <a className="login-help" href="#/acceso">Volver al acceso de alumnos</a>}
        </section>
      </div>
    </div>
  );
}
export function FileIcon({ filename }: { filename: string }) {
  const extension = filename.split(".").pop()?.toLowerCase();
  return (
    <span
      className={`file-icon ${extension === "pdf" ? "pdf" : extension?.startsWith("ppt") ? "ppt" : ""}`}
      aria-hidden="true"
    >
      {extension === "pdf" ? (
        <FilePdf />
      ) : extension?.startsWith("ppt") ? (
        <FilePpt />
      ) : (
        <FileText />
      )}
    </span>
  );
}
export function Campus({ course }: { course?: Course }) {
  const { repository, session, logout, notify } = useClub();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [section, setSection] = useState<MaterialSection>("syllabus");
  const [downloading, setDownloading] = useState<string | null>(null);
  useEffect(() => {
    setQuery("");
    setTopic("all");
  }, [course, section]);
  useEffect(() => {
    let active = true;
    repository
      .materials()
      .then((value) => {
        if (active) setMaterials(value);
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
  async function download(material: Material) {
    setDownloading(material.id);
    try {
      const blob = await repository.download(material.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = material.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setDownloading(null);
    }
  }
  const courseFiles = materials.filter(
    (material) => material.course === course,
  );
  const sectionFiles = courseFiles.filter((material) => material.section === section);
  const group = (material: Material) => section === "exercises" ? material.block || "Sin bloque" : material.topic;
  const topics = [
    ...new Set(sectionFiles.map(group)),
  ].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  const results = sectionFiles.filter(
    (material) =>
      (topic === "all" || group(material) === topic) &&
      `${material.title} ${material.topic} ${material.block} ${material.filename}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  return (
    <div className="container inner-page">
      <div className="area-topline">
        <a className="text-link" href={course ? "#/aula" : "/escuela"}>
          <ArrowLeft aria-hidden="true" />
          {course ? "Todas las clases" : "Información de las clases"}
        </a>
        <div className="area-actions">
          {(session?.role === "teacher" || session?.role === "admin") && (
            <a className="text-link" href="#/panel">
              Panel de gestión <ArrowRight aria-hidden="true" />
            </a>
          )}
          <button
            className="text-link"
            onClick={() => logout().catch((error) => notify(error.message))}
          >
            Salir <SignOut aria-hidden="true" />
          </button>
        </div>
      </div>
      <Intro
        eyebrow="ÁREA DE ALUMNOS"
        title={
          course
            ? `Clases de ${courseNames[course].toLowerCase()}.`
            : "Siempre una jugada por descubrir."
        }
      >
        <p>
          {course
            ? "Repasa el temario, practica por bloques y consulta los recursos de tus clases."
            : "Elige un nivel y sigue aprendiendo. Tienes acceso a todos los materiales del club."}
        </p>
      </Intro>
      <DemoNotice />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : !course ? (
        <div className="course-grid campus-courses">
          {(["iniciacion", "avanzado"] as const).map((level) => (
            <a
              className={`course-card ${level === "avanzado" ? "course-advanced" : ""}`}
              href={`#/aula/${level}`}
              key={level}
            >
              <div className="course-icon">
                {level === "iniciacion" ? <BookOpen weight="duotone" aria-hidden="true" /> : <Strategy weight="duotone" aria-hidden="true" />}
              </div>
              <p className="eyebrow">{level === "iniciacion" ? "LOS PRIMEROS PASOS" : "TÁCTICA Y ESTRATEGIA"}</p>
              <h2>{courseNames[level]}</h2>
              <p>
                {level === "iniciacion"
                  ? "Todo empieza con el primer movimiento."
                  : "Nuevas ideas para seguir mejorando."}
              </p>
              <div className="course-card-bottom">
                <span>
                  {materials.filter((m) => m.course === level).length}{" "}
                  materiales
                </span>
                <span className="text-link">
                  Entrar al aula <ArrowRight aria-hidden="true" />
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <>
          <nav className="course-tabs" aria-label="Nivel de las clases">
            <a
              href="#/aula/iniciacion"
              aria-current={course === "iniciacion" ? "page" : undefined}
            >
              Iniciación
            </a>
            <a
              href="#/aula/avanzado"
              aria-current={course === "avanzado" ? "page" : undefined}
            >
              Avanzado
            </a>
          </nav>
          <div className="learning-sections" role="group" aria-label="Contenido del aula">
            {(["syllabus", "exercises", "resources"] as const).map((value) => {
              const Icon = value === "syllabus" ? BookOpen : value === "exercises" ? PuzzlePiece : Folder;
              return <button key={value} aria-pressed={section === value}
                className={section === value ? "selected" : ""}
                onClick={() => { setSection(value); setQuery(""); setTopic("all"); }}>
                <Icon size={28} aria-hidden="true" />
                <span><strong>{sectionNames[value]}</strong><small>{value === "syllabus" ? "Aprende paso a paso" : value === "exercises" ? "Practica por bloques" : "Amplía tus clases"}</small></span>
                <span className="section-count">{courseFiles.filter((m) => m.section === value).length}</span>
              </button>;
            })}
          </div>
          <h2 className="library-heading">{sectionNames[section]}</h2>
          <div className="library-toolbar">
            <label className="search-field">
              <span className="sr-only">Buscar materiales</span>
              <MagnifyingGlass aria-hidden="true" />
              <input
                type="search"
                placeholder={section === "exercises" ? "Buscar un ejercicio o bloque…" : "Buscar un material o un tema…"}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="topic-filter">
              <span className="sr-only">{section === "exercises" ? "Filtrar por bloque" : "Filtrar por tema"}</span>
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                <option value="all">{section === "exercises" ? "Todos los bloques" : "Todos los temas"}</option>
                {topics.map((topic) => (
                  <option key={topic}>{topic}</option>
                ))}
              </select>
            </label>
          </div>
          {!sectionFiles.length ? (
            <Empty
              icon={<Folder size={32} />}
              title={section === "exercises" ? "Tus próximos ejercicios, aquí" : section === "resources" ? "Tus próximos recursos, aquí" : "Tu próximo temario, aquí"}
            >
              {section === "exercises" ? "El profesor publicará ejercicios agrupados por bloques para practicar a tu ritmo." : "El profesor publicará los materiales de esta sección, organizados por temas."}
            </Empty>
          ) : !results.length ? (
            <Empty
              icon={<MagnifyingGlass size={32} />}
              title="No encontramos ese material"
            >
              Prueba con otra palabra o cambia el filtro.
            </Empty>
          ) : (
            <div className="topic-groups">
              {topics
                .filter((topic) => results.some((m) => group(m) === topic))
                .map((topic) => (
                  <section className="topic-group" key={topic}>
                    <h2>
                      <Folder size={24} aria-hidden="true" />
                      {topic}
                      <span>
                        {results.filter((m) => group(m) === topic).length}
                      </span>
                    </h2>
                    <div className="material-list">
                      {results
                        .filter((m) => group(m) === topic)
                        .map((material) => (
                          <article className="material-row" key={material.id}>
                            <FileIcon filename={material.filename} />
                            <div className="material-description">
                              <h3>{material.title}</h3>
                              <p>
                                {section === "exercises" && <>{material.topic} · </>}{material.filename}{" "}
                                <span>· {fileSize(material.size)}</span>
                              </p>
                            </div>
                            <button
                              className="download-button"
                              disabled={downloading === material.id}
                              onClick={() => download(material)}
                              aria-label={`Descargar ${material.title}`}
                            >
                              <DownloadSimple size={21} aria-hidden="true" />
                              <span>
                                {downloading === material.id
                                  ? "Descargando…"
                                  : "Descargar"}
                              </span>
                            </button>
                          </article>
                        ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </>
      )}
      <p className="campus-note">
        <GraduationCap size={20} aria-hidden="true" />
        Aprende a tu ritmo. Todos los alumnos pueden consultar ambos niveles.
      </p>
    </div>
  );
}
