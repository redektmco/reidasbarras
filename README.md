# LP Empresas · Rei das Barras de Apoio

Landing page para empresas, com foco em pedido de cotação. Produto em destaque: **Barra de apoio reta de 40 cm em inox 304**.

É uma página estática (HTML, CSS e JS puros, sem build). A loja continua na Nuvemshop: preço, seleção de tamanho, estoque, carrinho e checkout não foram alterados. Os botões levam para as páginas da loja.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `index.html` | A página inteira (textos, seções, formulário) |
| `assets/css/styles.css` | Visual: azul da logo, curvas, efeito de inox, animações, layout responsivo (fonte Barlow da loja) |
| `assets/js/main.js` | Cotação flutuante, seletor de tamanho, assistente, ambientes clicáveis, CEP, formulário, n8n, WhatsApp, analytics |
| `assets/img/` | Logo original da loja e fotos do catálogo da loja (versões 1024px e 640px; `scene-*` são recortes quadrados para os ambientes) |

## Interações da página

| Elemento | O que faz |
| --- | --- |
| **Minha cotação** (botão flutuante no desktop, barra fixa no celular) | Junta os itens adicionados em qualquer parte da página, com quantidade, numa gaveta lateral. Os itens ficam salvos no navegador do visitante (localStorage) e vão para o formulário. |
| **Seletor de tamanho** | Escolhe 30 a 150 cm e mostra a barra em escala, com o comprimento total da ficha técnica (tamanho + 7 cm). O botão "Consultar este produto" passa a abrir a variação escolhida na loja. |
| **Cartões de produtos** | Carrossel (setas, arrastar com o mouse, deslizar no celular) com "Adicionar à cotação" e atalhos para a loja. |
| **Assistente (3 passos)** | Ambiente, se já sabe os modelos e quantos ambientes. Sugere categorias (sem prometer adequação à NBR 9050) e adiciona tudo à cotação de uma vez. |
| **Ambientes clicáveis** | Quatro fotos do catálogo (banheiro, lavatório, porta, circulação) com pontos que abrem o produto, o link da loja e "Adicionar à cotação". |
| **CEP** | Consulta a cidade no ViaCEP (serviço público e gratuito). São Paulo capital mostra a mensagem de entrega no mesmo dia "conforme estoque e rota"; as outras cidades, "prazo e frete confirmados na cotação". O CEP do formulário também preenche a cidade sozinho. |

Variações da barra reta inox usadas pelo seletor (produto `81819548`):

| Tamanho | 30 | 40 | 60 | 70 | 80 | 90 | 100 | 120 | 150 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ID da variação | 317879685 | **317879686** | 317879687 | 317879689 | 317879690 | 1523175228 | 1523175229 | 1523175230 | 1523175233 |

## Como ver a página

Publicada em **https://reidasbarras.vercel.app** (projeto `reidasbarras` na Vercel, ligado a este repositório). Todo push na `main` publica automaticamente. Para ver localmente, abra o `index.html` no navegador.

## Produto em destaque (Nuvemshop)

| Item | Valor confirmado na loja |
| --- | --- |
| Produto | Barra reta - tradicional - inox |
| ID do produto | `81819548` |
| ID da variação 40 cm | `317879686` |
| SKU | **vazio na loja** (nenhuma variação tem SKU cadastrado) |
| Especificação | Aço inox 304, polido, tubo de 32 mm (ficha técnica da loja) |
| Link usado no botão "Consultar este produto" | `https://www.reidasbarrasdeapoio.com.br/produtos/barra-reta-tradicional-inox/?variant=317879686` |

O parâmetro `?variant=317879686` abre a página do produto com 40 cm já selecionado (testado no navegador). As outras medidas, o carrinho e o checkout continuam iguais.

## Formulário → n8n

1. No n8n, crie um nó **Webhook** com método **POST** e copie a URL de produção.
2. Nas opções do Webhook, em **Allowed Origins (CORS)**, coloque o domínio onde a LP vai ficar (ou `*` durante os testes).
3. No `index.html`, procure o comentário `WEBHOOK DO N8N` e cole a URL no atributo `action` do formulário:
   ```html
   <form id="form-cotacao" class="form" action="https://SEU-N8N/webhook/cotacao-empresas" ...>
   ```
4. Responda com status 200 no n8n (o padrão "Respond immediately" serve). Qualquer outro status mostra ao cliente a opção de enviar pelo WhatsApp.

**Enquanto o `action` estiver vazio**, o formulário valida os campos e abre o WhatsApp oficial com a mensagem já preenchida. A página funciona desde já.

### Campos enviados (multipart/form-data)

| Campo | Conteúdo |
| --- | --- |
| `nome`, `empresa`, `whatsapp`, `cidade`, `cep` | Obrigatórios |
| `produtos` | Um valor por item da cotação (vem repetido) |
| `produtos_lista` | Os itens numa linha só, com a quantidade: `Barra reta inox 304 – 40 cm (10); Piso tátil (1)` |
| `itens_json` | Os mesmos itens em JSON: `[{"name":"Barra reta inox 304 – 40 cm","qty":10}]` |
| `produtos_detalhes`, `quantidade`, `prazo`, `medidas` | Opcionais |
| `anexos` | Fotos/lista (até 5 arquivos, 10 MB no total) |
| `origem` | Sempre `lp-empresas` |
| `pagina` | URL completa da página no envio |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` | Copiados da URL, se existirem |
| `site` | Campo anti-spam: se vier preenchido, é robô |

O limite padrão de upload do n8n é 16 MB. Se vocês mudarem o limite de 10 MB na página, ajustem também o n8n.

## WhatsApp

Todos os links usam o número oficial que já está na loja: **(11) 99774-9088** (`wa.me/5511997749088`). Cada botão abre a conversa com uma mensagem pronta diferente.

## Analytics

A página **não carrega nenhum script de analytics**, como combinado. Mesmo assim, ela registra os eventos:

- `dataLayer.push(...)`: entra no GTM se ele for instalado (a loja usa `GTM-N2B8HHM`).
- `gtag(...)` e `fbq(...)`: só disparam se esses scripts já estiverem na página.

| Quando | Evento GA4 / dataLayer | Evento Meta |
| --- | --- | --- |
| Clique em qualquer CTA | `select_content` com `content_type: "cta"` e `content_id` (ex.: `hero_orcamento`) | — |
| Clique em link de WhatsApp | `select_content` com `content_type: "whatsapp"` | `Contact` |
| "Adicionar à cotação" (cartões, seletor, ambientes, assistente) | `select_content` com `content_type: "quote_item"` | — |
| Troca de tamanho, passos do assistente, pontos dos ambientes, consulta de CEP | `select_content` com `content_type` `tamanho_barra`, `quiz`, `hotspot`, `ambiente` ou `cep` | — |
| Formulário enviado ao n8n com sucesso | `generate_lead` com `method: "formulario"` | `Lead` |
| Envio pelo WhatsApp (modo sem webhook ou com erro) | `generate_lead` com `method: "whatsapp"` | `Lead` |

São nomes de evento padrão do GA4 e da Meta. Nenhum ID de pixel foi criado. Para ativar, basta incluir no `<head>` o GTM ou o GA4 (`G-V5VE9T3KRV`) e o Pixel (`1330635941915774`) que já existem na loja.

## Testes feitos

- 73 testes automáticos em navegador real (Chromium): seletor de tamanho (variação e medidas certas), carrossel, assistente, ambientes (inclusive pelo teclado), CEP (capital, outra cidade, CEP inexistente), gaveta com quantidades, formulário (validação, máscaras, envio multipart para webhook de teste com sucesso e erro 500, modo WhatsApp) e eventos no dataLayer.
- Sem rolagem horizontal em 320, 390, 768, 1024 e 1440 px. O título "Consulte prazo e disponibilidade para sua cidade" ocupa 3 linhas em algumas larguras (texto do briefing mantido).
- Acessibilidade: axe-core sem violações (390 e 1440 px), navegação por teclado, foco visível, `prefers-reduced-motion` (a página fica completa e sem movimento) e conteúdo visível sem JavaScript.
- Autoteste rápido: abra `index.html?selftest` e veja o console (`selftest ok`).

## Pontos para o cliente confirmar

- **SKU** da barra reta inox está vazio na Nuvemshop. A integração usa o ID do produto e o ID da variação.
- **Inox 304** só é afirmado para a barra reta (ficha técnica confirmada). Nos outros modelos a página diz apenas "inox".
- **Fotos**: vêm do catálogo da loja. Várias parecem imagens geradas/renderizadas (uma do catálogo parece ter marca d’água de IA e não foi usada). Vale trocar por fotos reais de instalações quando houver.
- A **política de privacidade** da loja (linkada no formulário) ainda tem o texto "SITE AQUI" no lugar do nome do site.
- A loja tem um banner "Instalação segura & profissional", mas a LP diz que a instalação **não** está incluída (conforme o briefing).
- A loja mostra um carrossel de logos de clientes (Itaú, Ambev, Droga Raia etc.). Eles ficaram de fora porque não há confirmação de uso. Dá para incluir se o cliente aprovar.
- Endereço da loja física, telefone, e-mail e CNPJ foram copiados do rodapé da loja.
