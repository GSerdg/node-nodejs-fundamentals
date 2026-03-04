import { readFile, mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const restore = async () => {
  const BASE_JSON_PATH = join("./home/user");
  const CURRENT_PATH = join(BASE_JSON_PATH, "workspace_restored");

  const snapshotJson = await readFile(
    join(BASE_JSON_PATH, "snapshot.json"),
  ).catch((err) => {
    if (err.code === "ENOENT") {
      throw new Error("FS operation failed: snapshot.json not exist");
    }

    throw err;
  });
  const snapshot = JSON.parse(snapshotJson);

  const entriesDir = snapshot?.entries?.filter(
    (entry) => entry.type === "directory",
  );
  const entriesFile = snapshot?.entries?.filter(
    (entry) => entry.type === "file",
  );

  for (const item of entriesDir) {
    await mkdir(join(CURRENT_PATH, item.path), { recursive: true });
  }

  for (const item of entriesFile) {
    await writeFile(
      join(CURRENT_PATH, item.path),
      Buffer.from(item.content, "base64").toString("utf-8"),
      { flag: "wx" },
    ).catch((err) => {
      if (err.code === "EEXIST") {
        throw new Error("FS operation failed: file exist");
      }

      throw err;
    });
  }
};

await restore();
