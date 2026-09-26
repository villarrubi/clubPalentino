import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Newspaper } from "@phosphor-icons/react";
import { useClub } from "./context";
import { Empty, ErrorMessage, Intro, LinkButton, Loading } from "./components";
import { formatDate } from "./data";
import type { NewsArticle } from "./types";

function useNews() {
  const { repository } = useClub();
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    repository
      .news()
      .then((items) => {
        if (active)
          setItems(
            [...items].sort(
              (a, b) =>
                b.date.localeCompare(a.date) ||
                b.updatedAt.localeCompare(a.updatedAt),
            ),
          );
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
  return { items, loading, error };
}

export function NewsList({ short = false }: { short?: boolean }) {
  const { items, loading, error } = useNews();
  if (loading) return <Loading />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!items.length)
    return (
      <Empty icon={<Newspaper size={32} />} title="Pronto tendremos novedades">
        Aquí compartiremos las noticias y los encuentros del club.
      </Empty>
    );
  return (
    <div className="news-list">
      {(short ? items.slice(0, 1) : items).map((article) => (
        <article
          className={`news-feature ${!article.imageUrl ? "news-text-only" : ""}`}
          key={article.id}
        >
          {article.imageUrl && (
            <a
              className="news-photo"
              href={`#/noticias/${encodeURIComponent(article.id)}`}
              tabIndex={-1}
              aria-hidden="true"
            >
              <img src={article.imageUrl} alt="" loading="lazy" />
            </a>
          )}
          <div className="news-copy">
            <div className="meta">
              <span className="tag">
                {article.source || "Actualidad del club"}
              </span>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
            </div>
            <h3>
              <a href={`#/noticias/${encodeURIComponent(article.id)}`}>
                {article.title}
              </a>
            </h3>
            <p>{article.summary}</p>
            <a
              className="text-link"
              href={`#/noticias/${encodeURIComponent(article.id)}`}
            >
              Leer noticia <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

export function NewsDetail({ id }: { id: string }) {
  const { items, loading, error } = useNews();
  const article = items.find((item) => encodeURIComponent(item.id) === id);
  useEffect(() => {
    if (article)
      document.title = `${article.title} | Club Palentino de Ajedrez`;
  }, [article]);
  return (
    <div className="container inner-page news-detail">
      <a className="text-link news-back" href="#/noticias">
        Volver a noticias
      </a>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : !article ? (
        <>
          <Intro
            eyebrow="NOTICIAS"
            title="Esta noticia ya no está disponible."
          />
          <LinkButton href="#/noticias">Ver noticias</LinkButton>
        </>
      ) : (
        <article>
          <Intro eyebrow="ACTUALIDAD DEL CLUB" title={article.title}>
            <p>{article.summary}</p>
          </Intro>
          <p className="meta">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            {article.source && <span>{article.source}</span>}
          </p>
          {article.imageUrl && (
            <img
              className="news-detail-photo"
              src={article.imageUrl}
              alt={article.imageAlt}
            />
          )}
          <div className="news-body preserve-lines">{article.content}</div>
          {article.url && (
            <a
              className="text-link"
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {article.source ? `Leer en ${article.source}` : "Más información"}
              <ArrowUpRight aria-hidden="true" />
            </a>
          )}
        </article>
      )}
    </div>
  );
}
