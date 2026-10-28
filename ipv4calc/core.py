"""Matemática explícita; ipaddress é usado somente como referência nos testes."""
from dataclasses import asdict, dataclass


def validate_ip(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("Informe o IPv4 como texto.")
    value = value.strip()
    octets = value.split(".")
    if len(octets) != 4:
        raise ValueError("O IPv4 deve conter quatro octetos separados por pontos.")
    for octet in octets:
        if not octet or not octet.isascii() or not octet.isdigit():
            raise ValueError("Use somente números de 0 a 255 em cada octeto.")
        if len(octet) > 3 or int(octet) > 255:
            raise ValueError("Cada octeto deve ter até três dígitos e valer de 0 a 255.")
        if len(octet) > 1 and octet.startswith("0"):
            raise ValueError("Remova os zeros à esquerda dos octetos (use 1, não 01).")
    return value


def validate_prefix(value: str | int) -> int:
    if isinstance(value, bool) or not isinstance(value, (str, int)):
        raise ValueError("O prefixo CIDR deve ser um inteiro entre 0 e 32.")
    text = str(value).strip()
    if text.startswith("/"):
        text = text[1:]
    if not text or not text.isascii() or not text.isdigit() or len(text) > 2:
        raise ValueError("O prefixo CIDR deve ser um inteiro entre 0 e 32.")
    prefix = int(text)
    if not 0 <= prefix <= 32:
        raise ValueError("O prefixo CIDR deve estar entre /0 e /32.")
    return prefix


def to_int(address: str) -> int:
    value = 0
    for octet in address.split("."):
        value = value * 256 + int(octet)
    return value


def to_ip(value: int) -> str:
    return ".".join(str((value // (256 ** power)) % 256) for power in (3, 2, 1, 0))


@dataclass(frozen=True)
class Result:
    ip: str
    prefix: int
    cidr: str
    mask: str
    wildcard: str
    network: str
    broadcast: str | None
    last_address: str
    first_host: str
    last_host: str
    total: int
    hosts: int
    host_bits: int
    block: int
    block_octet: int | None
    classification: str
    note: str

    def as_dict(self) -> dict:
        return asdict(self)


def calculate(ip: str, prefix: str | int) -> Result:
    ip = validate_ip(ip)
    prefix = validate_prefix(prefix)
    host_bits = 32 - prefix
    total = 2 ** host_bits
    address = to_int(ip)
    network = (address // total) * total
    last = network + total - 1
    mask = 2 ** 32 - total
    if prefix == 32:
        first_host = last_host = network
        hosts = 1
        classification = "Endereço individual"
        note = "Uma rota /32 identifica um único endereço; não há broadcast de sub-rede."
    elif prefix == 31:
        first_host, last_host, hosts = network, last, 2
        classification = "Host ponto a ponto"
        note = "Em enlaces ponto a ponto /31, ambos os endereços são utilizáveis (RFC 3021)."
    else:
        first_host, last_host, hosts = network + 1, last - 1, total - 2
        classification = ("Endereço de rede" if address == network else
                          "Endereço de broadcast" if address == last else "Host utilizável")
        note = ("/0 abrange todo o espaço IPv4 e é usado na rota padrão. A contagem é "
                "aritmética: não significa que todos os endereços sejam atribuíveis."
                if prefix == 0 else
                "A faixa de hosts segue a regra da sub-rede; endereços especiais do IPv4 podem ter restrições de uso.")
    block_octet = None if prefix == 32 else prefix // 8 + 1
    block = 1 if prefix == 32 else 2 ** (8 - prefix % 8)
    return Result(ip, prefix, f"{to_ip(network)}/{prefix}", to_ip(mask),
                  to_ip(total - 1), to_ip(network), to_ip(last) if prefix <= 30 else None,
                  to_ip(last), to_ip(first_host), to_ip(last_host), total, hosts,
                  host_bits, block, block_octet, classification, note)


def detailed_steps(result: Result) -> list[str]:
    steps = [
        f"Bits de rede: {result.prefix}. Bits de host: 32 - {result.prefix} = {result.host_bits}.",
        f"Total de endereços: 2 ** {result.host_bits} = {result.total}.",
        f"Máscara: {result.mask}. Wildcard (inverso): {result.wildcard}.",
        f"Rede: (IPv4 inteiro // total) * total = ({to_int(result.ip)} // {result.total}) * {result.total} = {to_int(result.network)} = {result.network}.",
        f"Último endereço: rede + total - 1 = {result.last_address}.",
    ]
    if result.block_octet is not None:
        octet = int(result.ip.split(".")[result.block_octet - 1])
        start = octet // result.block * result.block
        steps.append(f"Bloco no {result.block_octet}º octeto: {result.block}. Início: ({octet} // {result.block}) * {result.block} = {start}.")
    steps.append(f"Hosts: {'2 ** bits de host - 2' if result.prefix <= 30 else 'regra especial /' + str(result.prefix)} = {result.hosts}.")
    steps.append(result.note)
    return steps
