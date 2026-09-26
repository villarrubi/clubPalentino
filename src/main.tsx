import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/outfit";
import "@fontsource-variable/dm-sans";
import "./styles.css";
import App from "./App";
import { Provider } from "./context";
import { createRepository } from "./repository";

const root = createRoot(document.getElementById("root")!);
createRepository()
  .then((repository) =>
    root.render(
      <StrictMode>
        <Provider repository={repository}>
          <App />
        </Provider>
      </StrictMode>,
    ),
  )
  .catch((error) => {
    root.render(
      <main className="container inner-page">
        <h1>No hemos podido abrir la web.</h1>
        <p>{error.message}</p>
        <button className="button" onClick={() => location.reload()}>
          Volver a intentar
        </button>
      </main>,
    );
  });
