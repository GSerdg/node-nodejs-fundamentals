import { stdin as input, stdout as output, argv } from "node:process";
import { Transform, pipeline } from "node:stream";

function getArgValue(flag) {
  const args = argv.slice(2);
  const index = args.indexOf(flag);

  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith("--")) {
    return args[index + 1];
  }
  return null;
}

const filter = () => {
  const arg = getArgValue("--pattern");

  const transform = new Transform({
    transform(chunk, _, callback) {
      const lines = chunk.toString().split("\n");
      const filteredLines = lines.filter((line) => line.includes(arg));

      for (const line of filteredLines) {
        this.push(`${line}\n`);
      }

      callback();
    },
  });

  pipeline(input, transform, output, (err) => {
    if (err) {
      console.error("failed", err);
    } else {
      console.log("completed");
    }
  });
};

filter();
