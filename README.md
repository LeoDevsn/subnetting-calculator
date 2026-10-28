# Calculadora IPv4 e Subnetting

**Sua rede, sem complicação.** Uma ferramenta em português para calcular sub-redes IPv4 e entender a matemática por trás de cada resultado.

Projeto de **Leonardo Santos · [LeoDevsn](https://github.com/LeoDevsn)**, criado a partir de um exercício de Python e evoluído para uma ferramenta com interface web, instalação no celular e terminal Windows.

[**Abrir a calculadora**](https://leodevsn.github.io/subnetting-calculator/) · [**Baixar a versão Windows**](https://github.com/LeoDevsn/subnetting-calculator/releases/latest) · [**Testes automáticos**](https://github.com/LeoDevsn/subnetting-calculator/actions)

O site público está no GitHub Pages. Há também uma [publicação Sites privada](https://ipv4-subnetting-leodevsn.hushedcharm256.chatgpt.site), acessível ao proprietário.

## O que a versão 1.0 entrega

- Site responsivo para celular e computador, sem cadastro e sem dependências externas no navegador.
- PWA instalável na tela inicial do Android, com cache para uso offline após a primeira carga completa.
- Terminal em Python e executável Windows independente da instalação do Python.
- Validação dos quatro octetos, faixa de 0 a 255 e prefixos de `/0` a `/32`.
- Entrada controlada: até três dígitos por octeto, bloqueio de letras e zeros à esquerda, navegação por pontos e Backspace.
- Máscara, wildcard, rede, broadcast, primeiro e último host, contagem de endereços e hosts, bloco e classificação.
- Modo didático com fórmulas e representação dos 32 bits na interface web.
- Histórico dos últimos cinco cálculos no dispositivo, cópia e exportação em `.txt`.
- Testes automáticos e workflows para GitHub Actions, GitHub Pages e release Windows.

**Formato Android:** esta entrega usa uma PWA, instalada pelo navegador. Não inclui um APK nativo nem publicação na Play Store. O executável Windows é uma interface de terminal; a interface gráfica é a versão web.

## Usar no celular ou computador

Na versão publicada, informe o IPv4, escolha o CIDR e toque em **Calcular sub-rede**. Também é possível colar `192.168.10.130/26` em qualquer campo de octeto.

Para instalar no Android, abra o site por HTTPS no Chrome e procure **⋮ → Adicionar à tela inicial → Instalar**. O botão **Instalar app** abre a solicitação quando o navegador a disponibiliza; caso contrário, mostra instruções. No iPhone, use **Compartilhar → Adicionar à Tela de Início**. A disponibilidade e o texto dos comandos variam entre navegadores.

O service worker salva os arquivos da aplicação. Após a primeira carga completa, a calculadora pode abrir sem conexão. Os cálculos são executados no dispositivo. O histórico usa `localStorage` e pode ser apagado em **Cálculos recentes → Limpar**. Não há analytics, login ou envio dos endereços calculados para um servidor.

## Executar localmente

### Terminal Python

Requer **Python 3.10 ou superior**. A validação desta entrega foi feita com Python **3.14.3** no Windows. A execução e os testes Python usam somente a biblioteca padrão.

```powershell
python main.py
```

O menu permite calcular outra rede, consultar os detalhes ou sair. A digitação é controlada em um terminal interativo: `msvcrt` no Windows e `termios`/`tty` em sistemas POSIX. Use Backspace para corrigir; o editor não reposiciona o cursor dentro do IPv4. Com entrada redirecionada, o programa usa `input()` e valida o valor completo.

```powershell
python main.py --ip 192.168.10.130 --prefix 26
python main.py --ip 192.168.10.130 --prefix 26 --details
python main.py --ip 192.168.10.130 --prefix 26 --json
```

Erros de entrada em modo de argumentos retornam código de saída `2`; sucesso retorna `0`. `Ctrl+C` ou fim da entrada encerram o modo interativo.

### Interface web

Requer **Node.js 24** e Python para o servidor local. Não é necessário instalar pacotes para compilar ou servir o site.

```powershell
npm run build
npm run preview
```

Abra **http://127.0.0.1:4173**. Use um servidor HTTP: abrir o HTML com `file://` não é suportado para módulos JavaScript e service workers. Em produção, use HTTPS. Os caminhos relativos permitem hospedar também em um subdiretório do GitHub Pages.

### Executável Windows

O arquivo gerado localmente fica em `artifacts/CalculadoraIPv4.exe`. Abra por duplo clique ou pelo terminal:

```powershell
.\artifacts\CalculadoraIPv4.exe
.\artifacts\CalculadoraIPv4.exe --ip 192.168.10.130 --prefix 26 --details
```

Para gerar novamente no Windows:

```powershell
python -m pip install -r requirements-dev.txt
python scripts/build-exe.py
```

O PyInstaller inclui o interpretador e os módulos necessários no `.exe`. O binário desta entrega é para Windows x64 e não possui assinatura de editor. Os binários ficam fora do histórico Git; o workflow de release os anexa à versão publicada quando uma tag `v*` é enviada.

## Exemplo

Entrada: **192.168.10.130/26**

| Informação | Resultado |
| --- | --- |
| Máscara | `255.255.255.192` |
| Wildcard | `0.0.0.63` |
| Rede / CIDR | `192.168.10.128/26` |
| Broadcast | `192.168.10.191` |
| Primeiro host | `192.168.10.129` |
| Último host | `192.168.10.190` |
| Total de endereços | 64 |
| Hosts utilizáveis | 62 |
| Bloco | 64, no 4º octeto |
| Classificação do IPv4 informado | Host utilizável |

## Como os cálculos funcionam

A implementação calcula os resultados explicitamente. `ipaddress` é a referência dos testes, sem substituir a matemática do núcleo.

1. Separe os octetos e valide sua escrita decimal.
2. Converta o IPv4 para um inteiro: `a × 256³ + b × 256² + c × 256 + d`.
3. Calcule `bits_host = 32 - prefixo` e `total = 2 ** bits_host`.
4. Encontre `rede = (ip_inteiro // total) * total`.
5. Encontre `ultimo_endereco = rede + total - 1`.
6. Calcule `mascara = 2 ** 32 - total` e `wildcard = total - 1`.
7. Converta os inteiros de volta para quatro octetos.

O **tamanho do bloco** é o incremento no octeto em que começam os bits de host. Em `/8`, `/16` e `/24`, o bloco é 256 no octeto seguinte. Em `/32`, o bloco é 1, sem octeto de host. Não confunda bloco no octeto com o total de endereços da rede: em `/20`, por exemplo, o bloco é 16 no 3º octeto e o total é 4.096 endereços.

### Casos especiais e limites

| Prefixo | Regra adotada |
| --- | --- |
| `/0` | Abrange `0.0.0.0` a `255.255.255.255`: 4.294.967.296 endereços. A contagem de hosts é aritmética (`total - 2`), sem afirmar que todo esse espaço seja atribuível. Uso típico: rota padrão. |
| `/1` a `/30` | Rede e broadcast são excluídos da faixa de hosts: `total - 2`. |
| `/31` | Dois endereços utilizáveis em enlace ponto a ponto, conforme RFC 3021. Broadcast de sub-rede não se aplica. |
| `/32` | Um endereço individual. Primeiro e último host são o próprio IPv4; broadcast de sub-rede não se aplica. |

`ipaddress` fornece o último endereço através de `broadcast_address` também em `/31` e `/32`. O projeto mantém esse valor em `last_address`, mas apresenta `broadcast = null` nesses dois casos para distinguir o limite matemático do uso como broadcast.

A classificação **Host utilizável** descreve a posição do IPv4 dentro da sub-rede. Não é uma verificação de disponibilidade, roteabilidade, concessão DHCP ou autorização de uso. A ferramenta não faz varreduras. Blocos especiais como loopback, multicast e reservados não são auditados nesta versão. IPv6, VLSM e divisão de uma rede em várias sub-redes ficam fora do escopo da v1.0.

### Política de entradas

- Quatro octetos decimais ASCII, cada um de `0` a `255`.
- Zeros à esquerda nos octetos são rejeitados: `192.168.001.1` deve ser escrito `192.168.1.1`.
- Espaços ao redor do IPv4 ou do prefixo são removidos; espaços internos são inválidos.
- Prefixos inteiros de `0` a `32`; a validação aceita também `/26`. No campo web, informe apenas o número.
- Campos vazios, sinais, frações, caracteres Unicode que parecem números e octetos extras são inválidos.

## Nossa Calculadora IPv4 foi desenvolvida com

### 1. O que foi aprendido e aplicado: Python

| Conceito Python | Como utilizamos |
| --- | --- |
| `input()` | Receber o prefixo, as opções do menu e o IPv4 em entrada redirecionada. |
| `int()` | Converter o texto dos octetos e do prefixo em inteiros. |
| `split(".")` | Separar os quatro octetos do IPv4. |
| `len()` | Verificar a quantidade e o tamanho dos octetos. |
| `if / elif / else` | Validar entradas, classificar o endereço e tratar `/0`, `/31` e `/32`. |
| `for` | Percorrer octetos e montar os resultados. |
| `//` | Encontrar a posição do bloco e separar octetos de um inteiro. |
| `%` | Obter cada octeto ao converter o inteiro em IPv4. |
| `**` | Calcular potências de 2 e de 256. |
| `.copy()` | No código inicial, copiar as listas usadas para rede e broadcast; preservado em `legacy/main_original.py`. O núcleo atual trabalha com inteiros. |
| `".".join()` | Montar um IPv4 a partir de seus octetos. |
| `def` | Criar funções pequenas para validação, cálculo e apresentação. |
| `return` | Retornar valores, encerrar funções e comunicar o código de saída. |
| `try / except` | Tratar entradas inválidas, interrupções e fim de entrada. |
| `raise ValueError` | Comunicar erros de validação com mensagens úteis. |
| `strip()`, `isascii()`, `isdigit()` | Normalizar espaços externos e validar números decimais ASCII. |
| Listas, tuplas e dicionários | Organizar linhas do terminal, etapas e dados exportados. |
| `dataclass(frozen=True)` | Representar o resultado de forma estruturada e imutável. |
| `str \| int`, `str \| None` | Documentar os tipos esperados, inclusive valores não aplicáveis. |
| `argparse` | Oferecer argumentos como `--ip`, `--prefix`, `--details` e `--json`. |
| `json` | Exportar os resultados para integração com outras ferramentas. |
| `msvcrt`, `termios`, `tty` | Ler o teclado sem depender do `input()` tradicional em terminais interativos. |
| `unittest` e `subTest` | Automatizar verificações de fórmulas, bordas e validação. |
| `ipaddress` | Comparar o resultado com a implementação da biblioteca padrão nos testes. |
| `random.Random(42)` | Produzir casos aleatórios reproduzíveis. |
| `if __name__ == "__main__"` | Executar o programa somente quando iniciado como ponto de entrada. |

### 2. Interface e experiência do usuário

| Tecnologia / conceito | Aplicação |
| --- | --- |
| HTML semântico | Formulário, rótulos, botões, detalhes expansíveis e diálogo de instalação. |
| CSS Grid, Flexbox e media queries | Layout para desktop e celular, sem framework visual. |
| Variáveis CSS | Paleta verde, tipografia e espaçamentos consistentes. |
| JavaScript com módulos ES | Separação entre matemática (`calculator.js`) e interface (`app.js`). |
| Eventos `beforeinput`, `input`, `keydown` e `paste` | Controle de digitação, pontos, Backspace e colagem de um IPv4 completo. |
| DOM e `textContent` | Atualizar resultados e construir conteúdo sem interpretar as entradas como HTML. |
| `localStorage` | Histórico limitado aos cinco cálculos recentes, salvo no próprio navegador. |
| Clipboard API e Blob | Copiar resultados e baixar um arquivo de texto. |
| Manifest, service worker e Cache API | Instalação da PWA e cache dos arquivos para uso offline. |
| Acessibilidade | Rótulos por octeto, mensagens de erro, foco visível, teclado e anúncios de resultado. |
| Node.js e `node:test` | Build estático e testes JavaScript. |
| jsdom | Testar o formulário e os eventos em um DOM simulado; não substitui teste visual em navegador real. |
| Prettier | Manter HTML, CSS e JavaScript formatados para facilitar a leitura do código. |

### 3. Ferramentas de desenvolvimento e distribuição

| Ferramenta | Uso |
| --- | --- |
| Visual Studio Code | Ambiente em que o projeto Python inicial foi desenvolvido. |
| Python | Linguagem do núcleo e do terminal. |
| Node.js e npm | Executar scripts e instalar dependências de teste com lockfile. |
| PyInstaller | Empacotar o programa como `.exe` para Windows. |
| Pillow | Gerar os ícones PNG da PWA a partir de formas geométricas locais. |
| Git e GitHub | Versionamento e preparação da distribuição do código. |
| GitHub Actions | Workflows de testes, site estático e executável de release. |
| GitHub Pages | Hospedagem pública do site, com publicação pelo workflow. |
| Sites | Preparação de uma publicação hospedada da interface web. |
| Codex / OpenAI | Assistência na revisão, implementação, documentação e automação dos testes. |

Os conceitos da primeira versão permanecem documentados. A evolução não significa que toda técnica do exercício original continue no caminho principal de execução; a coluna de aplicação explicita essa diferença.

## Testar

```powershell
python -m unittest discover -s tests -v
npm ci
npm test
npm run build
```

Os testes Python comparam **1.165 casos** com `ipaddress`: cinco endereços de borda para cada um dos 33 prefixos, mais mil casos aleatórios reproduzíveis. Os testes JavaScript comparam **561 casos** com o núcleo Python. Há verificações de classificação, octetos inválidos, Unicode, zeros à esquerda, leitura controlada, formulário, colagem CIDR, histórico, `/0`, `/31`, `/32` e arquivos de cache/ícones.

Não se enumeram bilhões de hosts para testar `/0`; os limites e as contagens são verificados diretamente. Os testes de interface usam DOM simulado. A instalação em Android e a aparência em dispositivos reais exigem conferência em navegador real.

## Organização

```text
main.py                    Entrada do terminal e do executável
ipv4calc/core.py           Validação, matemática e etapas didáticas
ipv4calc/cli.py            Teclado, menu e argumentos
web/                      HTML, CSS, JavaScript e PWA
web/.openai/hosting.json   Configuração da publicação Sites
tests/                    Testes Python, JavaScript e DOM
scripts/                  Build do site, ícones e executável
docs/                     Notas de release e validação
legacy/                   Código inicial e experimentos preservados
.github/workflows/        Testes, Pages e release Windows
artifacts/                Binário local e pacotes; ignorados pelo Git
```

Para regenerar os ícones: `python scripts/generate-icons.py` após instalar `requirements-dev.txt`. Os PNGs já estão incluídos no código; esse passo não é necessário para usar ou publicar o site.

## Publicar no GitHub

O projeto está em [`LeoDevsn/subnetting-calculator`](https://github.com/LeoDevsn/subnetting-calculator), com GitHub Pages configurado para usar Actions. Para reproduzir a publicação em outro repositório:

1. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** como fonte.
2. O workflow `pages.yml` testa e compila `web/dist`, depois publica o conteúdo estático.
3. Para uma release, envie a tag `v1.0.0`. O workflow Windows gera e verifica o executável, cria a release e anexa `.exe` e SHA-256.

Os workflows precisam das permissões usuais do repositório para Actions e Pages. A existência dos arquivos de workflow, por si só, não confirma uma publicação. Consulte a aba **Actions** para verificar o resultado da execução.

## Referências

- [Biblioteca padrão Python: ipaddress](https://docs.python.org/3/library/ipaddress.html)
- [RFC 3021: prefixos /31 em enlaces ponto a ponto](https://www.rfc-editor.org/rfc/rfc3021)
- [MDN: tornar uma PWA instalável](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [PyInstaller: gerar executáveis](https://pyinstaller.org/en/stable/usage.html)
- [GitHub Pages com workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Licença

[MIT](LICENSE) · Copyright 2026 Leonardo Santos.
