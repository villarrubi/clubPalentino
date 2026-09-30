import { openStore } from './store.mjs';
import { createApp } from './app.mjs';

process.umask(0o077);
const production = process.env.NODE_ENV !== 'development';
const db = openStore();
const app = createApp({ db, production, origin: process.env.APP_ORIGIN || (production ? '' : 'http://127.0.0.1:3000'),
  trustProxy: process.env.TRUST_PROXY === '1' ? 1 : false });
const server = app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log('Servicio del club iniciado.'));
server.requestTimeout = 60000;
server.headersTimeout = 15000;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(() => { db.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
});
