import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output, argv } from "node:process";

function hexToAnsi(hex) {
  const num = [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];

  return `\x1b[38;2;${num[0]};${num[1]};${num[2]}m`;
}

function getArgsValues() {
  const isOnlyDigits = (str) => /^\d+$/.test(str);
  const isStrictHex = (str) => /^#[0-9A-Fa-f]{6}$/.test(str);

  const DEFAULT_VALUES = {
    duration: 5000,
    interval: 100,
    length: 30,
    color: "\x1b[0m",
  };

  const args = argv.slice(2);
  const argsValues = {};
  const resultValues = {};

  for (let i = 0; i < args.length - 1; i++) {
    if (args[i].startsWith("--") && !args[i + 1].startsWith("--")) {
      argsValues[args[i].slice(2)] = args[i + 1];
    }
  }

  for (const key in DEFAULT_VALUES) {
    if (key === "color") {
      resultValues[key] =
        argsValues[key] && isStrictHex(argsValues[key])
          ? hexToAnsi(argsValues[key])
          : DEFAULT_VALUES[key];
    } else {
      resultValues[key] =
        argsValues[key] && isOnlyDigits(argsValues[key])
          ? +argsValues[key]
          : DEFAULT_VALUES[key];
    }
  }

  return resultValues;
}



const progress = () => {
  const rl = createInterface({ input, output });
  const argsValues = getArgsValues();

  let tick = 0;
  const maxTick = Math.ceil(argsValues.duration / argsValues.interval);

  const interval = setInterval(
    (function func() {
      const filledCount = Math.round((tick / maxTick) * argsValues.length);

      const filledSymbol = "█".repeat(filledCount);
      const emptySymbol = " ".repeat(argsValues.length - filledCount);
      const percent = Math.round((filledCount / argsValues.length) * 100);
      const color = argsValues.color;
      const resetColor = "\x1b[0m";

      output.write(
        `\r[${color}${filledSymbol}${resetColor}${emptySymbol}] ${percent}%`,
      );

      tick++;

      if (tick > maxTick) {
        clearInterval(interval);
        rl.write("\nDone!\n");
        rl.close();
        return;
      }

      return func;
    })(),
    argsValues.interval,
  );
};

progress();
