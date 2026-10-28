"""Interface de terminal com entrada controlada e modo não interativo."""
import argparse
import json
import os
import sys
from .core import calculate, detailed_steps


def valid_partial_ip(value: str) -> bool:
    """Permite também estados incompletos durante a digitação."""
    octets = value.split(".")
    if len(octets) > 4:
        return False
    for i, octet in enumerate(octets):
        if not octet:
            if i != len(octets) - 1:
                return False
            continue
        if (not octet.isascii() or not octet.isdigit() or len(octet) > 3
                or int(octet) > 255 or (len(octet) > 1 and octet[0] == "0")):
            return False
    return True


def _read_controlled(getch) -> str:
    value = ""
    while True:
        char = getch()
        if not char:
            continue
        if char in ("\r", "\n"):
            print()
            return value
        if char == "\x03":
            raise KeyboardInterrupt
        if char in ("\x04", "\x1a"):
            raise EOFError
        if char in ("\x00", "\xe0"):
            getch()
            continue
        if char == "\x1b":
            continue
        if char in ("\b", "\x7f"):
            if value:
                value = value[:-1]
                print("\b \b", end="", flush=True)
        elif char in "0123456789." and valid_partial_ip(value + char):
            value += char
            print(char, end="", flush=True)


def read_ip() -> str:
    if not sys.stdin.isatty() or not sys.stdout.isatty():
        return input("IPv4: ")
    print("IPv4: ", end="", flush=True)
    if os.name == "nt":
        import msvcrt
        return _read_controlled(msvcrt.getwch)
    import termios
    import tty
    import select
    fd = sys.stdin.fileno()
    previous = termios.tcgetattr(fd)
    def read_char():
        char = os.read(fd, 1).decode('ascii', errors='ignore')
        if char == '\x1b':
            while select.select([fd], [], [], 0.03)[0]:
                following = os.read(fd, 1).decode('ascii', errors='ignore')
                if following.isalpha() or following == '~':
                    break
            return ''
        return char
    try:
        tty.setcbreak(fd)
        return _read_controlled(read_char)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, previous)


def show_result(result) -> None:
    print("\n===== RESULTADO =====\n")
    rows = [
        ("IPv4 / CIDR", f"{result.ip}/{result.prefix}"),
        ("Máscara", result.mask), ("Wildcard", result.wildcard),
        ("Endereço de rede", result.network),
        ("Broadcast", result.broadcast or "Não se aplica"),
        ("Primeiro host", result.first_host), ("Último host", result.last_host),
        ("Total de endereços", f"{result.total:,}".replace(",", ".")),
        ("Hosts utilizáveis", f"{result.hosts:,}".replace(",", ".")),
        ("Tamanho do bloco", f"{result.block}" + (f" ({result.block_octet}º octeto)" if result.block_octet else " (endereço único)")),
        ("Classificação", result.classification),
    ]
    for label, value in rows:
        print(f"{label + ':':<23} {value}")
    print(f"\n{result.note}")


def main(argv=None) -> int:
    # O executável congelado pode herdar uma página de códigos antiga ao redirecionar.
    for stream in (sys.stdout, sys.stderr):
        if not stream.isatty() and hasattr(stream, 'reconfigure'):
            stream.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description="Calculadora IPv4 e Subnetting v1.0")
    parser.add_argument("--ip", help="IPv4 decimal, sem zeros à esquerda")
    parser.add_argument("--prefix", help="prefixo de 0 a 32")
    parser.add_argument("--details", action="store_true", help="exibir cálculos")
    parser.add_argument("--json", action="store_true", help="resultado JSON (com --ip e --prefix)")
    args = parser.parse_args(argv)
    if (args.ip is None) != (args.prefix is None) or (args.json and args.ip is None):
        parser.error("informe --ip e --prefix juntos; --json exige os dois")
    if args.ip is not None:
        try:
            result = calculate(args.ip, args.prefix)
        except ValueError as error:
            print(f"Erro: {error}", file=sys.stderr)
            return 2
        if args.json:
            print(json.dumps(result.as_dict(), ensure_ascii=False, indent=2))
        else:
            show_result(result)
            if args.details:
                print("\n===== CÁLCULOS DETALHADOS =====")
                print("\n".join(detailed_steps(result)))
        return 0
    print("===== CALCULADORA IPv4 v1.0 =====")
    print("Use pontos entre octetos. Backspace apaga. Ctrl+C encerra.")
    try:
        while True:
            try:
                ip = read_ip()
                prefix = input("Prefixo CIDR: /")
                result = calculate(ip, prefix)
            except ValueError as error:
                print(f"\nErro: {error}\n")
                continue
            show_result(result)
            while True:
                option = input("\n[1] Calcular outro IP  [2] Ver cálculos detalhados  [0] Sair\n> ").strip()
                if option == "0":
                    return 0
                if option == "1":
                    break
                if option == "2":
                    print("\n".join(detailed_steps(result)))
                else:
                    print("Escolha 0, 1 ou 2.")
    except (KeyboardInterrupt, EOFError):
        print("\nAté a próxima!")
        return 0
