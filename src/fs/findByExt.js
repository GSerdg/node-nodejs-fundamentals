import { join, dirname, relative, extname, sep } from "node:path";
import { readdir } from "node:fs/promises";

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const findByExt = async () => {
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

  const extArgument = `.${process.argv.at(-1)}`;

  const searchFiles = async (path) => {
    const currentPath = join(BASE_PATH, path);
    const elements = await readdir(currentPath, { withFileTypes: true });

    if (elements.length === 0) return [];

    const searchFilePaths = [];

    for (const element of elements) {
      if (element.isFile() && extname(element.name) === extArgument) {
        const filePath = join(element.parentPath, element.name);
        const relativePath = relative(__dirname, filePath);

        searchFilePaths.push(relativePath);
      }

      if (element.isDirectory()) {
        searchFilePaths.push(...(await searchFiles(join(path, element.name))));
      }
    }

    return searchFilePaths;
  };

  const pathsList = await searchFiles("workspace");

  pathsList
    .sort((a, b) => {
      const depthA = a.split(sep).length;
      const depthB = b.split(sep).length;

      if (depthA !== depthB) {
        return depthA - depthB;
      }

      return a.localeCompare(b);
    })
    .map((item) => console.log(item));
};

await findByExt();
