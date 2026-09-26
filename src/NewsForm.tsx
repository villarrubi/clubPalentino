import { useRef, useState, type FormEvent } from "react";
import { useClub } from "./context";
import { ErrorMessage } from "./components";
import { today } from "./data";
import { acceptNewsImages, readNewsImage } from "./newsValidation";
import type { NewsArticle, NewsInput } from "./types";

export function NewsForm({
  article,
  done,
}: {
  article?: NewsArticle;
  done: () => void;
}) {
  const { repository, notify } = useClub();
  const [data, setData] = useState<NewsInput>({
    title: article?.title ?? "",
    date: article?.date ?? today(),
    summary: article?.summary ?? "",
    content: article?.content ?? "",
    imageAlt: article?.imageAlt ?? "",
    source: article?.source ?? "",
    url: article?.url ?? "",
  });
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState(article?.imageUrl ?? "");
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const selection = useRef(0);
  const change = (key: keyof NewsInput, value: string) =>
    setData((previous) => ({ ...previous, [key]: value }));
  async function choose(image?: File) {
    if (!image) return;
    const current = ++selection.current;
    setReading(true);
    setImageError("");
    setFile(undefined);
    setPreview(article?.imageUrl ?? "");
    try {
      const url = await readNewsImage(image);
      if (current !== selection.current) return;
      setFile(image);
      setPreview(url);
    } catch (error) {
      if (current === selection.current)
        setImageError((error as Error).message);
    } finally {
      if (current === selection.current) setReading(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (reading || imageError || busy) return;
    setError("");
    setBusy(true);
    try {
      await repository.saveNews(data, file, article?.id);
      notify(
        repository.mode === "demo"
          ? "Noticia guardada en este navegador."
          : "Noticia publicada.",
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
        Título de la noticia
        <input
          autoFocus
          required
          maxLength={160}
          value={data.title}
          onChange={(e) => change("title", e.target.value)}
        />
      </label>
      <label>
        Fecha de publicación
        <input
          type="date"
          required
          value={data.date}
          onChange={(e) => change("date", e.target.value)}
        />
      </label>
      <label>
        Resumen
        <textarea
          rows={3}
          required
          maxLength={300}
          value={data.summary}
          onChange={(e) => change("summary", e.target.value)}
        />
      </label>
      <label>
        Texto de la noticia
        <textarea
          rows={7}
          required
          maxLength={20000}
          value={data.content}
          onChange={(e) => change("content", e.target.value)}
        />
      </label>
      <label>
        Foto de la noticia
        <input
          type="file"
          accept={acceptNewsImages}
          disabled={busy}
          onChange={(e) => void choose(e.target.files?.[0])}
          aria-describedby="news-image-help"
        />
      </label>
      <p id="news-image-help" className="field-help">
        JPG, PNG o WebP, hasta 5 MB.{" "}
        {article?.imageUrl
          ? "Si no eliges otra foto, se conserva la actual."
          : "Puedes publicar con o sin foto."}
      </p>
      {reading && <p role="status">Preparando foto…</p>}
      <ErrorMessage>{imageError}</ErrorMessage>
      {preview && (
        <img
          className="news-image-preview"
          src={preview}
          alt="Vista previa de la foto seleccionada"
        />
      )}
      {preview && (
        <>
          <label>
            Descripción de la foto
            <input
              required
              maxLength={200}
              value={data.imageAlt}
              aria-describedby="news-alt-help"
              onChange={(e) => change("imageAlt", e.target.value)}
            />
          </label>
          <p className="field-help" id="news-alt-help">
            Describe lo que aparece para quienes usan un lector de pantalla.
          </p>
        </>
      )}
      <div className="form-columns">
        <label>
          Fuente (opcional)
          <input
            maxLength={100}
            value={data.source}
            onChange={(e) => change("source", e.target.value)}
          />
        </label>
        <label>
          Enlace externo (opcional)
          <input
            type="url"
            placeholder="https://"
            value={data.url}
            onChange={(e) => change("url", e.target.value)}
          />
        </label>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="form-actions">
        <button
          className="button button-secondary"
          type="button"
          disabled={busy}
          onClick={done}
        >
          Cancelar
        </button>
        <button
          className="button"
          type="submit"
          disabled={busy || reading || !!imageError}
        >
          {busy
            ? "Guardando…"
            : article
              ? "Guardar cambios"
              : "Publicar noticia"}
        </button>
      </div>
    </form>
  );
}
