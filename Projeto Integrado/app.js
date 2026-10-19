// Sem banco de dados: usuários ficam no localStorage e a sessão no sessionStorage.

function getUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios") || "[]");
}

function getSessao() {
  return JSON.parse(sessionStorage.getItem("usuarioLogado") || "null");
}

const formCadastro = document.getElementById("form-cadastro");
if (formCadastro) {
  formCadastro.addEventListener("submit", function (e) {
    e.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const usuarios = getUsuarios();

    if (usuarios.some(u => u.email === email)) {
      document.getElementById("mensagem").textContent = "E-mail já cadastrado.";
      return;
    }

    usuarios.push({ nome, email, senha });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    window.location.href = "login.html";
  });
}

const formLogin = document.getElementById("form-login");
if (formLogin) {
  formLogin.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const usuario = getUsuarios().find(u => u.email === email && u.senha === senha);

    if (!usuario) {
      document.getElementById("mensagem").textContent = "E-mail ou senha inválidos.";
      return;
    }

    sessionStorage.setItem("usuarioLogado", JSON.stringify({ nome: usuario.nome, email: usuario.email }));
    window.location.href = "tarefas.html"; 
  });
}

const listaTarefas = document.getElementById("lista-tarefas");
if (listaTarefas) {
  const sessao = getSessao();

  if (!sessao) {
    window.location.href = "login.html";
  } else {
    iniciarTarefas(sessao);
  }
}

function iniciarTarefas(sessao) {
  document.getElementById("nome-usuario").textContent = sessao.nome;

  document.getElementById("sair").addEventListener("click", function (e) {
    e.preventDefault();
    sessionStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
  });

  const STATUS_TEXTO = { PENDENTE: "Pendente", EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída" };

  const form = document.getElementById("form-tarefa");
  const campoId = document.getElementById("tarefa-id");
  const campoTitulo = document.getElementById("titulo");
  const campoDescricao = document.getElementById("descricao");
  const campoPrazo = document.getElementById("prazo");
  const campoStatus = document.getElementById("status");
  const mensagem = document.getElementById("mensagem");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const tituloForm = document.getElementById("titulo-form");
  const filtro = document.getElementById("filtro-status");

  function lerTarefas() {
    return JSON.parse(localStorage.getItem("tarefas") || "[]");
  }
  function salvarTarefas(tarefas) {
    localStorage.setItem("tarefas", JSON.stringify(tarefas));
  }

  function hoje() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function formatarData(iso) {
    return iso ? iso.split("-").reverse().join("/") : "-";
  }

  function mostrarTarefas() {
    const status = filtro.value;
    const minhas = lerTarefas().filter(t => t.dono === sessao.email && (status === "" || t.status === status));

    listaTarefas.innerHTML = "";

    if (minhas.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.textContent = "Nenhuma tarefa encontrada.";
      tr.appendChild(td);
      listaTarefas.appendChild(tr);
      return;
    }

    minhas.forEach(t => {
      const tr = document.createElement("tr");

      [t.titulo, t.descricao || "-", formatarData(t.criacao), formatarData(t.prazo), STATUS_TEXTO[t.status]].forEach(valor => {
        const td = document.createElement("td");
        td.textContent = valor;
        tr.appendChild(td);
      });

      const tdAcoes = document.createElement("td");
      const div = document.createElement("div");
      div.className = "acoes";

      if (t.status !== "CONCLUIDA") {
        div.appendChild(criarBotao("Concluir", "concluir", t.id));
      }
      div.appendChild(criarBotao("Editar", "editar", t.id));
      div.appendChild(criarBotao("Excluir", "excluir", t.id));

      tdAcoes.appendChild(div);
      tr.appendChild(tdAcoes);
      listaTarefas.appendChild(tr);
    });
  }

  function criarBotao(texto, acao, id) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = texto;
    b.dataset.acao = acao;
    b.dataset.id = id;
    return b;
  }

  function limparFormulario() {
    form.reset();
    campoId.value = "";
    mensagem.textContent = "";
    tituloForm.textContent = "Nova tarefa";
    btnSalvar.textContent = "Adicionar tarefa";
    btnCancelar.hidden = true;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    mensagem.textContent = "";

    const titulo = campoTitulo.value.trim();
    const descricao = campoDescricao.value.trim();
    const prazo = campoPrazo.value;
    const status = campoStatus.value;
    const editando = campoId.value !== "";
    const tarefas = lerTarefas();

    if (titulo === "") {
      mensagem.textContent = "O título é obrigatório.";
      return;
    }

    if (editando) {
      const t = tarefas.find(x => x.id === Number(campoId.value) && x.dono === sessao.email);
      if (!t) return;

      if (prazo && prazo < t.criacao) {
        mensagem.textContent = "O prazo não pode ser anterior à data de criação.";
        return;
      }
      t.titulo = titulo;
      t.descricao = descricao;
      t.prazo = prazo;
      t.status = status;
    } else {
      const criacao = hoje();

      if (prazo && prazo < criacao) {
        mensagem.textContent = "O prazo não pode ser anterior à data de criação.";
        return;
      }
      tarefas.push({
        id: Date.now(),        
        dono: sessao.email,      
        titulo, descricao, criacao, prazo, status
      });
    }

    salvarTarefas(tarefas);
    limparFormulario();
    mostrarTarefas();
  });

  btnCancelar.addEventListener("click", limparFormulario);

  listaTarefas.addEventListener("click", function (e) {
    const botao = e.target.closest("button");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    const tarefas = lerTarefas();
    const t = tarefas.find(x => x.id === id && x.dono === sessao.email);
    if (!t) return;

    if (botao.dataset.acao === "editar") {
      campoId.value = t.id;
      campoTitulo.value = t.titulo;
      campoDescricao.value = t.descricao;
      campoPrazo.value = t.prazo;
      campoStatus.value = t.status;
      tituloForm.textContent = "Editar tarefa";
      btnSalvar.textContent = "Salvar alterações";
      btnCancelar.hidden = false;
      mensagem.textContent = "";
      campoTitulo.focus();
    }

    if (botao.dataset.acao === "concluir") {
      t.status = "CONCLUIDA";
      salvarTarefas(tarefas);
      mostrarTarefas();
    }

    if (botao.dataset.acao === "excluir") {
      if (confirm('Excluir a tarefa "' + t.titulo + '"?')) {
        salvarTarefas(tarefas.filter(x => x.id !== id));
        if (campoId.value === String(id)) limparFormulario();
        mostrarTarefas();
      }
    }
  });

  document.getElementById("form-filtro").addEventListener("submit", function (e) {
    e.preventDefault();
    mostrarTarefas();
  });

  mostrarTarefas();
}