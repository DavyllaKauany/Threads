// ===== utilidades =====
let eu = null; // usuário logado

// Atalho para o painel que recebe o conteúdo das telas.
const conteudo = () => document.getElementById("conteudo");

// Cliente HTTP da API: envia JSON quando necessário, trata erros e redireciona sessões expiradas.
async function api(url, metodo = "GET", corpo) {
  const resposta = await fetch(url, {
    method: metodo,
    headers: corpo ? { "Content-Type": "application/json" } : {},
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  if (resposta.status === 401) {
    location.href = "/login.html";
    throw new Error("Faça login para continuar.");
  }
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || "Erro inesperado.");
  return dados;
}

// Evita que o texto digitado vire HTML
function esc(texto) {
  return String(texto).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function tempo(iso) {
  // Mostra datas em formato curto para caber nos cartões e listas.
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return Math.floor(s / 60) + " min";
  if (s < 86400) return Math.floor(s / 3600) + " h";
  return Math.floor(s / 86400) + " d";
}

const inicial = nome => esc((nome || "?").trim().charAt(0));
// Material Symbols renderiza o nome do ícone como glifo; aria-hidden evita leitura duplicada.
const icone = nome => `<span class="material-symbols-outlined icone" aria-hidden="true">${nome}</span>`;

// ===== menu =====
const MENU = [
  ["inicio", "Início", "home"],
  ["seguindo", "Seguindo", "group"],
  ["pesquisar", "Pesquisar", "search"],
  ["atividade", "Atividade", "notifications"],
  ["mensagens", "Mensagens", "mail"],
  "-",
  ["salvos", "Salvos", "bookmark"],
  ["curtidas", "Curtidas", "favorite"],
  ["temporarios", "Temporários", "schedule"],
  ["arquivados", "Arquivados", "archive"],
  ["insights", "Insights", "query_stats"]
];

function montarMenu(ativo) {
  // Gera a navegação e destaca a seção atual; o botão sair encerra a sessão no servidor.
  const itens = MENU.map(item => {
    if (item === "-") return '<div class="separador"></div>';
    const [id, rotulo, simbolo] = item;
    return `<a href="/#${id}" class="${id === ativo ? "ativo" : ""}">${icone(simbolo)}<span>${rotulo}</span></a>`;
  }).join("");

  document.getElementById("menu").innerHTML = `
    <div class="logo">@</div>
    ${itens}
    <div class="separador"></div>
    <a href="/perfil.html?u=${esc(eu.usuario)}" class="${ativo === "perfil" ? "ativo" : ""}">${icone("person")}<span>Perfil</span></a>
    <button class="sair" id="btnSair">${icone("logout")}<span>Sair</span></button>
    <div class="quem">Logado como<br><b>@${esc(eu.usuario)}</b></div>`;

  document.getElementById("btnSair").onclick = async () => {
    await api("/api/auth/logout", "POST");
    location.href = "/login.html";
  };
}

// ===== posts =====
function cartaoPost(p) {
  // Monta um cartão de post e inclui ações de gerenciamento apenas para seu autor.
  const donoAcoes = p.meu
    ? `<button data-acao="arquivar" title="${p.arquivado ? "Desarquivar" : "Arquivar"}" aria-label="${p.arquivado ? "Desarquivar" : "Arquivar"}">${icone(p.arquivado ? "unarchive" : "archive")}</button>
       <button data-acao="apagar" title="Apagar" aria-label="Apagar">${icone("delete")}</button>`
    : "";
  return `
    <article class="post" data-id="${p.id}">
      <a class="avatar" href="/perfil.html?u=${esc(p.autor.usuario)}">${inicial(p.autor.nome)}</a>
      <div class="corpo">
        <div class="topo">
          <a class="nome" href="/perfil.html?u=${esc(p.autor.usuario)}">${esc(p.autor.usuario)}</a>
          <span class="tempo">${tempo(p.createdAt)}</span>
          ${p.expiraEm ? '<span class="selo">24h</span>' : ""}
          ${p.arquivado ? '<span class="selo">arquivado</span>' : ""}
        </div>
        <div class="texto">${esc(p.texto)}</div>
        <div class="acoes">
          <button data-acao="curtir" class="${p.curtido ? "ativo" : ""}" aria-label="${p.curtido ? "Descurtir" : "Curtir"} (${p.curtidas})">${icone(p.curtido ? "favorite" : "favorite_border")} <span>${p.curtidas}</span></button>
          <button data-acao="comentar" aria-label="Comentar (${p.comentarios})">${icone("chat_bubble_outline")} <span>${p.comentarios}</span></button>
          <button data-acao="salvar" class="salvo ${p.salvo ? "ativo" : ""}" aria-label="${p.salvo ? "Remover dos salvos" : "Salvar"}">${icone(p.salvo ? "bookmark" : "bookmark_border")}<span>${p.salvo ? "Salvo" : ""}</span></button>
          ${donoAcoes}
        </div>
        <div class="comentarios" hidden></div>
      </div>
    </article>`;
}

async function listaDePosts(params, mensagemVazia) {
  // Busca posts com os filtros fornecidos e apresenta uma mensagem quando não há resultados.
  const posts = await api("/api/posts?" + new URLSearchParams(params).toString());
  return posts.length
    ? posts.map(cartaoPost).join("")
    : `<div class="vazio">${mensagemVazia}</div>`;
}

async function carregarComentarios(art) {
  // Carrega comentários de um post e cria o formulário para adicionar outro.
  const caixa = art.querySelector(".comentarios");
  const lista = await api(`/api/posts/${art.dataset.id}/comentarios`);
  caixa.innerHTML =
    (lista.map(c => `
      <div class="comentario"><b>${esc(c.autor.usuario)}</b>${esc(c.texto)}<span class="tempo">${tempo(c.createdAt)}</span></div>`
    ).join("") || '<div class="comentario tempo">Nenhum comentário ainda.</div>') +
    `<form data-form="comentario">
       <input maxlength="500" placeholder="Responder..." required>
       <button class="botao">Enviar</button>
     </form>`;
}

// Cliques nos botões de cada post
document.addEventListener("click", async e => {
  const botao = e.target.closest("[data-acao]");
  if (!botao) return;
  const art = botao.closest(".post");
  if (!art) return;
  const id = art.dataset.id;

  try {
    // data-acao identifica a operação sem criar um listener separado para cada post.
    switch (botao.dataset.acao) {
      case "curtir": {
        const r = await api(`/api/posts/${id}/curtir`, "POST");
        botao.classList.toggle("ativo", r.curtido);
        botao.setAttribute("aria-label", `${r.curtido ? "Descurtir" : "Curtir"} (${r.curtidas})`);
        botao.innerHTML = `${icone(r.curtido ? "favorite" : "favorite_border")} <span>${r.curtidas}</span>`;
        break;
      }
      case "salvar": {
        const r = await api(`/api/posts/${id}/salvar`, "POST");
        botao.classList.toggle("ativo", r.salvo);
        botao.setAttribute("aria-label", r.salvo ? "Remover dos salvos" : "Salvar");
        botao.innerHTML = `${icone(r.salvo ? "bookmark" : "bookmark_border")}<span>${r.salvo ? "Salvo" : ""}</span>`;
        break;
      }
      case "comentar": {
        const caixa = art.querySelector(".comentarios");
        if (!caixa.hidden) { caixa.hidden = true; break; }
        await carregarComentarios(art);
        caixa.hidden = false;
        caixa.querySelector("input").focus();
        break;
      }
      case "arquivar":
        await api(`/api/posts/${id}/arquivar`, "POST");
        art.remove();
        break;
      case "apagar":
        if (confirm("Apagar este post?")) {
          await api(`/api/posts/${id}`, "DELETE");
          art.remove();
        }
        break;
    }
  } catch (err) {
    alert(err.message);
  }
});

// Envio dos formulários (postar, comentar, mensagem)
document.addEventListener("submit", async e => {
  const form = e.target.closest("[data-form]");
  if (!form) return;
  e.preventDefault();

  try {
    // data-form informa qual endpoint usar para cada formulário da interface.
    if (form.dataset.form === "postar") {
      const texto = form.querySelector("textarea").value.trim();
      if (!texto) return;
      await api("/api/posts", "POST", { texto, temporario: form.querySelector("[name=temporario]").checked });
      await rotear();
    }

    if (form.dataset.form === "comentario") {
      const art = form.closest(".post");
      const campo = form.querySelector("input");
      const r = await api(`/api/posts/${art.dataset.id}/comentarios`, "POST", { texto: campo.value });
      const botaoComentar = art.querySelector('[data-acao="comentar"]');
      botaoComentar.setAttribute("aria-label", `Comentar (${r.comentarios})`);
      botaoComentar.innerHTML = `${icone("chat_bubble_outline")} <span>${r.comentarios}</span>`;
      await carregarComentarios(art);
      art.querySelector(".comentarios input").focus();
    }

    if (form.dataset.form === "mensagem") {
      const campo = form.querySelector("input");
      await api(`/api/mensagens/${form.dataset.usuario}`, "POST", { texto: campo.value });
      await telaConversa(form.dataset.usuario);
    }
  } catch (err) {
    alert(err.message);
  }
});

// Contador de caracteres da caixa de postar
document.addEventListener("input", e => {
  if (!e.target.matches('[data-form="postar"] textarea')) return;
  const form = e.target.closest("form");
  const total = e.target.value.length;
  const contador = form.querySelector(".contador");
  contador.textContent = `${total}/500`;
  contador.classList.toggle("estourou", total > 500);
  form.querySelector(".botao").disabled = total === 0 || total > 500;
});

// ===== telas =====
async function telaFeed(titulo, filtro, vazio, comCaixa) {
  // Reaproveita a mesma montagem para o início e para as listas filtradas.
  const caixa = comCaixa ? `
    <form class="compor" data-form="postar">
      <textarea placeholder="Iniciar um thread..." maxlength="600"></textarea>
      <div class="rodape">
        <label><input type="checkbox" name="temporario"> Post temporário (24h)</label>
        <span class="espaco"></span>
        <span class="contador">0/500</span>
        <button class="botao" disabled>Publicar</button>
      </div>
    </form>` : "";
  const posts = await listaDePosts({ filtro }, vazio);
  conteudo().innerHTML = `<h1>${titulo}</h1>${caixa}${posts}`;
}

async function telaPesquisar() {
  conteudo().innerHTML = `
    <h1>Pesquisar</h1>
    <div class="busca"><input id="campoBusca" placeholder="Buscar pessoas e posts..." autocomplete="off"></div>
    <div id="resultados"><div class="vazio">Digite para buscar.</div></div>`;

  // Aguarda uma pausa na digitação antes de consultar a API (debounce).
  let espera;
  document.getElementById("campoBusca").addEventListener("input", e => {
    clearTimeout(espera);
    espera = setTimeout(() => buscar(e.target.value.trim()), 250);
  });
  document.getElementById("campoBusca").focus();
}

async function buscar(q) {
  const caixa = document.getElementById("resultados");
  if (!q) { caixa.innerHTML = '<div class="vazio">Digite para buscar.</div>'; return; }

  // Pesquisas de pessoas e posts são independentes, então rodam em paralelo.
  const [pessoas, posts] = await Promise.all([
    api("/api/usuarios?q=" + encodeURIComponent(q)),
    listaDePosts({ q }, "Nenhum post encontrado.")
  ]);

  const htmlPessoas = pessoas.length
    ? `<div class="subtitulo">Pessoas</div>` + pessoas.map(u => `
        <a class="item" href="/perfil.html?u=${esc(u.usuario)}">
          <div class="avatar">${inicial(u.nome)}</div>
          <div class="info"><b>${esc(u.nome)}</b><span>@${esc(u.usuario)}</span></div>
        </a>`).join("")
    : "";
  caixa.innerHTML = htmlPessoas + `<div class="subtitulo">Posts</div>` + posts;
}

async function telaAtividade() {
  const lista = await api("/api/atividades");
  conteudo().innerHTML = `<h1>Atividade</h1>` + (lista.length
    ? lista.map(a => `
        <a class="item" href="/perfil.html?u=${esc(a.de.usuario)}">
          <div class="avatar">${inicial(a.de.nome)}</div>
          <div class="info"><b>${esc(a.de.nome)}</b><span>${esc(a.texto)} · ${tempo(a.createdAt)}</span></div>
        </a>`).join("")
    : '<div class="vazio">Nenhuma atividade ainda.</div>');
}

async function telaMensagens() {
  const [usuarios, conversas] = await Promise.all([api("/api/usuarios"), api("/api/mensagens/conversas")]);
  const ultima = new Map(conversas.map(c => [c.usuario, c]));

  // quem já tem conversa aparece primeiro
  const outros = usuarios.filter(u => u.usuario !== eu.usuario).sort((a, b) =>
    (ultima.has(b.usuario) ? 1 : 0) - (ultima.has(a.usuario) ? 1 : 0));

  conteudo().innerHTML = `<h1>Mensagens</h1>` + outros.map(u => {
    const c = ultima.get(u.usuario);
    const previa = c ? (c.minha ? "Você: " : "") + c.ultima : "Toque para conversar";
    return `
      <a class="item" href="/#mensagens/${esc(u.usuario)}">
        <div class="avatar">${inicial(u.nome)}</div>
        <div class="info"><b>${esc(u.nome)}</b><span>${esc(previa)}</span></div>
      </a>`;
  }).join("");
}

async function telaConversa(usuario) {
  const r = await api(`/api/mensagens/${encodeURIComponent(usuario)}`);
  conteudo().innerHTML = `
    <div class="chat-topo"><button onclick="location.hash='mensagens'">← Voltar</button> ${esc(r.com.nome)}</div>
    <div class="chat-lista" id="chatLista">
      ${r.mensagens.map(m => `<div class="bolha ${m.minha ? "minha" : ""}">${esc(m.texto)}</div>`).join("")
        || '<div class="vazio">Nenhuma mensagem ainda. Diga oi!</div>'}
    </div>
    <form class="chat-form" data-form="mensagem" data-usuario="${esc(r.com.usuario)}">
      <input placeholder="Mensagem..." maxlength="500" required>
      <button class="botao">Enviar</button>
    </form>`;
  const lista = document.getElementById("chatLista");
  lista.scrollTop = lista.scrollHeight;
  conteudo().querySelector(".chat-form input").focus();
}

async function telaInsights() {
  const d = await api("/api/atividades/insights");
  const cartoes = [
    ["Posts publicados", d.posts],
    ["Curtidas recebidas", d.curtidasRecebidas],
    ["Comentários recebidos", d.comentariosRecebidos],
    ["Seguidores", d.seguidores],
    ["Seguindo", d.seguindo],
    ["Posts salvos", d.salvos],
    ["Mensagens enviadas", d.mensagens]
  ];
  conteudo().innerHTML = `<h1>Insights</h1><div class="cartoes">` +
    cartoes.map(([rotulo, valor]) => `<div class="cartao"><b>${valor}</b><span>${rotulo}</span></div>`).join("") +
    `</div>`;
}

const TELAS = {
  inicio: () => telaFeed("Início", "paraVoce", "Nenhum post ainda. Seja o primeiro!", true),
  seguindo: () => telaFeed("Seguindo", "seguindo", "Siga pessoas para ver os posts delas aqui.", false),
  pesquisar: telaPesquisar,
  atividade: telaAtividade,
  mensagens: telaMensagens,
  salvos: () => telaFeed("Salvos", "salvos", "Você ainda não salvou nenhum post.", false),
  curtidas: () => telaFeed("Curtidas", "curtidas", "Você ainda não curtiu nenhum post.", false),
  temporarios: () => telaFeed("Temporários", "temporarios", "Nenhum post temporário ativo.", false),
  arquivados: () => telaFeed("Arquivados", "arquivados", "Nenhum post arquivado.", false),
  insights: telaInsights
};

// Lê o # da URL (ex.: #salvos ou #mensagens/isaac) e mostra a tela certa
async function rotear() {
  const [secao, extra] = (location.hash.slice(1) || "inicio").split("/");
  // Hash da URL escolhe a tela; hash inválido volta ao início.
  const nome = TELAS[secao] ? secao : "inicio";
  montarMenu(nome);
  try {
    if (nome === "mensagens" && extra) await telaConversa(extra);
    else await TELAS[nome]();
  } catch (err) {
    conteudo().innerHTML = `<div class="erro">${esc(err.message)}</div>`;
  }
}

// ===== página de perfil =====
async function telaPerfil() {
  const usuario = new URLSearchParams(location.search).get("u") || eu.usuario;
  montarMenu(usuario === eu.usuario ? "perfil" : "");

  try {
    const p = await api(`/api/usuarios/${encodeURIComponent(usuario)}`);
    const posts = await listaDePosts({ autor: usuario }, "Nenhum post ainda.");

    // O perfil próprio permite edição; perfis de outras pessoas permitem seguir e enviar mensagem.
    const botoes = p.souEu
      ? '<button class="botao claro" id="btnEditar">Editar perfil</button>'
      : `<button class="botao ${p.euSigo ? "claro" : ""}" id="btnSeguir">${p.euSigo ? "Seguindo" : "Seguir"}</button>
         <a class="botao claro" href="/#mensagens/${esc(p.usuario)}" style="display:inline-block">Mensagem</a>`;

    conteudo().innerHTML = `
      <div class="perfil-topo">
        <div class="avatar">${inicial(p.nome)}</div>
        <div class="dados">
          <h2>${esc(p.nome)}</h2>
          <div class="arroba">@${esc(p.usuario)}</div>
          <div class="bio">${esc(p.bio || "Sem bio ainda.")}</div>
          <div class="numeros"><span><b id="numSeguidores">${p.seguidores}</b> seguidores</span><span><b>${p.seguindo}</b> seguindo</span></div>
          ${botoes}
        </div>
      </div>${posts}`;

    if (p.souEu) {
      document.getElementById("btnEditar").onclick = async () => {
        const nome = prompt("Seu nome:", p.nome);
        if (nome === null) return;
        const bio = prompt("Sua bio:", p.bio);
        if (bio === null) return;
        try {
          await api("/api/usuarios/eu", "PUT", { nome, bio });
          eu.nome = nome;
          await telaPerfil();
        } catch (err) { alert(err.message); }
      };
    } else {
      document.getElementById("btnSeguir").onclick = async () => {
        try {
          const r = await api(`/api/usuarios/${encodeURIComponent(p.usuario)}/seguir`, "POST");
          document.getElementById("numSeguidores").textContent = r.seguidores;
          const b = document.getElementById("btnSeguir");
          b.textContent = r.euSigo ? "Seguindo" : "Seguir";
          b.classList.toggle("claro", r.euSigo);
        } catch (err) { alert(err.message); }
      };
    }
  } catch (err) {
    conteudo().innerHTML = `<div class="vazio">${esc(err.message)}</div>`;
  }
}

// ===== começo =====
(async function iniciar() {
  // Confirma a sessão antes de carregar qualquer tela protegida.
  try {
    eu = await api("/api/auth/eu");
  } catch (e) {
    return; // api() já mandou para o login
  }
  if (document.body.dataset.pagina === "perfil") {
    await telaPerfil();
  } else {
    window.addEventListener("hashchange", rotear);
    await rotear();
  }
})();
