// CONFIGURAÇÃO DO SUPABASE (Substitua pelos seus dados)
const SUPABASE_URL = 'https://edeebgyykdmksdsyohxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWViZ3l5a2Rta3Nkc3lvaHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjI1OTIsImV4cCI6MjEwMzMzODU5Mn0.4ZS-8EM6EUEqULp5-XqT9n47B-zEX4HJeVjkJQrS3-U';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let acoesLocais = [];

// Navegação entre telas
function navegarPara(idTela) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  document.getElementById(idTela).classList.add('ativa');
}

// Limpar formulário
function limparFormulario() {
  document.getElementById('formCadastro').reset();
}

// Formatar data de AAAA-MM-DD para DD/MM/AAAA
function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Salvar Ação no Banco de Dados
async function salvarAcao(e) {
  e.preventDefault();

  const dataInicio = document.getElementById('dataInicio').value;
  const hoje = new Date().toISOString().split('T')[0];

  // Regra do Status Inicial
  let statusInicial = "EM ANDAMENTO";
  if (dataInicio > hoje) {
    statusInicial = "A INICIAR";
  }

  const novaAcao = {
    problema: document.getElementById('problema').value,
    acao: document.getElementById('acao').value,
    responsavel: document.getElementById('responsavel').value,
    setor: document.getElementById('setor').value,
    data_inicio: dataInicio,
    data_fim: document.getElementById('dataFim').value,
    status: statusInicial,
    data_conclusao: ''
  };

  const { data, error } = await _supabase.from('acoes').insert([novaAcao]);

  if (error) {
    alert('Erro ao salvar no banco de dados: ' + error.message);
  } else {
    alert('Ação de melhoria cadastrada com sucesso!');
    limparFormulario();
    navegarPara('tela1');
  }
}

// Carregar Ações da Tabela
async function carregarAcoes() {
  const { data, error } = await _supabase.from('acoes').select('*').order('id', { ascending: false });

  if (error) {
    alert('Erro ao carregar ações: ' + error.message);
    return;
  }

  acoesLocais = data;
  renderizarTabela(acoesLocais);
}

// Renderizar Tabela na Tela 3
function renderizarTabela(lista) {
  const tbody = document.getElementById('tabelaCorpo');
  tbody.innerHTML = '';

  lista.forEach(item => {
    const tr = document.createElement('tr');

    // Seleção de opções para o Status
    let selectStatus = '';
    if (item.status === 'A INICIAR' || item.status === 'EM ANDAMENTO') {
      selectStatus = `
        <select onchange="atualizarStatus(${item.id}, this.value)">
          <option value="${item.status}" selected disabled>${item.status}</option>
          <option value="CONCLUÍDA">CONCLUÍDA</option>
          <option value="CANCELADA">CANCELADA</option>
        </select>
      `;
    } else {
      selectStatus = `<strong>${item.status}</strong>`;
    }

    tr.innerHTML = `
      <td>${item.problema}</td>
      <td>${item.acao}</td>
      <td>${item.responsavel}</td>
      <td>${item.setor}</td>
      <td>${selectStatus}</td>
      <td>${formatarDataBR(item.data_inicio)}</td>
      <td>${formatarDataBR(item.data_fim)}</td>
      <td>${item.data_conclusao}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Filtrar por Setor
function filtrarTabela() {
  const setorSelecionado = document.getElementById('filtroSetor').value;
  if (setorSelecionado === 'TODOS') {
    renderizarTabela(acoesLocais);
  } else {
    const filtrados = acoesLocais.filter(item => item.setor === setorSelecionado);
    renderizarTabela(filtrados);
  }
}

// Atualizar Status e Data de Conclusão
async function atualizarStatus(id, novoStatus) {
  let dataConclusaoTexto = '';

  if (novoStatus === 'CONCLUÍDA') {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    dataConclusaoTexto = `${dia}/${mes}/${ano}`;
  } else if (novoStatus === 'CANCELADA') {
    dataConclusaoTexto = 'CANCELADA';
  }

  const { error } = await _supabase
    .from('acoes')
    .update({ status: novoStatus, data_conclusao: dataConclusaoTexto })
    .eq('id', id);

  if (error) {
    alert('Erro ao atualizar status: ' + error.message);
  } else {
    carregarAcoes();
  }
}
