def mostrar_prefixo_32(ip):
    print("\n====== PREFIXO /32 =====")
    print("Este prefixo representa um único endereço IPv4.")
    print("Máscara: 255.255.255.255")
    print("Endereço individual:", ip)
    print("Total de endereços: 1")
    print("Broadcast: não aplicável")

def mostrar_prefixo_0(ip):
    print("\n====== PREFIXO /0 =====")
    print("IPv4 informado:", ip)
    print("Máscara: 0.0.0.0")
    print("Rede: 0.0.0.0")
    print("Último endereço: 255.255.255.255")
    print("Total de endereços:", 2** 32)
    print("Uso comum: rota padrão")


def main():
    print("===== CALCULADORA DE SUB-REDES =====")

    ip = input("Digite o IPv4: ")

    octetos = ip.split(".")

    if len(octetos) != 4:
        print("Erro: O IPv4 deve conter exatamente 4 octetos.")
        return

    for octeto in octetos:
        if not octeto.isascii() or not octeto.isdigit():
            print("Erro: o IPv4 contém um octeto inválido:", octeto)
            return

        if not 0 <= int(octeto) <= 255:
            print("Erro: o octeto deve estar entre 0 e 255:", octeto)
            return

    try:
        prefixo = int(input("Digite o prefixo CIDR: /"))

    except ValueError:
        print("Erro: o prefixo CIRD deve ser número inteiro.")
        return

    if not 0 <= prefixo <= 32:
        print("Erro: o prefixo CIDR deve estar entre 0 e 32.")
        return

    if prefixo == 32:
        mostrar_prefixo_32(ip)
        return

    elif prefixo == 0:
        mostrar_prefixo_0(ip)
        return

    print("\n ===== DADOS INFORMADOS =====")
    print("IPv4:", ip)
    print("Prefixo: /", prefixo, sep="")

    bits_host = 32 - prefixo
    print("Bits disponíbeis para hosts: ",bits_host)


    print("\n===== OCTETOS DO IPv4 =====")
    print(octetos)

    print("1º octeto : ", octetos[0])
    print("2º octeto : ", octetos[1])
    print("3º octeto : ", octetos[2])
    print("4º octeto : ", octetos[3])

    print("\n===== INDENTIFICANDO O OCTETO =====")

    if 1 <= prefixo <= 7:
        print("O cálculo será no 1º octeto.")
    elif prefixo == 8:
        print("Prefixo /8: primeiro octeto de hosts é o 2º.")
    elif 9 <= prefixo <= 15:
        print("O cálculo será no 2º octeto.")
    elif prefixo == 16:
        print("Prefixo /16: primeiro octeto de hosts é o 3º.")
    elif 17 <= prefixo <= 23:
        print("O cálculo será no 3º octeto.")
    elif prefixo == 24:
        print("Prefixo /24: primeiro octeto de hosts é o 4º.")
    elif 25 <= prefixo <= 31:
        print("O cálculo será no 4º octeto.")
    else :
        print("Prefixo no limite de um octeto ou fora dos intervalos tratados.")

    print("\n===== CALCULANDO O BLOCO =====")

    if 25 <= prefixo <= 31:
        bits_restantes = 32 - prefixo
        bloco = 2 ** bits_restantes

        print("Bits restantes no octeto: ", bits_restantes)
        print("Tamanho do bloco: ", bloco)

    elif 17 <= prefixo <= 23:
        bits_restantes = 24 - prefixo
        bloco = 2 ** bits_restantes

        print("Bits restantes no octeto: ", bits_restantes)
        print("Tamanho do bloco: ", bloco)

    elif 9 <= prefixo <= 15:
        bits_restantes = 16 - prefixo
        bloco = 2 ** bits_restantes

        print("Bits restantes no octeto: ", bits_restantes)
        print("Tamanho do bloco: ", bloco)

    elif 1 <= prefixo <= 7:
        bits_restantes = 8 - prefixo
        bloco = 2 ** bits_restantes

        print("Bits restantes no octeto: ", bits_restantes)
        print("Tamanho do bloco: ", bloco)


    elif prefixo == 8:
        bits_restantes = 8
        bloco = 2 ** bits_restantes

        print("Prefixo /8: tres octeto completo para o host")
        print("Tamanho do bloco:", bloco)

    elif prefixo == 16:
        bits_restantes = 8
        bloco = 2 ** bits_restantes

        print("Prefixo /16: cálculo no 3º octeto")
        print("Tamanho do bloco:", bloco)

    elif prefixo == 24:
        bits_restantes = 8
        bloco = 2 ** bits_restantes

        print("Prefixo /24: um octeto completo para host.")
        print("Tamanho do bloco:", bloco)

    print("\n=====  CALCULANDO A MÁSCARA =====")

    valor_mascara = 256 - bloco

    print("Tamanho do bloco:", bloco)
    print("Cálculo: 256 -", bloco, "=", valor_mascara)
    print("Valor do octeto da máscara:", valor_mascara)

    print("\n===== SELECIONANDO O OCTETO =====")

    if 1 <= prefixo <= 7:
        indice_octeto = 0

    elif prefixo == 8:
        indice_octeto = 1

    elif 9 <= prefixo <= 15:
        indice_octeto = 1

    elif prefixo == 16:
        indice_octeto = 2

    elif 17 <= prefixo <=23:
        indice_octeto = 2

    elif prefixo == 24:
        indice_octeto = 3

    elif 25 <= prefixo <= 31:
        indice_octeto = 3

    octeto_calculo = int(octetos[indice_octeto])
    print("Octeto selecionado:", octeto_calculo)

    total_enderecos = 2 ** bits_host

    print("\nTotal de Endereços: ", total_enderecos)

    if prefixo <= 30:
        print("endereço de rede: 1 reservado.")
        print("Broadcast: 1 reservado.")

    if prefixo == 31:
        hosts_utilizaveis = 2
    else:
        hosts_utilizaveis = total_enderecos - 2

    print("\nHosts Utilizáveis: ", hosts_utilizaveis)

    print("\n===== MONTANDO A MÁSCARA =====")

    octetos_mascara = ["0", "0", "0", "0"]
    octetos_mascara[indice_octeto] = str(valor_mascara)

    print("máscara parcial:", octetos_mascara)

    for i in range(0, indice_octeto):
        octetos_mascara[i] = "255"
    print("Máscara completa:", octetos_mascara)

    mascara_subrede = ".".join(octetos_mascara)
    print("Máscara de sub-rede:", mascara_subrede)

    print("\n===== CALCULANDO O INTERVALO =====")
    quantidade_blocos = octeto_calculo // bloco
    inicio_bloco = quantidade_blocos * bloco
    fim_bloco = inicio_bloco + bloco - 1

    print("Quantidade de blocos:", quantidade_blocos)
    print("Início do bloco:", inicio_bloco)
    print("Fim do bloco:", fim_bloco)


    print("\n===== PREPARANDO A REDE =====")
    octetos_rede = octetos.copy()
    octetos_rede[indice_octeto] = str(inicio_bloco)

    octetos_broadcast = octetos.copy()
    octetos_broadcast[indice_octeto] = str(fim_bloco)

    print("Lista original:", octetos)
    print("Lista da rede:", octetos_rede)
    print("Lista do broadcast:", octetos_broadcast)

    print("\n===== PREENCHENDO OCTETOS DA REDE =====")

    for i in range(indice_octeto + 1, 4):
        octetos_rede[i] = "0"
    print("Lista da rede:", octetos_rede)

    for i in range(indice_octeto + 1 , 4):
        octetos_broadcast[i] = "255"
    print("Lista do broadcast: ", octetos_broadcast)

    print("\n===== ENDEREÇO DE REDE =====")

    endereco_rede = ".".join(octetos_rede)
    print("Endereço de rede:", endereco_rede)

    endereco_broadcast = ".".join(octetos_broadcast)

    if prefixo == 31:
        print("Segundo endereço utilizável:", endereco_broadcast)
        print("Broadcast: não aplicável.")
    else:
        print("Endereço de broadcast:", endereco_broadcast)

    print("\n===== CLASSIFICAÇÃO DO IPv4 =====")

    if prefixo <= 30 and ip == endereco_rede:
        print("Tipo: Endereço de rede.")

    elif prefixo <= 30 and ip == endereco_broadcast:
        print("Tipo: Endereço de broadcast")

    elif prefixo == 31:
        print("Tipo: Endereço utilizável em enlace ponto a ponto.")
    else:
        print("Tipo: Host utilizável.")

if __name__ == "__main__":
    main()
