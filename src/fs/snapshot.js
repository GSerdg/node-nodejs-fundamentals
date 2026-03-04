import { readdir, writeFile, stat, readFile } from "node:fs/promises";
import { join } from "node:path";

const snapshot = async () => {
  const BASE_PATH = join("./home/user");

  const userDir = await readdir(BASE_PATH, { withFileTypes: true });
  let haveWorkspace = false;

  for (const dirent of userDir) {
    if (dirent.isDirectory() && dirent.name === "workspace") {
      haveWorkspace = true;
      break;
    }
  }

  if (!haveWorkspace) {
    throw new Error("FS operation failed");
  }

  const snapshotObject = {
    rootPath: join(BASE_PATH, "workspace"),
    entries: [],
  };

  const searchFiles = async (path, snapshots) => {
    const currentPath = join(BASE_PATH, path);
    const elements = await readdir(currentPath, { withFileTypes: true });

    if (elements.length === 0) return;
    
    for (const element of elements) {
      if (element.isFile()) {
        const filePath = join(element.parentPath, element.name);

        const fileStats = await stat(filePath);
        const fileContent = await readFile(filePath);

        snapshots.entries.push({
          path: join(
            element.parentPath.replace(snapshots.rootPath, ""),
            element.name,
          ).replaceAll("\\", "/"),
          type: "file",
          size: fileStats.size,
          content: Buffer.from(fileContent).toString("base64"),
        });
      }

      if (element.isDirectory()) {
        snapshots.entries.push({
          path: join(
            element.parentPath.replace(snapshots.rootPath, ""),
            element.name,
          ).replaceAll("\\", "/"),
          type: "directory",
        });

        await searchFiles(join(path, element.name), snapshots);
      }
    }

    return snapshots;
  };

  const snapshotObjectResult = await searchFiles("workspace", snapshotObject);
  snapshotObjectResult.rootPath = snapshotObjectResult.rootPath.replaceAll(
    "\\",
    "/",
  );

  await writeFile(
    join(BASE_PATH, "snapshot.json"),
    JSON.stringify(snapshotObjectResult, null, 2),
  );
};

await snapshot();
