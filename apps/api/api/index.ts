// Vercel serverless entrypoint. A rewrite in vercel.json sends every
// request that doesn't match a file under /api/* here; Vercel invokes an
// Express app directly as a (req, res) handler, so no adapter is needed.
export { app as default } from "../src/app.js";
