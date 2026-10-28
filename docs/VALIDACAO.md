# Validação da versão 1.0

Ambiente local: Windows 11 x64, Python 3.14.3 e Node.js 24.14.0.

## Verificações automatizadas

- Núcleo Python: cinco IPv4 de borda para cada prefixo `/0` a `/32`, mais mil casos aleatórios com semente fixa. **1.165 comparações** com `ipaddress`.
- Núcleo JavaScript: **561 comparações** com os mesmos resultados estruturados do Python, incluindo endereços acima de `2³¹` e os limites `0` e `2³² - 1`.
- Validação de entradas: octetos extras ou ausentes, vazios, valores acima de 255, sinais, frações, Unicode, zeros à esquerda e CIDR fora da faixa.
- Terminal: JSON com acentuação UTF-8, códigos de saída, leitura de teclas, repetição de cálculo e consulta às etapas.
- DOM simulado com jsdom: formulário, `/0`, `/31`, `/32`, erros, colagem IPv4/CIDR, histórico, limpeza e navegação por pontos.
- PWA: existência de todos os arquivos declarados para cache, dimensões dos ícones e comportamento do service worker em ambiente simulado sem rede. A limpeza de caches preserva os caches de outras aplicações.
- Executável Windows: execução real com argumentos e conferência dos resultados em `/26`, `/0`, `/31` e `/32`, além do código de erro para IPv4 inválido.

## Limites da verificação

O controle do navegador foi encerrado pela infraestrutura por não conseguir confirmar a URL atual no Windows. Por isso, não foi possível fazer a inspeção visual em navegador real nesta sessão. Os testes de DOM e service worker são simulados e não comprovam a instalação no Android.

A interface tem regras responsivas para desktop e celular, foco visível, rótulos de campos e anúncios de resultado. Aparência final, teclado virtual e instalação devem ser conferidos também em um dispositivo real.

## Reproduzir

```powershell
python -m unittest discover -s tests -v
npm ci
npm test
npm run build
```

Para conferir a interface manualmente: `npm run preview`, seguido de `http://127.0.0.1:4173` no navegador. Para conferir o executável: `artifacts/CalculadoraIPv4.exe --ip 192.168.10.130 --prefix 26 --json`.
