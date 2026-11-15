import { cpSync, createReadStream, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import type { Plugin } from "vite";

const TYPES: Record<string, string> = {
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
};

/** Serves the pipeline's data/ folder at /data in development, and copies it into the build when COPY_DATA=1. */
export function atlasData(root: string): Plugin {
  const dataDir = join(root, "data");
  let outDir = "";
  return {
    name: "atlas-data",
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url ?? "").split("?")[0]);
        const match = /\/data\/(.+)$/.exec(path);
        if (!match) return next();
        const file = normalize(join(dataDir, match[1]));
        if (!file.startsWith(dataDir + sep)) return next();
        try {
          if (!statSync(file).isFile()) return next();
        } catch {
          return next();
        }
        res.setHeader(
          "Content-Type",
          TYPES[extname(file)] ?? "application/octet-stream",
        );
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      if (process.env.COPY_DATA === "1")
        cpSync(dataDir, join(outDir, "data"), { recursive: true });
    },
  };
}
