import {
  calculate,
  validateIP,
  validatePrefix,
  toInt,
  formatResult,
} from "./calculator.js";

const $ = (id) => document.getElementById(id);
const octets = [0, 1, 2, 3].map((i) => $(`octet-${i}`));
const prefix = $("prefix");
const range = $("prefix-range");
const historyKey = "ipv4-history-v1";
let result = null;
let installPrompt = null;
let toastTimer;
let history = [];
try {
  const stored = JSON.parse(localStorage.getItem(historyKey) || "[]");
  if (Array.isArray(stored))
    history = stored.slice(0, 5).flatMap((item) => {
      try {
        return [
          { ip: validateIP(item.ip), prefix: validatePrefix(item.prefix) },
        ];
      } catch {
        return [];
      }
    });
} catch {
  /* A calculadora continua disponível sem armazenamento. */
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    $("toast").hidden = true;
  }, 3500);
}

function clearErrors() {
  for (const id of ["ip-error", "prefix-error"]) {
    $(id).hidden = true;
    $(id).textContent = "";
  }
  document.querySelector(".ip-input").classList.remove("invalid");
  [...octets, prefix].forEach((input) => input.removeAttribute("aria-invalid"));
}

function markPending() {
  clearErrors();
  $("result-status").classList.add("pending");
  $("result-status").replaceChildren(
    Object.assign(document.createElement("span"), { className: "dot" }),
    document.createTextNode("Recalcule"),
  );
  $("input-caption").textContent = "Resultado anterior · calcule novamente";
  $("copy").disabled = $("download").disabled = true;
}

function syncPrefix(value) {
  prefix.value = String(value);
  if (/^[0-9]{1,2}$/.test(String(value)) && Number(value) <= 32)
    range.value = value;
  document.querySelectorAll("[data-prefix]").forEach((button) => {
    const active =
      prefix.value !== "" &&
      Number(button.dataset.prefix) === Number(prefix.value);
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setIP(ip) {
  ip.split(".").forEach((value, i) => {
    octets[i].value = value;
    octets[i].dataset.previous = value;
  });
}

function saveHistory() {
  try {
    localStorage.setItem(historyKey, JSON.stringify(history));
  } catch {
    /* Sem persistência. */
  }
  renderHistory();
}

function renderHistory() {
  $("history-list").replaceChildren();
  $("history-empty").hidden = history.length > 0;
  $("clear-history").hidden = history.length === 0;
  history.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${item.ip}/${item.prefix}`;
    button.title = `Recalcular ${button.textContent}`;
    button.addEventListener("click", () => {
      setIP(item.ip);
      syncPrefix(item.prefix);
      submitCalculation();
    });
    $("history-list").append(button);
  });
}

function render(r) {
  result = r;
  $("result-body").hidden = false;
  $("empty-state").hidden = true;
  $("copy").disabled = $("download").disabled = false;
  $("result-status").classList.remove("pending");
  $("result-status").replaceChildren(
    Object.assign(document.createElement("span"), { className: "dot" }),
    document.createTextNode("Calculado"),
  );
  $("network").replaceChildren(
    document.createTextNode(r.network),
    Object.assign(document.createElement("span"), {
      textContent: `/${r.prefix}`,
    }),
  );
  const fields = {
    classification: r.classification,
    total: r.total.toLocaleString("pt-BR"),
    hosts: r.hosts.toLocaleString("pt-BR"),
    block: r.block,
    "block-octet": r.block_octet
      ? `no ${r.block_octet}º octeto`
      : "endereço único",
    mask: r.mask,
    wildcard: r.wildcard,
    "network-address": r.network,
    broadcast: r.broadcast ?? "Não se aplica",
    "first-host": r.first_host,
    "last-host": r.last_host,
    "network-note": r.note,
    "input-caption": `IPv4 informado: ${r.ip}`,
    "network-bits": r.prefix,
    "host-bits": r.host_bits,
  };
  Object.entries(fields).forEach(([id, value]) => {
    $(id).textContent = value;
  });
  $("binary").replaceChildren();
  r.ip.split(".").forEach((octet, index) => {
    const group = document.createElement("span");
    group.className = "octet";
    Number(octet)
      .toString(2)
      .padStart(8, "0")
      .split("")
      .forEach((bit, j) => {
        const span = document.createElement("span");
        span.className = `bit${index * 8 + j >= r.prefix ? " host" : ""}`;
        span.textContent = bit;
        group.append(span);
      });
    $("binary").append(group);
  });
  $("binary").setAttribute(
    "aria-label",
    `IPv4 em binário: ${r.ip
      .split(".")
      .map((o) => Number(o).toString(2).padStart(8, "0"))
      .join(".")} . ${r.prefix} bits de rede e ${r.host_bits} bits de host.`,
  );
  const steps = [
    `Bits de host: 32 − ${r.prefix} = ${r.host_bits}.`,
    `Total de endereços: 2 elevado a ${r.host_bits} = ${r.total.toLocaleString("pt-BR")}.`,
    `Máscara: ${r.mask}. Os ${r.prefix} primeiros bits são 1; os demais são 0.`,
    `Rede: piso(${toInt(r.ip)} ÷ ${r.total}) × ${r.total} = ${toInt(r.network)} → ${r.network}.`,
    `Último endereço: rede + ${r.total} − 1 = ${r.last_address}.`,
    r.prefix <= 30
      ? `Hosts: ${r.total} − 2 = ${r.hosts.toLocaleString("pt-BR")}. Reservamos a rede e o broadcast.`
      : r.note,
  ];
  if (r.block_octet) {
    const octet = Number(r.ip.split(".")[r.block_octet - 1]);
    steps.push(
      `Bloco no ${r.block_octet}º octeto: ${r.block}. Início do bloco: piso(${octet} ÷ ${r.block}) × ${r.block} = ${Math.floor(octet / r.block) * r.block}.`,
    );
  }
  $("steps").replaceChildren(
    ...steps.map((text) =>
      Object.assign(document.createElement("li"), { textContent: text }),
    ),
  );
  $("announcement").textContent =
    `Calculado: rede ${r.cidr}, ${r.hosts.toLocaleString("pt-BR")} hosts utilizáveis. ${r.classification}.`;
}

function submitCalculation(save = true) {
  clearErrors();
  const ip = octets.map((input) => input.value).join(".");
  let ipValid = true;
  let prefixValid = true;
  try {
    validateIP(ip);
  } catch (error) {
    ipValid = false;
    $("ip-error").hidden = false;
    $("ip-error").textContent = error.message;
    document.querySelector(".ip-input").classList.add("invalid");
    octets.forEach((input) => input.setAttribute("aria-invalid", "true"));
  }
  try {
    validatePrefix(prefix.value);
  } catch (error) {
    prefixValid = false;
    $("prefix-error").hidden = false;
    $("prefix-error").textContent = error.message;
    prefix.setAttribute("aria-invalid", "true");
  }
  if (!ipValid || !prefixValid) {
    $("copy").disabled = $("download").disabled = true;
    if (!ipValid) (octets.find((input) => !input.value) || octets[0]).focus();
    else prefix.focus();
    return;
  }
  const r = calculate(ip, prefix.value);
  syncPrefix(r.prefix);
  render(r);
  if (save) {
    history = [
      { ip: r.ip, prefix: r.prefix },
      ...history.filter((item) => item.ip !== r.ip || item.prefix !== r.prefix),
    ].slice(0, 5);
    saveHistory();
  }
}

octets.forEach((input, index) => {
  input.dataset.previous = input.value;
  input.addEventListener("beforeinput", (event) => {
    if (!event.data || event.inputType.startsWith("delete")) return;
    const value =
      input.value.slice(0, input.selectionStart) +
      event.data +
      input.value.slice(input.selectionEnd);
    if (
      !/^[0-9]{0,3}$/.test(value) ||
      Number(value) > 255 ||
      /^0[0-9]/.test(value)
    ) {
      event.preventDefault();
      toast("Use até três dígitos, de 0 a 255, sem zeros à esquerda.");
    }
  });
  input.addEventListener("input", () => {
    if (
      !/^[0-9]{0,3}$/.test(input.value) ||
      Number(input.value) > 255 ||
      /^0[0-9]/.test(input.value)
    ) {
      input.value = input.dataset.previous || "";
      return;
    }
    input.dataset.previous = input.value;
    markPending();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "." || event.key === "Decimal") {
      event.preventDefault();
      if (input.value && index < 3) {
        octets[index + 1].focus();
        octets[index + 1].select();
      }
    } else if (event.key === "Backspace" && input.value === "" && index > 0) {
      event.preventDefault();
      octets[index - 1].focus();
    } else if (
      event.key === "ArrowRight" &&
      input.selectionStart === input.value.length &&
      index < 3
    ) {
      event.preventDefault();
      octets[index + 1].focus();
    } else if (
      event.key === "ArrowLeft" &&
      input.selectionStart === 0 &&
      index > 0
    ) {
      event.preventDefault();
      octets[index - 1].focus();
    }
  });
  input.addEventListener("paste", (event) => {
    const text = event.clipboardData.getData("text").trim();
    if (!text.includes(".") && !text.includes("/")) return;
    event.preventDefault();
    try {
      const parts = text.split("/");
      if (parts.length > 2)
        throw new Error("Cole um IPv4 ou um IPv4/prefixo válido.");
      const ip = validateIP(parts[0]);
      const pastedPrefix = parts.length === 2 ? validatePrefix(parts[1]) : null;
      setIP(ip);
      if (pastedPrefix !== null) syncPrefix(pastedPrefix);
      markPending();
      prefix.focus();
    } catch (error) {
      toast(error.message);
    }
  });
});

prefix.addEventListener("input", () => {
  syncPrefix(prefix.value);
  markPending();
});
range.addEventListener("input", () => {
  syncPrefix(range.value);
  markPending();
});
document.querySelectorAll("[data-prefix]").forEach((button) =>
  button.addEventListener("click", () => {
    syncPrefix(button.dataset.prefix);
    markPending();
  }),
);
$("network-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitCalculation();
});
$("reset").addEventListener("click", () => {
  setIP("...");
  syncPrefix(24);
  clearErrors();
  result = null;
  $("result-body").hidden = true;
  $("empty-state").hidden = false;
  $("result-status").classList.remove("pending");
  $("result-status").textContent = "Aguardando";
  $("announcement").textContent = "Campos limpos. Informe uma nova rede.";
  octets[0].focus();
});
$("clear-history").addEventListener("click", () => {
  history = [];
  saveHistory();
});
$("copy").addEventListener("click", async () => {
  if (!result) return;
  try {
    await navigator.clipboard.writeText(formatResult(result));
    toast("Resultado copiado!");
  } catch {
    toast("Não foi possível copiar. Use “Exportar .txt”.");
  }
});
$("download").addEventListener("click", () => {
  if (!result) return;
  const url = URL.createObjectURL(
    new Blob([formatResult(result)], { type: "text/plain;charset=utf-8" }),
  );
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: `sub-rede-${result.network}-${result.prefix}.txt`,
  });
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  toast("Aplicativo instalado!");
});
$("install").addEventListener("click", async () => {
  if (installPrompt) {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
  } else $("install-dialog").showModal();
});
$("close-dialog").addEventListener("click", () => $("install-dialog").close());

function connectionStatus(ready = false) {
  $("connection-status").textContent = !navigator.onLine
    ? "Você está offline"
    : ready
      ? "Pronto para usar offline"
      : "Disponível no navegador";
}
window.addEventListener("online", () =>
  connectionStatus(Boolean(navigator.serviceWorker?.controller)),
);
window.addEventListener("offline", () => connectionStatus());
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker
    .register("./sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then(() => connectionStatus(true))
    .catch(() => connectionStatus());
}
renderHistory();
syncPrefix(26);
submitCalculation(false);
connectionStatus();
