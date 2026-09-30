import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type { Repository, Session, Credentials } from "./types";
import { sessionExpiredEvent } from "./security";

type ClubContext = {
  repository: Repository;
  session: Session | null;
  ready: boolean;
  login: (credentials: Credentials) => Promise<Session>;
  logout: () => Promise<void>;
  notify: (message: string) => void;
};
const Context = createContext<ClubContext | null>(null);
export function Provider({
  repository,
  children,
}: {
  repository: Repository;
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const revision = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      const current = ++revision.current;
      repository.session().then((value) => {
        if (active && current === revision.current) setSession(value);
      }).catch((error) => {
        if (active && current === revision.current) {
          setSession(null);
          setMessage(error.message);
        }
      }).finally(() => { if (active) setReady(true); });
    };
    const expire = () => { revision.current++; setSession(null); };
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    window.addEventListener(sessionExpiredEvent, expire);
    window.addEventListener('focus', refresh);
    window.addEventListener('hashchange', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', visible);
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('palentino-session-changes');
      channel.current.onmessage = refresh;
    }
    return () => {
      active = false;
      window.removeEventListener(sessionExpiredEvent, expire);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('hashchange', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', visible);
      channel.current?.close();
      channel.current = null;
    };
  }, [repository]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 7000);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <Context.Provider
      value={{
        repository,
        session,
        ready,
        notify: setMessage,
        login: async (credentials) => {
          revision.current++;
          const value = await repository.login(credentials);
          revision.current++;
          setSession(value);
          channel.current?.postMessage('changed');
          return value;
        },
        logout: async () => {
          await repository.logout();
          revision.current++;
          setSession(null);
          channel.current?.postMessage('changed');
          location.hash = "/acceso";
        },
      }}
    >
      {children}
      <div
        className={`toast ${message ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </Context.Provider>
  );
}
export function useClub() {
  const context = useContext(Context);
  if (!context) throw new Error("Falta el contexto del club.");
  return context;
}
