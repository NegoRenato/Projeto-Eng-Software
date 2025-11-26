// --- CONFIGURAÇÃO ---
const PONTOS_ACERTO = 100;
const PONTOS_ERRO = 50;
const CUSTO_DICA = 25;

// --- DADOS ---
const dbMapas = [
    { bioma: "Amazônia", img: "assets/imagens/mapa-amazonia.png" },
    { bioma: "Cerrado", img: "assets/imagens/mapa-cerrado.png" },
    { bioma: "Mata Atlântica", img: "assets/imagens/mapa-atlantica.png" },
    { bioma: "Caatinga", img: "assets/imagens/mapa-caatinga.png" },
    { bioma: "Pampas", img: "assets/imagens/mapa-pampas.png" },
    { bioma: "Pantanal", img: "assets/imagens/mapa-pantanal.png" }
];

const dbQuizFase2 = [
    { p: "Qual animal é o maior símbolo dos rios da Amazônia?", o: ["Boto-cor-de-rosa", "Tubarão", "Baleia"], c: 0, img: "assets/imagens/Imagem amazonia.png" },
    { p: "Na Caatinga, qual planta armazena água?", o: ["Samambaia", "Cacto (Mandacaru)", "Musgo"], c: 1, img: "assets/imagens/Imagem caatinga.png" },
    { p: "O Tamanduá-bandeira (Cerrado) come:", o: ["Frutas", "Peixes", "Formigas"], c: 2, img: "assets/imagens/Imagem cerrado.png" },
    { p: "O Mico-leão-dourado vive na:", o: ["Mata Atlântica", "Caatinga", "Floresta Amazônica"], c: 0, img: "assets/imagens/Imagem mata atlantica.png" },
    { p: "O Tuiuiú é símbolo de qual bioma?", o: ["Pampas", "Pantanal", "Deserto"], c: 1, img: "assets/imagens/Imagem pantanal.png" },
    { p: "Nos Pampas, a vegetação é:", o: ["Árvores gigantes", "Gramíneas (Campos)", "Cactos"], c: 1, img: "assets/imagens/Imagem pampas.png" }
];

// --- ESTADO ---
let usuarios = [];
let usuarioAtual = null;
let sessaoAtual = { pontos: 0, detalhes: [] };
let filaFase1 = [], filaFase2 = [];
let indiceFase1 = 0, indiceFase2 = 0;
let opcaoSelecionada = null;
let tempoInicioQuestao = 0, errosQuestaoAtual = 0;
let dicaUsada = false;

// Variável para controlar PREFERÊNCIA do usuário. 
// True = Som ligado (padrão), False = Usuário clicou para mutar.
let somHabilitado = true;
let timerSom = null; 

// --- INICIALIZAÇÃO ---
window.onload = () => {
    carregarUsuarios();
    navegarPara('login-screen');
    // Atualiza botão de som visualmente
    atualizarIconeSom();
};

function carregarUsuarios() {
    try {
        const dados = localStorage.getItem('guardiaoUsers');
        if (dados) {
            usuarios = JSON.parse(dados);
            if (!Array.isArray(usuarios)) usuarios = [];
        } else usuarios = [];
    } catch (e) { usuarios = []; }
}

function salvarUsuarios() {
    localStorage.setItem('guardiaoUsers', JSON.stringify(usuarios));
}

// --- CONTROLE DE ÁUDIO ---
const audioBg = document.getElementById('bg-music');
// PEGANDO O NOVO ELEMENTO DE ÁUDIO DO HTML
const audioAcerto = document.getElementById('som-acerto'); // <--- NOVO

const btnAudio = document.getElementById('btn-audio-toggle');

function atualizarIconeSom() {
    btnAudio.innerText = somHabilitado ? "🔊" : "🔇";
}

// Variável global para controlar o timer (coloque junto com as outras variáveis lá em cima, ou logo antes da função)

// --- FUNÇÃO ATUALIZADA ---
function tocarSomAcerto() {
    // Verifica se som está ligado e se o elemento existe
    if (somHabilitado && audioAcerto) {
        
        // 1. Limpa qualquer timer anterior para não encavalar
        if (timerSom) clearTimeout(timerSom);

        // 2. Reseta o áudio para o início
        audioAcerto.pause();
        audioAcerto.currentTime = 0;

        // 3. Toca o áudio
        audioAcerto.play().catch(err => console.log("Erro áudio:", err));

        // 4. Define o tempo para parar (Aqui está configurado para 4 segundos)
        // 4000 = 4 segundos. Mude esse número se quiser mais ou menos tempo.
        timerSom = setTimeout(() => {
            audioAcerto.pause();
            audioAcerto.currentTime = 0; // Opcional: volta o cursor para o zero
        }, 2000); 
    }
}

// Função chamada ao clicar no botão de som
btnAudio.addEventListener('click', () => {
    somHabilitado = !somHabilitado; // Inverte preferência
    
    if (somHabilitado) {
        audioBg.play().catch(() => {}); // Tenta tocar
    } else {
        audioBg.pause(); // Para
    }
    atualizarIconeSom();
});

// Função chamada na interação inicial (Login/Cadastro)
function tentarIniciarAudio() {
    if (somHabilitado && audioBg.paused) {
        audioBg.play().catch(err => console.log("Aguardando interação..."));
    }
}

// --- NAVEGAÇÃO ---
function navegarPara(idTela) {
    document.querySelectorAll('.screen').forEach(t => t.classList.remove('active'));
    document.getElementById(idTela).classList.add('active');
}
function fazerLogout() {
    usuarioAtual = null;
    document.getElementById('login-name').value = '';
    navegarPara('login-screen');
}
document.getElementById('btn-reset-dados').addEventListener('click', () => {
    if(confirm("Apagar tudo?")) { localStorage.removeItem('guardiaoUsers'); location.reload(); }
});

// --- LOGIN/CADASTRO ---
document.getElementById('login-name').addEventListener('input', (e) => document.getElementById('btn-login-continuar').disabled = !e.target.value.trim());

document.getElementById('btn-login-continuar').addEventListener('click', () => {
    tentarIniciarAudio(); 
    carregarUsuarios();
    
    const nome = document.getElementById('login-name').value.trim();
    const user = usuarios.find(u => u.nome.toLowerCase() === nome.toLowerCase());
    if (user) {
        usuarioAtual = user;
        alert(`Bem-vindo, ${user.nome}!`);
        if (user.tipo === 'Professor') { renderizarPainelProfessor(); navegarPara('professor-screen'); } 
        else { document.getElementById('student-name-display').innerText = user.nome; navegarPara('menu-principal-screen'); }
    } else alert("Usuário não encontrado.");
});

document.getElementById('btn-login-cadastro').addEventListener('click', () => navegarPara('cadastro-screen'));

document.getElementById('btn-cadastro-cadastrar').addEventListener('click', () => {
    tentarIniciarAudio(); 
    carregarUsuarios();
    const nome = document.getElementById('cadastro-name').value.trim();
    const tipo = document.getElementById('cadastro-permission').value;
    if (!nome || !tipo) return;
    if (usuarios.some(u => u.nome.toLowerCase() === nome.toLowerCase())) { alert("Nome já existe."); return; }
    usuarios.push({ nome, tipo, historico: null });
    salvarUsuarios();
    alert("Cadastrado!");
    navegarPara('login-screen');
});
document.getElementById('cadastro-name').addEventListener('input', validarCad);
document.getElementById('cadastro-permission').addEventListener('change', validarCad);
function validarCad() {
    document.getElementById('btn-cadastro-cadastrar').disabled = !(document.getElementById('cadastro-name').value && document.getElementById('cadastro-permission').value);
}
document.getElementById('btn-cadastro-voltar').addEventListener('click', () => navegarPara('login-screen'));

// --- PROFESSOR ---
function renderizarPainelProfessor() {
    carregarUsuarios();
    const c = document.getElementById('lista-alunos-container'); c.innerHTML = '';
    const alunos = usuarios.filter(u => u.tipo.toLowerCase() === 'aluno');
    if (!alunos.length) { c.innerHTML = '<p>Sem alunos.</p>'; return; }
    alunos.forEach(a => {
        const btn = document.createElement('button'); btn.className = 'student-btn';
        const pts = a.historico ? `${a.historico.pontos} pts` : '—';
        btn.innerHTML = `<span>👤 ${a.nome}</span><span class="badge-score">${pts}</span>`;
        btn.onclick = () => {
            if(a.historico) renderizarTabelaResultados(a.historico, a.nome);
            else alert("Sem histórico.");
        };
        c.appendChild(btn);
    });
}
document.getElementById('btn-prof-sair').addEventListener('click', fazerLogout);

// --- MENU ALUNO ---
document.getElementById('btn-menu-iniciar').addEventListener('click', () => iniciarFase1(true));
document.getElementById('btn-menu-selecao-fase').addEventListener('click', () => navegarPara('selecao-fase-screen'));
document.getElementById('btn-menu-resultados').addEventListener('click', () => {
    carregarUsuarios();
    const u = usuarios.find(u => u.nome === usuarioAtual.nome);
    if(u && u.historico) renderizarTabelaResultados(u.historico, u.nome);
    else alert("Sem histórico.");
});
document.getElementById('btn-menu-sair').addEventListener('click', fazerLogout);
document.getElementById('btn-fase-1-select').addEventListener('click', () => iniciarFase1(true));
document.getElementById('btn-fase-2-select').addEventListener('click', () => iniciarFase2(true));
document.getElementById('btn-selecao-voltar').addEventListener('click', () => navegarPara('menu-principal-screen'));

// --- DICA ---
function usarDica(correta, containerId, btnId) {
    if (dicaUsada) return;
    if (confirm(`Dica custa ${CUSTO_DICA} pts. Usar?`)) {
        sessaoAtual.pontos -= CUSTO_DICA;
        dicaUsada = true;
        atualizarPlacar();
        
        const btns = Array.from(document.getElementById(containerId).getElementsByClassName('option-btn'));
        const errados = btns.filter(b => b.innerText !== correta && !b.disabled);
        errados.sort(() => Math.random() - 0.5);
        
        const qtd = Math.min(errados.length, 2);
        for(let i=0; i<qtd; i++) errados[i].disabled = true;

        const btnDica = document.getElementById(btnId);
        btnDica.disabled = true; btnDica.innerText = "Dica Usada";
    }
}

// --- FASE 1 ---
function iniciarFase1(reset) {
    if(reset) sessaoAtual = { pontos: 0, detalhes: [] };
    filaFase1 = [...dbMapas].sort(() => Math.random() - 0.5);
    indiceFase1 = 0; atualizarPlacar(); renderizarFase1(); navegarPara('fase-1-screen');
}
function renderizarFase1() {
    if(indiceFase1 >= filaFase1.length) { alert("Fase 1 completa! Indo para Fase 2..."); iniciarFase2(false); return; }
    tempoInicioQuestao = Date.now(); errosQuestaoAtual = 0; dicaUsada = false;
    
    const d = filaFase1[indiceFase1];
    document.getElementById('fase-1-title').innerText = `Fase 1 (${indiceFase1+1}/${filaFase1.length})`;
    document.getElementById('img-mapa-fase1').src = d.img;
    
    const btnD = document.getElementById('btn-dica-fase1');
    btnD.disabled = false; btnD.innerText = `💡 Dica (-${CUSTO_DICA})`;
    const newBtn = btnD.cloneNode(true); btnD.parentNode.replaceChild(newBtn, btnD);
    newBtn.addEventListener('click', () => usarDica(d.bioma, 'fase-1-options', 'btn-dica-fase1'));

    const c = document.getElementById('fase-1-options'); c.innerHTML = '';
    opcaoSelecionada = null; document.getElementById('btn-fase-1-verificar').disabled = true;
    
    const ops = dbMapas.map(m => m.bioma).sort(() => Math.random() - 0.5);
    ops.forEach(nome => {
        const btn = document.createElement('button'); btn.className = 'option-btn'; btn.innerText = nome;
        btn.onclick = () => selecionarOpcao(btn, nome, 'btn-fase-1-verificar');
        c.appendChild(btn);
    });
}

// LÓGICA DE VERIFICAÇÃO FASE 1
document.getElementById('btn-fase-1-verificar').addEventListener('click', () => {
    const correto = filaFase1[indiceFase1].bioma;
    if (opcaoSelecionada === correto) {
        sessaoAtual.detalhes.push({ fase: "Fase 1", questao: `Mapa: ${correto}`, erros: errosQuestaoAtual, dica: dicaUsada, tempo: (Date.now()-tempoInicioQuestao)/1000 });
        
        tocarSomAcerto(); // <--- TOCA A MÚSICA AQUI
        
        alert("Correto! +100"); 
        sessaoAtual.pontos += PONTOS_ACERTO;
        indiceFase1++; atualizarPlacar(); renderizarFase1();
    } else {
        alert("Errou! -50"); sessaoAtual.pontos -= PONTOS_ERRO; errosQuestaoAtual++; atualizarPlacar();
        
        const container = document.getElementById('fase-1-options');
        const botoes = container.getElementsByClassName('option-btn');
        for(let btn of botoes) {
            if(btn.classList.contains('selected')) {
                btn.classList.remove('selected');
                btn.classList.add('wrong');
                btn.disabled = true;
            }
        }
        document.getElementById('btn-fase-1-verificar').disabled = true;
    }
});
document.getElementById('btn-fase-1-voltar').addEventListener('click', () => navegarPara('menu-principal-screen'));

// --- FASE 2 ---
function iniciarFase2(reset) {
    if(reset) sessaoAtual = { pontos: 0, detalhes: [] };
    filaFase2 = [...dbQuizFase2].sort(() => Math.random() - 0.5);
    indiceFase2 = 0; atualizarPlacar(); renderizarFase2(); navegarPara('fase-2-screen');
}
function renderizarFase2() {
    if(indiceFase2 >= filaFase2.length) { finalizarJogo(); return; }
    tempoInicioQuestao = Date.now(); errosQuestaoAtual = 0; dicaUsada = false;

    const q = filaFase2[indiceFase2];
    document.getElementById('fase-2-title').innerText = `Fase 2 (${indiceFase2+1}/${filaFase2.length})`;
    document.getElementById('fase-2-question').innerText = q.p;
    document.getElementById('game-area-fase2').style.backgroundImage = `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url('${q.img}')`;

    const btnD = document.getElementById('btn-dica-fase2');
    btnD.disabled = false; btnD.innerText = `💡 Dica (-${CUSTO_DICA})`;
    const newBtn = btnD.cloneNode(true); btnD.parentNode.replaceChild(newBtn, btnD);
    const respCorreta = q.o[q.c];
    newBtn.addEventListener('click', () => usarDica(respCorreta, 'fase-2-options', 'btn-dica-fase2'));

    const c = document.getElementById('fase-2-options'); c.innerHTML = '';
    opcaoSelecionada = null; document.getElementById('btn-fase-2-verificar').disabled = true;

    const ops = q.o.map((txt, idx) => ({ txt, idx })).sort(() => Math.random() - 0.5);
    ops.forEach(o => {
        const btn = document.createElement('button'); btn.className = 'option-btn'; btn.innerText = o.txt;
        btn.onclick = () => selecionarOpcao(btn, o.idx, 'btn-fase-2-verificar');
        c.appendChild(btn);
    });
}

// LÓGICA DE VERIFICAÇÃO FASE 2
document.getElementById('btn-fase-2-verificar').addEventListener('click', () => {
    const q = filaFase2[indiceFase2];
    if (opcaoSelecionada === q.c) {
        sessaoAtual.detalhes.push({ fase: "Fase 2", questao: q.p.substring(0,20)+"...", erros: errosQuestaoAtual, dica: dicaUsada, tempo: (Date.now()-tempoInicioQuestao)/1000 });
        
        tocarSomAcerto(); // <--- TOCA A MÚSICA AQUI TAMBÉM

        alert("Correto! +100"); 
        sessaoAtual.pontos += PONTOS_ACERTO;
        indiceFase2++; atualizarPlacar(); renderizarFase2();
    } else {
        alert("Errou! -50"); sessaoAtual.pontos -= PONTOS_ERRO; errosQuestaoAtual++; atualizarPlacar();
        
        const container = document.getElementById('fase-2-options');
        const botoes = container.getElementsByClassName('option-btn');
        for(let btn of botoes) {
            if(btn.classList.contains('selected')) {
                btn.classList.remove('selected');
                btn.classList.add('wrong');
                btn.disabled = true;
            }
        }
        document.getElementById('btn-fase-2-verificar').disabled = true;
    }
});
document.getElementById('btn-fase-2-voltar').addEventListener('click', () => navegarPara('menu-principal-screen'));

// --- AUXILIARES ---
function selecionarOpcao(btn, val, idConfirm) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected'); opcaoSelecionada = val;
    document.getElementById(idConfirm).disabled = false;
}
function atualizarPlacar() {
    const s1 = document.getElementById('score-fase1'); if(s1) s1.innerText = sessaoAtual.pontos;
    const s2 = document.getElementById('score-fase2'); if(s2) s2.innerText = sessaoAtual.pontos;
}
function finalizarJogo() {
    alert("Jogo Finalizado!"); carregarUsuarios();
    const idx = usuarios.findIndex(u => u.nome === usuarioAtual.nome);
    if (idx !== -1) { usuarios[idx].historico = sessaoAtual; usuarioAtual.historico = sessaoAtual; salvarUsuarios(); }
    renderizarTabelaResultados(sessaoAtual, usuarioAtual.nome);
}
function renderizarTabelaResultados(d, nome) {
    navegarPara('resultados-screen');
    document.getElementById('resumo-nome').innerText = nome;
    document.getElementById('resumo-pontos').innerText = d.pontos;
    document.getElementById('resumo-tempo').innerText = d.detalhes.reduce((a,c)=>a+c.tempo,0).toFixed(1)+'s';
    const tb = document.getElementById('tabela-corpo'); tb.innerHTML = '';
    d.detalhes.forEach(i => {
        tb.innerHTML += `<tr><td>${i.fase}</td><td>${i.questao}</td><td style="color:${i.erros>0?'red':'green'}">${i.erros}</td><td>${i.dica?'Sim':'Não'}</td><td>${i.tempo.toFixed(1)}s</td></tr>`;
    });
}
document.getElementById('btn-resultados-voltar').addEventListener('click', () => {
    if(usuarioAtual.tipo === 'Professor') navegarPara('professor-screen');
    else navegarPara('menu-principal-screen');
});