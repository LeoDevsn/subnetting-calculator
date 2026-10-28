// Mesmas fórmulas do núcleo Python. Nenhuma lista de hosts é materializada.
export function validateIP(value) {
  if (typeof value !== "string") throw new Error("Informe um endereço IPv4.");
  const ip = value.trim();
  const octets = ip.split(".");
  if (octets.length !== 4)
    throw new Error("Informe os quatro octetos separados por pontos.");
  for (const octet of octets) {
    if (!/^[0-9]{1,3}$/.test(octet) || Number(octet) > 255)
      throw new Error("Cada octeto precisa ser um número de 0 a 255.");
    if (octet.length > 1 && octet.startsWith("0"))
      throw new Error("Remova os zeros à esquerda: use 1, não 01.");
  }
  return ip;
}

export function validatePrefix(value) {
  if (!["string", "number"].includes(typeof value))
    throw new Error("Use um prefixo entre /0 e /32.");
  const text = String(value).trim().replace(/^\//, "");
  if (!/^[0-9]{1,2}$/.test(text) || Number(text) > 32)
    throw new Error("Use um prefixo inteiro entre /0 e /32.");
  return Number(text);
}

export const toInt = (ip) =>
  ip.split(".").reduce((value, octet) => value * 256 + Number(octet), 0);
export const toIP = (value) =>
  [3, 2, 1, 0].map((power) => Math.floor(value / 256 ** power) % 256).join(".");

export function calculate(ip, prefix) {
  ip = validateIP(ip);
  prefix = validatePrefix(prefix);
  const host_bits = 32 - prefix;
  const total = 2 ** host_bits;
  const address = toInt(ip);
  const network = Math.floor(address / total) * total;
  const last = network + total - 1;
  const hosts = prefix >= 31 ? total : total - 2;
  const classification =
    prefix === 32
      ? "Endereço individual"
      : prefix === 31
        ? "Host ponto a ponto"
        : address === network
          ? "Endereço de rede"
          : address === last
            ? "Endereço de broadcast"
            : "Host utilizável";
  const note =
    prefix === 32
      ? "Uma rota /32 identifica um único endereço; não há broadcast de sub-rede."
      : prefix === 31
        ? "Em enlaces ponto a ponto /31, ambos os endereços são utilizáveis (RFC 3021)."
        : prefix === 0
          ? "/0 abrange todo o espaço IPv4 e é usado na rota padrão. A contagem é aritmética: não significa que todos os endereços sejam atribuíveis."
          : "A faixa de hosts segue a regra da sub-rede; endereços especiais do IPv4 podem ter restrições de uso.";
  return {
    ip,
    prefix,
    cidr: `${toIP(network)}/${prefix}`,
    mask: toIP(2 ** 32 - total),
    wildcard: toIP(total - 1),
    network: toIP(network),
    broadcast: prefix <= 30 ? toIP(last) : null,
    last_address: toIP(last),
    first_host: toIP(prefix >= 31 ? network : network + 1),
    last_host: toIP(prefix >= 31 ? last : last - 1),
    total,
    hosts,
    host_bits,
    block: prefix === 32 ? 1 : 2 ** (8 - (prefix % 8)),
    block_octet: prefix === 32 ? null : Math.floor(prefix / 8) + 1,
    classification,
    note,
  };
}

export function formatResult(r) {
  return [
    `Calculadora IPv4 e Subnetting v1.0`,
    `IPv4: ${r.ip}/${r.prefix}`,
    `Rede: ${r.cidr}`,
    `Máscara: ${r.mask}`,
    `Wildcard: ${r.wildcard}`,
    `Broadcast: ${r.broadcast ?? "Não se aplica"}`,
    `Primeiro host: ${r.first_host}`,
    `Último host: ${r.last_host}`,
    `Total de endereços: ${r.total}`,
    `Hosts utilizáveis: ${r.hosts}`,
    `Bloco: ${r.block}${r.block_octet ? ` (${r.block_octet}º octeto)` : ""}`,
    `Classificação: ${r.classification}`,
    r.note,
  ].join("\n");
}
