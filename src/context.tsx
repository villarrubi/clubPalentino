import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Repository, Session, Credentials } from "./types";

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
  useEffect(() => {
    let active = true;
    repository
      .session()
      .then((value) => {
        if (active) setSession(value);
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
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
          const value = await repository.login(credentials);
          setSession(value);
          return value;
        },
        logout: async () => {
          await repository.logout();
          setSession(null);
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
