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
  Horse as Chess,
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
import { courseNames, type Course, type Material, type Role } from "./types";
import { fileSize } from "./data";

export function Login({ destination = "/aula" }: { destination?: string }) {
  const { login, repository, session } = useClub();
  const [role, setRole] = useState<Role>("student");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(role, password, email);
      location.hash =
        role === "student"
          ? destination === "/panel"
            ? "/aula"
            : destination
          : "/panel";
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (session)
    return (
      <div className="container inner-page">
        <Intro
          eyebrow="TU ESPACIO EN EL CLUB"
          title="Ya has iniciado sesión."
        />
        <LinkButton href="#/aula">Ir a las clases</LinkButton>
      </div>
    );
  return (
    <div className="container inner-page">
      <div className="login-layout">
        <div className="login-intro">
          <p className="eyebrow">ÁREA DE ALUMNOS</p>
          <h1>
            Tu siguiente
            <br />
            jugada empieza
            <br />
            <span>aprendiendo.</span>
          </h1>
          <p>
            Todos los materiales de tus clases, en un mismo lugar. Accede a
            iniciación y avanzado y repasa a tu ritmo.
          </p>
          <div className="login-benefit">
            <BookOpen size={24} aria-hidden="true" />
            <span>
              Documentos y presentaciones
              <br />
              <strong>Organizados por temas</strong>
            </span>
          </div>
        </div>
        <section className="login-card">
          <span className="login-lock">
            <LockKey size={26} aria-hidden="true" />
          </span>
          <h2>Bienvenido al club</h2>
          <p>Entra a tu espacio de clases.</p>
          <div className="segmented login-roles" aria-label="Tipo de acceso">
            {(
              [
                ["student", "Alumnado"],
                ["teacher", "Profesor"],
                ["admin", "Admin"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                aria-pressed={role === value}
                className={role === value ? "selected" : ""}
                onClick={() => {
                  setRole(value);
                  setError("");
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            {role !== "student" && repository.mode === "remote" && (
              <label>
                Correo electrónico
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            )}
            <label htmlFor="access-password">
              {role === "student" ? "Contraseña de las clases" : "Contraseña"}
            </label>
            <div className="password-field">
              <input
                id="access-password"
                name="password"
                autoComplete="current-password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                aria-describedby="password-help"
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show ? <EyeSlash /> : <Eye />}
              </button>
            </div>
            <p className="field-help" id="password-help">
              {repository.mode === "demo" ? (
                <>
                  Para probar cualquier perfil, utiliza{" "}
                  <strong>palentino</strong>.
                </>
              ) : role === "student" ? (
                "Utiliza la contraseña que te ha facilitado el club."
              ) : (
                "Accede con tu cuenta del club."
              )}
            </p>
            <ErrorMessage>{error}</ErrorMessage>
            <button className="button full-width" disabled={busy} type="submit">
              {busy ? "Accediendo…" : "Entrar"}
              <ArrowRight aria-hidden="true" />
            </button>
          </form>
          <a className="login-help" href="#/contacto">
            ¿Necesitas ayuda? Contacta con el club
          </a>
        </section>
      </div>
      <DemoNotice />
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
  const [downloading, setDownloading] = useState<string | null>(null);
  useEffect(() => {
    setQuery("");
    setTopic("all");
  }, [course]);
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
  const topics = [
    ...new Set(courseFiles.map((material) => material.topic)),
  ].sort((a, b) => a.localeCompare(b, "es"));
  const results = courseFiles.filter(
    (material) =>
      (topic === "all" || material.topic === topic) &&
      `${material.title} ${material.topic} ${material.filename}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  return (
    <div className="container inner-page">
      <div className="area-topline">
        <a className="text-link" href={course ? "#/aula" : "#/escuela"}>
          <ArrowLeft aria-hidden="true" />
          {course ? "Todas las clases" : "Información de las clases"}
        </a>
        <div className="area-actions">
          {session?.role !== "student" && (
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
            ? "Encuentra tus documentos y presentaciones, organizados por temas."
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
                <Chess weight={level === "avanzado" ? "fill" : "regular"} />
              </div>
              <p className="eyebrow">CLASES</p>
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
                  Ver temas <ArrowRight aria-hidden="true" />
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
          <div className="library-toolbar">
            <label className="search-field">
              <span className="sr-only">Buscar materiales</span>
              <MagnifyingGlass aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar un material o un tema…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="topic-filter">
              <span className="sr-only">Filtrar por tema</span>
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                <option value="all">Todos los temas</option>
                {topics.map((topic) => (
                  <option key={topic}>{topic}</option>
                ))}
              </select>
            </label>
          </div>
          {!courseFiles.length ? (
            <Empty
              icon={<Folder size={32} />}
              title="Tus próximos materiales, aquí"
            >
              El profesor publicará los documentos de este nivel, agrupados por
              temas. Vuelve pronto para descubrirlos.
            </Empty>
          ) : !results.length ? (
            <Empty
              icon={<MagnifyingGlass size={32} />}
              title="No encontramos ese material"
            >
              Prueba con otra palabra o selecciona todos los temas.
            </Empty>
          ) : (
            <div className="topic-groups">
              {topics
                .filter((topic) => results.some((m) => m.topic === topic))
                .map((topic) => (
                  <section className="topic-group" key={topic}>
                    <h2>
                      <Folder size={24} aria-hidden="true" />
                      {topic}
                      <span>
                        {results.filter((m) => m.topic === topic).length}
                      </span>
                    </h2>
                    <div className="material-list">
                      {results
                        .filter((m) => m.topic === topic)
                        .map((material) => (
                          <article className="material-row" key={material.id}>
                            <FileIcon filename={material.filename} />
                            <div className="material-description">
                              <h3>{material.title}</h3>
                              <p>
                                {material.filename}{" "}
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
