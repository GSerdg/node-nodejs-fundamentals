import { createReadStream } from "node:fs";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { argv } from "node:process";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getArgValue(flag) {
  const args = argv.slice(2);
  const index = args.indexOf(flag);

  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith("--")) {
    return args[index + 1];
  }
  return null;
}

const split = async () => {
  const arg = getArgValue("--lines");
  if (!/^[1-9]\d*$/.test(arg)) throw new Error("invalid param --lines");

  await rm(join(__dirname, "chunks"), { recursive: true });

  const countArg = +arg;
  let buffer = "";

  const transform = new Transform({
    transform(chunk, _, callback) {
      buffer += chunk.toString();

      const lines = buffer.split("\n");

      for (let i = 0; i < lines.length; i += countArg) {
        const chunkLines = lines.slice(i, i + countArg);
        const isLastIteration = i + countArg >= lines.length;

        if (isLastIteration) {
          buffer = chunkLines.join("\n");
        } else {
          this.push(chunkLines.join("\n"));
        }
      }

      callback();
    },

    flush(callback) {
      if (buffer) {
        this.push(`${buffer}`);
      }
      callback();
    },
  });

  let chunkCount = 1;

  const writable = new Writable({
    async write(chunk, _, callback) {
      const fileName = `chunk${chunkCount++}.txt`;

      await writeFile(join(__dirname, "chunks", fileName), chunk);

      callback();
    },
  });

  await mkdir(join(__dirname, "chunks"), { recursive: true });

  await pipeline(
    createReadStream(join(__dirname, "source.txt")),
    transform,
    writable,
  );
};

await split();
