// Persistent-host entrypoint (local dev, or Railway/Render/Fly). Not used
// on Vercel — see api/index.ts for the serverless entrypoint, which
// exports the same app without calling listen().
import { app } from "./app.js";

const port = Number(process.env.API_PORT ?? 4000);
app.listen(port, () => console.log(`hpas api listening on :${port}`));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on("unhandledRejection", (err: any) => console.error("unhandledRejection", err));
