# LP Empresas · Rei das Barras de Apoio

Landing page para empresas, com foco em pedido de cotação. Produto em destaque: **Barra de apoio reta de 40 cm em inox 304**.

É uma página estática (HTML, CSS e JS puros, sem build). A loja continua na Nuvemshop: preço, seleção de tamanho, estoque, carrinho e checkout não foram alterados. Os botões levam para as páginas da loja.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `index.html` | A página inteira (textos, seções, formulário) |
| `assets/css/styles.css` | Visual (cores da logo, fonte Barlow da loja, layout responsivo) |
| `assets/js/main.js` | Formulário, envio para o n8n, WhatsApp, eventos de analytics, animações |
| `assets/img/` | Logo original da loja e fotos do catálogo da loja (versões 1024px e 640px) |

## Como ver a página

Abra o `index.html` no navegador. Também funciona em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages): é só publicar a pasta inteira. **Ainda não foi publicada em produção.**

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
| `produtos` | Um valor por item marcado (pode vir repetido) |
| `produtos_lista` | Os mesmos itens numa linha só, separados por vírgula |
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
| "Adicionar à cotação" | `select_content` com `content_type: "quote_item"` | — |
| Formulário enviado ao n8n com sucesso | `generate_lead` com `method: "formulario"` | `Lead` |
| Envio pelo WhatsApp (modo sem webhook ou com erro) | `generate_lead` com `method: "whatsapp"` | `Lead` |

São nomes de evento padrão do GA4 e da Meta. Nenhum ID de pixel foi criado. Para ativar, basta incluir no `<head>` o GTM ou o GA4 (`G-V5VE9T3KRV`) e o Pixel (`1330635941915774`) que já existem na loja.

## Testes feitos

- Navegador real (Chromium) em 320, 390, 768 e 1440 px: sem rolagem horizontal; títulos com no máximo 2 linhas.
- Todas as âncoras internas, o link do produto e todos os links externos testados (respondem 200, menos o Instagram, que bloqueia robôs).
- Formulário: validação dos obrigatórios, máscaras de WhatsApp e CEP, envio multipart para um webhook de teste (sucesso e erro 500), modo WhatsApp e eventos no dataLayer.
- Acessibilidade: axe-core sem violações (390, 768 e 1440 px), navegação por teclado, foco visível, `prefers-reduced-motion`, e a página funciona sem JavaScript.
- Autoteste rápido: abra `index.html?selftest` e veja o console (`selftest ok`).

## Pontos para o cliente confirmar

- **SKU** da barra reta inox está vazio na Nuvemshop. A integração usa o ID do produto e o ID da variação.
- **Inox 304** só é afirmado para a barra reta (ficha técnica confirmada). Nos outros modelos a página diz apenas "inox".
- **Fotos**: vêm do catálogo da loja. Várias parecem imagens geradas/renderizadas (uma do catálogo parece ter marca d’água de IA e não foi usada). Vale trocar por fotos reais de instalações quando houver.
- A **política de privacidade** da loja (linkada no formulário) ainda tem o texto "SITE AQUI" no lugar do nome do site.
- A loja tem um banner "Instalação segura & profissional", mas a LP diz que a instalação **não** está incluída (conforme o briefing).
- A loja mostra um carrossel de logos de clientes (Itaú, Ambev, Droga Raia etc.). Eles ficaram de fora porque não há confirmação de uso. Dá para incluir se o cliente aprovar.
- Endereço da loja física, telefone, e-mail e CNPJ foram copiados do rodapé da loja.
