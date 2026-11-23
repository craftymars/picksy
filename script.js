
const canvas = document.querySelector("#wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.querySelector("#spin");
const statusEl = document.querySelector("#status");
const list = document.querySelector("#choices");
const dialog = document.querySelector("#result");

const palettes = [
  "#ff299a", "#f7b8d8", "#9b4a85", "#e88ac1",
  "#5d345c", "#c5c5d0", "#ed5ca5", "#ae79b2"
];

const presets = {
  food: ["Pizza", "Sushi", "Tacos", "Pasta"],
  games: ["Co-op horror", "Minecraft", "Valorant", "Cozy game"],
  weekend: ["Movie night", "Cafe trip", "Game night", "Art day"]
};

const defaults = ["Yes!", "Nope", "Maybe", "Try again"];

let choices = load();
let rotation = 0;
let spinning = false;

function load() {
  try {
    const value = JSON.parse(
      localStorage.getItem("picksy-choices")
    );

    if (
      Array.isArray(value) &&
      value.length >= 2 &&
      value.length <= 12 &&
      value.every(x =>
        typeof x === "string" && x.length <= 36
      )
    ) {
      return value;
    }
  } catch {}

  return [...defaults];
}

function save() {
  try {
    localStorage.setItem(
      "picksy-choices",
      JSON.stringify(choices)
    );
  } catch {
    statusEl.textContent =
      "Storage unavailable: choices last only this visit.";
  }
}

function draw() {
  const n = choices.length;
  const r = 275;

  ctx.clearRect(0, 0, 600, 600);
  ctx.save();
  ctx.translate(300, 300);
  ctx.rotate(rotation);

  for (let i = 0; i < n; i++) {
    const start = -Math.PI / 2 + i * 2 * Math.PI / n;
    const end = start + 2 * Math.PI / n;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, start, end);
    ctx.closePath();

    ctx.fillStyle = palettes[i % palettes.length];
    ctx.fill();
    ctx.strokeStyle = "#1b1020";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + Math.PI / n);
    ctx.translate(r * 0.61, 0);
    ctx.rotate(Math.PI / 2);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${n > 8 ? 17 : 22}px Arial`;

    ctx.fillStyle =
      [1, 5].includes(i % palettes.length)
        ? "#1a1020"
        : "#fff";

    const label = choices[i].length > 15
      ? choices[i].slice(0, 14) + "…"
      : choices[i];

    ctx.fillText(label, 0, 0, r * 0.63);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 35, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.strokeStyle = "#ff299a";
  ctx.lineWidth = 9;
  ctx.stroke();

  ctx.fillStyle = "#ff299a";
  ctx.font = "bold 30px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("♥", 0, 2);

  ctx.restore();
}

function render() {
  list.replaceChildren();

  choices.forEach((choice, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = choice;

    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.setAttribute(
      "aria-label",
      `Remove ${choice}`
    );
    remove.disabled = spinning;

    remove.addEventListener("click", () => {
      if (choices.length <= 2) {
        statusEl.textContent =
          "Keep at least two choices ♡";
        return;
      }

      choices.splice(i, 1);
      save();
      render();
    });

    li.append(span, remove);
    list.append(li);
  });

  document.querySelector("#new-choice").disabled = spinning;
  document.querySelector("#add-form button").disabled = spinning;
  document.querySelector("#reset").disabled = spinning;

  document.querySelectorAll("[data-preset]").forEach(
    b => b.disabled = spinning
  );

  spinBtn.disabled = spinning;
  draw();
}

document.querySelector("#add-form").addEventListener(
  "submit",
  e => {
    e.preventDefault();
    if (spinning) return;

    const input = document.querySelector("#new-choice");
    const value = input.value.trim();

    if (!value) return;

    if (choices.length >= 12) {
      statusEl.textContent = "12 choices max ♡";
      return;
    }

    choices.push(value);
    input.value = "";
    save();
    render();
  }
);

document.querySelector("#reset").addEventListener(
  "click",
  () => {
    if (spinning) return;

    choices = [...defaults];
    save();
    render();
  }
);

document.querySelectorAll("[data-preset]").forEach(
  b => b.addEventListener("click", () => {
    if (spinning) return;

    choices = [...presets[b.dataset.preset]];
    save();
    render();
  })
);

spinBtn.addEventListener("click", () => {
  if (spinning) return;

  spinning = true;
  render();

  statusEl.textContent = "the wheel is deciding...";

  const n = choices.length;
  const winnerIndex = Math.floor(Math.random() * n);
  const sector = 2 * Math.PI / n;

  const target = -sector * (winnerIndex + 0.5);
  const start = rotation;

  const extra = 2 * Math.PI *
    (5 + Math.floor(Math.random() * 3));

  const delta =
    ((target - start) % (2 * Math.PI) + 2 * Math.PI)
    % (2 * Math.PI);

  const finish = start + extra + delta;
  const duration = 3900;
  const t0 = performance.now();

  function animate(now) {
    const t = Math.min(1, (now - t0) / duration);
    const ease = 1 - Math.pow(1 - t, 4);

    rotation = start + (finish - start) * ease;
    draw();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      rotation =
        ((finish % (2 * Math.PI)) + 2 * Math.PI)
        % (2 * Math.PI);

      spinning = false;
      render();

      statusEl.textContent = "decision made ♡";

      document.querySelector("#winner").textContent =
        choices[winnerIndex];

      dialog.showModal();
    }
  }

  requestAnimationFrame(animate);
});

document.querySelector("#again").addEventListener(
  "click",
  () => {
    dialog.close();
    spinBtn.click();
  }
);

document.querySelector("#close").addEventListener(
  "click",
  () => dialog.close()
);

render();
