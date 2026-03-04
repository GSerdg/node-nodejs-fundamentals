import {
  appendFile,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

async function isDirExists(path) {
  try {
    const stats = await stat(path);

    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}

function getArgValue(flag) {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);

  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith('--')) {
    return args[index + 1];
  }
  return null;
}

const merge = async () => {
  const BASE_PATH = join("./home/user/workspace");
  const PARTS_PATH = join(BASE_PATH, "parts");
  const argument = getArgValue('--files');

  if (!(await isDirExists(PARTS_PATH))) {
    throw new Error("FS operation failed");
  }

  const files = await readdir(PARTS_PATH);
  let resultFileList;

  if (argument) {
    const fileList = argument.split(",");

    fileList.forEach((fileName) => {
      if (!files.includes(fileName)) {
        throw new Error("FS operation failed");
      }

      resultFileList = fileList;
    });
  } else {
    resultFileList = files
      .filter((fileName) => fileName.split('.').includes("txt"))
      .sort((a, b) => a.localeCompare(b));

    if (resultFileList.length === 0) {
      throw new Error("FS operation failed");
    }
  }

  await writeFile(join(BASE_PATH, "merged.txt"), "");

  for (const file of resultFileList) {
    const fileData = await readFile(join(PARTS_PATH, file));
    await appendFile(join(BASE_PATH, "merged.txt"), fileData);
  }
};

await merge();
