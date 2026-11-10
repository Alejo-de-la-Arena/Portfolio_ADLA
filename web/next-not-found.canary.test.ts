import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { cp, mkdtemp, rm, symlink } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { dictionary as d } from "./content/dictionary";

// Opt in with NEXT_NOT_FOUND_CANARY=1. Expected to fail until #100596 is fixed.
it.skipIf(process.env.NEXT_NOT_FOUND_CANARY !== "1")("Next without Proxy returns a complete localized 404", async () => {
  const source = fileURLToPath(new URL(".", import.meta.url));
  const fixture = await mkdtemp(join(tmpdir(), "portfolio-next-canary-"));
  let server: ChildProcess | undefined;
  let output = "";
  const run = (args: string[]) => {
    const child = spawn(process.execPath, [join(source, "node_modules/next/dist/bin/next"), ...args], {
      cwd: fixture, windowsHide: true, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"], timeout: 180_000,
    });
    child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    return child;
  };
  try {
    for (const name of ["app", "components", "content", "lib", "public", "package.json", "tsconfig.json", "next-env.d.ts", "next.config.ts", "postcss.config.mjs"]) {
      await cp(join(source, name), join(fixture, name), { recursive: true });
    }
    await symlink(join(source, "node_modules"), join(fixture, "node_modules"), "junction");
    const build = run(["build", "--webpack"]);
    const [code] = await once(build, "exit");
    expect(code, output).toBe(0);
    const socket = createServer();
    socket.listen(0, "127.0.0.1");
    await once(socket, "listening");
    const address = socket.address();
    if (!address || typeof address === "string") throw new Error("Missing canary port");
    const port = address.port;
    await new Promise<void>((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
    server = run(["start", "--hostname", "127.0.0.1", "--port", String(port)]);
    const base = "http://127.0.0.1:" + port;
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(output);
      try { ready = (await fetch(base + "/es")).ok; } catch { /* Wait for startup. */ }
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    expect(ready, output).toBe(true);
    for (const locale of ["es", "en"] as const) {
      const response = await fetch(base + "/" + locale + "/work/no-existe");
      expect.soft(response.status, locale + " HTTP status").toBe(404);
      const html = await response.text();
      expect.soft(html.match(/<html[^>]*>/)?.[0], locale + " root lang").toContain('lang="' + locale + '"');
      const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? "";
      const visibleText = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]*>/g, "");
      expect.soft(visibleText, locale + " visible translation").toContain(d.notFoundTitle[locale]);
      expect.soft(html.match(/<meta[^>]*name="robots"[^>]*>/)?.[0], locale + " robots").toContain("noindex");
    }
  } finally {
    if (server && server.exitCode === null) {
      const exited = once(server, "exit");
      server.kill();
      await exited;
    }
    await rm(fixture, { recursive: true, force: true });
  }
}, 240_000);
