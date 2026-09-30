import { useEffect, useState, type FormEvent } from "react";
import {
  Plus,
  Newspaper,
  PencilSimple,
  Trash,
  UploadSimple,
  Folder,
  CalendarBlank,
  ArrowLeft,
  SignOut,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useClub } from "./context";
import {
  Intro,
  DemoNotice,
  Modal,
  Empty,
  ErrorMessage,
  Loading,
} from "./components";
import { FileIcon } from "./PrivatePages";
import {
  courseNames,
  roleNames,
  sectionNames,
  type MaterialSection,
  type NewsArticle,
  type Material,
  type MaterialInput,
  type Tournament,
  type TournamentInput,
  type Course,
} from "./types";
import { acceptFiles, validateFile } from "./repository";
import { fileSize, formatDate } from "./data";
import { NewsForm } from "./NewsForm";
import { UsersPanel } from "./UsersPanel";

function MaterialForm({
  material,
  materials,
  done,
}: {
  material?: Material;
  materials: Material[];
  done: () => void;
}) {
  const { repository, notify } = useClub();
  const [data, setData] = useState<MaterialInput>(
    material ?? { title: "", topic: "", course: "iniciacion", section: "syllabus", block: "" },
  );
  const related = materials.filter((m) => m.course === data.course && m.section === data.section);
  const topics = [...new Set(related.map((m) => m.topic))];
  const blocks = [...new Set(related.map((m) => m.block).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  const [file, setFile] = useState<File>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  function choose(file?: File) {
    setError("");
    if (!file) return;
    try {
      validateFile(file);
      setFile(file);
      if (!data.title)
        setData({ ...data, title: file.name.replace(/\.[^.]+$/, "") });
    } catch (error) {
      setFile(undefined);
      setError((error as Error).message);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!file && !material) {
      setError("Selecciona un archivo antes de guardar.");
      return;
    }
    setBusy(true);
    try {
      await repository.saveMaterial(data, file, material?.id);
      notify(
        repository.mode === "demo"
          ? "Material guardado en este navegador."
          : "Material guardado.",
      );
      done();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="editor-form">
      <label>
        Título del material
        <input
          value={data.title}
          maxLength={160}
          required
          onChange={(event) => setData({ ...data, title: event.target.value })}
          name="title"
          autoFocus
        />
      </label>
      <label>
        Sección
        <select value={data.section} onChange={(event) => setData({ ...data, section: event.target.value as MaterialSection })}>
          <option value="syllabus">Temario</option>
          <option value="exercises">Ejercicios</option>
          <option value="resources">Recursos</option>
        </select>
      </label>
      {data.section === "exercises" && <><label>
        Bloque de ejercicios
        <input required maxLength={80} list="existing-blocks" value={data.block} aria-describedby="block-help"
          placeholder="Ej.: Bloque 1 · Jaque mate"
          onChange={(event) => setData({ ...data, block: event.target.value })} />
        <datalist id="existing-blocks">{blocks.map((block) => <option key={block} value={block} />)}</datalist>
      </label>
        <p className="field-help" id="block-help">Crea un bloque o elige uno existente para reunir sus ejercicios.</p>
      </>}
      <div className="form-columns">
        <label>
          Nivel
          <select
            value={data.course}
            onChange={(event) =>
              setData({ ...data, course: event.target.value as Course })
            }
          >
            <option value="iniciacion">Iniciación</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </label>
        <label>
          Tema
          <input
            list="existing-topics"
            value={data.topic}
            maxLength={80}
            required
            placeholder="Ej.: Finales de peones"
            onChange={(event) =>
              setData({ ...data, topic: event.target.value })
            }
          />
          <datalist id="existing-topics">
            {topics.map((topic) => (
              <option key={topic} value={topic} />
            ))}
          </datalist>
        </label>
      </div>
      <p className="field-help">
        Escribe un nuevo tema o utiliza uno existente para agrupar tus
        materiales.
      </p>
      <div
        className={`upload-zone ${dragging ? "dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          choose(event.dataTransfer.files[0]);
        }}
      >
        <UploadSimple size={32} aria-hidden="true" />
        <label htmlFor="material-file">
          {file
            ? file.name
            : material
              ? "Sustituir el archivo (opcional)"
              : "Selecciona o arrastra tu archivo"}
        </label>
        <input
          id="material-file"
          type="file"
          accept={acceptFiles}
          onChange={(event) => choose(event.target.files?.[0])}
        />
        <small>
          PDF, PPT, PPTX, DOC, DOCX, ODT, ODP, PGN, ZIP o TXT. Máximo 25 MB.
        </small>
        {material && !file && (
          <small>Archivo actual: {material.filename}</small>
        )}
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="form-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={done}
          disabled={busy}
        >
          Cancelar
        </button>
        <button className="button" type="submit" disabled={busy}>
          {busy
            ? "Guardando…"
            : material
              ? "Guardar cambios"
              : "Subir material"}
        </button>
      </div>
    </form>
  );
}
function TournamentForm({
  tournament,
  done,
}: {
  tournament?: Tournament;
  done: () => void;
}) {
  const { repository, notify } = useClub();
  const [data, setData] = useState<TournamentInput>(
    tournament ?? {
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      url: "",
    },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (key: keyof TournamentInput, value: string) =>
    setData({ ...data, [key]: value });
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await repository.saveTournament(data, tournament?.id);
      notify(
        repository.mode === "demo"
          ? "Torneo guardado en este navegador."
          : "Torneo publicado.",
      );
      done();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="editor-form" onSubmit={submit}>
      <label>
        Nombre del torneo
        <input
          name="title"
          value={data.title}
          maxLength={160}
          required
          autoFocus
          onChange={(event) => change("title", event.target.value)}
        />
      </label>
      <div className="form-columns">
        <label>
          Fecha
          <input
            type="date"
            name="date"
            value={data.date}
            required
            onChange={(event) => change("date", event.target.value)}
          />
        </label>
        <label>
          Hora (opcional)
          <input
            type="time"
            name="time"
            value={data.time}
            onChange={(event) => change("time", event.target.value)}
          />
        </label>
      </div>
      <label>
        Lugar
        <input
          name="location"
          required
          maxLength={200}
          value={data.location}
          onChange={(event) => change("location", event.target.value)}
        />
      </label>
      <label>
        Descripción
        <textarea
          rows={4}
          maxLength={3000}
          value={data.description}
          onChange={(event) => change("description", event.target.value)}
        />
      </label>
      <label>
        Enlace de información o inscripción (opcional)
        <input
          name="url"
          type="url"
          placeholder="https://…"
          value={data.url}
          onChange={(event) => change("url", event.target.value)}
        />
      </label>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="form-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={done}
          disabled={busy}
        >
          Cancelar
        </button>
        <button className="button" type="submit" disabled={busy}>
          {busy
            ? "Guardando…"
            : tournament
              ? "Guardar cambios"
              : "Publicar torneo"}
        </button>
      </div>
    </form>
  );
}
type Editor =
  | { type: "news"; item?: NewsArticle }
  | { type: "material"; item?: Material }
  | { type: "tournament"; item?: Tournament }
  | null;
export function Admin() {
  const { repository, session, logout, notify } = useClub();
  const [tab, setTab] = useState<"materials" | "tournaments" | "news" | "users">(
    "materials",
  );
  const [materials, setMaterials] = useState<Material[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [editor, setEditor] = useState<Editor>(null);
  const [deleting, setDeleting] = useState<{
    type: "material" | "tournament" | "news";
    id: string;
    title: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("all");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      repository.materials(),
      session?.role === "admin"
        ? repository.tournaments()
        : Promise.resolve([]),
      session?.role === "admin" ? repository.news() : Promise.resolve([]),
    ])
      .then(([materials, tournaments, news]) => {
        if (active) {
          setMaterials(materials);
          setTournaments(tournaments);
          setNews(news);
        }
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
  }, [repository, revision, session?.role]);
  function done() {
    setEditor(null);
    setRevision((n) => n + 1);
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError("");
    try {
      if (deleting.type === "material")
        await repository.deleteMaterial(deleting.id);
      else if (deleting.type === "news")
        await repository.deleteNews(deleting.id);
      else await repository.deleteTournament(deleting.id);
      setDeleting(null);
      setRevision((n) => n + 1);
      notify("Elemento eliminado.");
    } catch (error) {
      setDeleteError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = materials.filter(
    (m) =>
      (course === "all" || m.course === course) &&
      `${m.title} ${m.topic} ${m.block} ${sectionNames[m.section]}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  return (
    <div className="container inner-page">
      <div className="area-topline">
        <a className="text-link" href="#/aula">
          <ArrowLeft aria-hidden="true" />
          Ver área de alumnos
        </a>
        <button
          className="text-link"
          onClick={() => logout().catch((error) => notify(error.message))}
        >
          Cerrar sesión <SignOut aria-hidden="true" />
        </button>
      </div>
      <Intro
        eyebrow={`PANEL DE ${session ? roleNames[session.role].toUpperCase() : "GESTIÓN"}`}
        title="Todo listo para enseñar."
      >
        <p>
          {session?.role === "admin"
            ? "Gestiona los materiales, los torneos, las noticias y los usuarios del club."
            : "Sube, organiza y actualiza los materiales de tus clases."}
        </p>
      </Intro>
      <DemoNotice />
      <div className="panel-navigation">
        <div className="segmented" aria-label="Sección del panel">
          <button
            aria-pressed={tab === "materials"}
            className={tab === "materials" ? "selected" : ""}
            onClick={() => setTab("materials")}
          >
            <Folder aria-hidden="true" />
            Materiales
          </button>
          {session?.role === "admin" && (
            <button
              aria-pressed={tab === "tournaments"}
              className={tab === "tournaments" ? "selected" : ""}
              onClick={() => setTab("tournaments")}
            >
              <CalendarBlank aria-hidden="true" />
              Torneos
            </button>
          )}
          {session?.role === "admin" && (
            <button
              aria-pressed={tab === "news"}
              className={tab === "news" ? "selected" : ""}
              onClick={() => setTab("news")}
            >
              <Newspaper aria-hidden="true" />
              Noticias
            </button>
          )}
          {session?.role === "admin" && <button aria-pressed={tab === 'users'} className={tab === 'users' ? 'selected' : ''} onClick={() => setTab('users')}>Usuarios</button>}
        </div>
        {tab !== 'users' && <button
          className="button"
          onClick={() =>
            setEditor({
              type:
                tab === "materials"
                  ? "material"
                  : tab === "news"
                    ? "news"
                    : "tournament",
            })
          }
        >
          <Plus aria-hidden="true" />
          {tab === "materials"
            ? "Subir material"
            : tab === "news"
              ? "Nueva noticia"
              : "Nuevo torneo"}
        </button>}
      </div>
      {tab === 'users' && session?.role === 'admin' ? <UsersPanel /> : loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : tab === "materials" ? (
        <>
          <div className="library-toolbar">
            <label className="search-field">
              <span className="sr-only">Buscar materiales</span>
              <MagnifyingGlass aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar por título o tema…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="topic-filter">
              <span className="sr-only">Filtrar por nivel</span>
              <select
                value={course}
                onChange={(event) => setCourse(event.target.value)}
              >
                <option value="all">Todos los niveles</option>
                <option value="iniciacion">Iniciación</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </label>
          </div>
          {!filtered.length ? (
            <Empty
              icon={<Folder size={32} />}
              title={
                materials.length
                  ? "Sin resultados"
                  : "Tu biblioteca empieza aquí"
              }
            >
              {materials.length
                ? "Prueba con otra búsqueda o cambia el nivel."
                : "Pulsa «Subir material», selecciona un nivel y escribe un tema. Los alumnos encontrarán aquí tus archivos."}
            </Empty>
          ) : (
            <div className="management-list">
              {filtered.map((material) => (
                <article className="material-row" key={material.id}>
                  <FileIcon filename={material.filename} />
                  <div className="material-description">
                    <h3>{material.title}</h3>
                    <p>
                      {courseNames[material.course]} · {sectionNames[material.section]} · {material.topic}
                      {material.section === "exercises" && <> · {material.block || "Sin bloque"}</>}
                    </p>
                    <small>
                      {material.filename} ({fileSize(material.size)})
                    </small>
                  </div>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar ${material.title}`}
                      onClick={() =>
                        setEditor({ type: "material", item: material })
                      }
                    >
                      <PencilSimple />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`Eliminar ${material.title}`}
                      onClick={() => {
                        setDeleteError("");
                        setDeleting({
                          type: "material",
                          id: material.id,
                          title: material.title,
                        });
                      }}
                    >
                      <Trash />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : tab === "news" ? (
        !news.length ? (
          <Empty
            icon={<Newspaper size={32} />}
            title="Las noticias empiezan aquí"
          >
            Crea una noticia y acompáñala con la foto que prefieras.
          </Empty>
        ) : (
          <div className="management-list">
            {[...news]
              .sort(
                (a, b) =>
                  b.date.localeCompare(a.date) ||
                  b.updatedAt.localeCompare(a.updatedAt),
              )
              .map((article) => (
                <article className="material-row" key={article.id}>
                  {article.imageUrl ? (
                    <img
                      className="news-admin-thumb"
                      src={article.imageUrl}
                      alt=""
                    />
                  ) : (
                    <span className="file-icon">
                      <Newspaper />
                    </span>
                  )}
                  <div className="material-description">
                    <h3>{article.title}</h3>
                    <p>{formatDate(article.date)}</p>
                    <a
                      className="text-link"
                      href={`#/noticias/${encodeURIComponent(article.id)}`}
                    >
                      Ver noticia
                    </a>
                  </div>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar ${article.title}`}
                      onClick={() => setEditor({ type: "news", item: article })}
                    >
                      <PencilSimple />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`Eliminar ${article.title}`}
                      onClick={() => {
                        setDeleteError("");
                        setDeleting({
                          type: "news",
                          id: article.id,
                          title: article.title,
                        });
                      }}
                    >
                      <Trash />
                    </button>
                  </div>
                </article>
              ))}
          </div>
        )
      ) : !tournaments.length ? (
        <Empty
          icon={<CalendarBlank size={32} />}
          title="Un calendario por estrenar"
        >
          Crea el primer torneo con su fecha, lugar y enlace de inscripción.
        </Empty>
      ) : (
        <div className="management-list">
          {[...tournaments]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((tournament) => (
              <article className="material-row" key={tournament.id}>
                <span className="file-icon">
                  <CalendarBlank />
                </span>
                <div className="material-description">
                  <h3>{tournament.title}</h3>
                  <p>
                    {formatDate(tournament.date)} · {tournament.location}
                  </p>
                </div>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Editar ${tournament.title}`}
                    onClick={() =>
                      setEditor({ type: "tournament", item: tournament })
                    }
                  >
                    <PencilSimple />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`Eliminar ${tournament.title}`}
                    onClick={() => {
                      setDeleteError("");
                      setDeleting({
                        type: "tournament",
                        id: tournament.id,
                        title: tournament.title,
                      });
                    }}
                  >
                    <Trash />
                  </button>
                </div>
              </article>
            ))}
        </div>
      )}
      {editor && (
        <Modal
          title={
            editor.type === "news"
              ? editor.item
                ? "Editar noticia"
                : "Nueva noticia"
              : editor.type === "material"
                ? editor.item
                  ? "Editar material"
                  : "Subir material"
                : editor.item
                  ? "Editar torneo"
                  : "Nuevo torneo"
          }
          close={() => setEditor(null)}
        >
          {editor.type === "material" ? (
            <MaterialForm
              material={editor.item}
              materials={materials}
              done={done}
            />
          ) : editor.type === "news" ? (
            <NewsForm article={editor.item} done={done} />
          ) : (
            <TournamentForm tournament={editor.item} done={done} />
          )}
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Confirmar eliminación"
          close={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p>
            Vas a eliminar <strong>{deleting.title}</strong>. Esta acción no se
            puede deshacer.
          </p>
          <ErrorMessage>{deleteError}</ErrorMessage>
          <div className="form-actions">
            <button
              className="button button-secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancelar
            </button>
            <button
              className="button button-danger"
              disabled={busy}
              onClick={remove}
            >
              {busy ? "Eliminando…" : "Eliminar definitivamente"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
