import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

interface Edital {
  id: number;
  titulo: string;
  orgao: string;
  data_limite: string;
}

interface Proposta {
  id: number;
  edital_id: number;
  titulo: string;
  valor: number;
  user_id: string;
}

interface ContratacaoPNCP {
  objetoContratacao: string;
  numeroContratacao: string;
  orgaoEntidade: {
    razaoSocial: string;
    cnpj: string;
  };
  dataPublicacaoPncp: string;
  unidadeOrgao: {
    nomeUnidade: string;
  };
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');

  const [editais, setEditais] = useState<Edital[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [selectedEdital, setSelectedEdital] = useState('');
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoTitulo, setEditandoTitulo] = useState('');
  const [editandoValor, setEditandoValor] = useState('');

  // Estados para a busca de editais via PNCP
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<ContratacaoPNCP[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [erroBusca, setErroBusca] = useState('');

  // Autenticação e carregamento de dados
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => listener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      carregarEditais();
      carregarPropostas();
    }
  }, [session]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else alert('Cadastro realizado! Faça login.');
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function carregarEditais() {
    const { data } = await supabase.from('editais').select('*');
    if (data) setEditais(data);
  }

  async function carregarPropostas() {
    const { data } = await supabase.from('propostas').select('*').eq('user_id', session.user.id);
    if (data) setPropostas(data);
  }

  async function criarProposta(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEdital || !titulo) return;
    await supabase.from('propostas').insert({
      edital_id: parseInt(selectedEdital),
      titulo,
      valor: parseFloat(valor) || 0,
      user_id: session.user.id,
    });
    setTitulo('');
    setValor('');
    carregarPropostas();
  }

  async function atualizarProposta(id: number, novoTitulo: string, novoValor: number) {
    await supabase.from('propostas').update({ titulo: novoTitulo, valor: novoValor }).eq('id', id);
    setEditandoId(null);
    carregarPropostas();
  }

  async function excluirProposta(id: number) {
    if (confirm('Deseja realmente excluir?')) {
      await supabase.from('propostas').delete().eq('id', id);
      carregarPropostas();
    }
  }

  // Busca editais na API do PNCP via edge function
  const buscarEditaisPNCP = async () => {
    if (!termoBusca.trim()) return;
    setCarregandoBusca(true);
    setErroBusca('');
    setResultadosBusca([]);

    try {
      const hoje = new Date();
      const dataFormatada = hoje.toISOString().slice(0, 10).replace(/-/g, '');
      const resposta = await fetch(`/api/contratacoes?dataInicial=${dataFormatada}&uf=SP&pagina=1`);
      if (!resposta.ok) throw new Error('Erro ao buscar dados.');
      const dados = await resposta.json();

      const filtrados = dados.filter((item: ContratacaoPNCP) =>
        item.objetoContratacao?.toLowerCase().includes(termoBusca.toLowerCase())
      );
      setResultadosBusca(filtrados.slice(0, 20));
    } catch (err: any) {
      setErroBusca(err.message);
    } finally {
      setCarregandoBusca(false);
    }
  };

  // Tela de login/cadastro
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4 text-center">📋 Licitações</h1>
          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="E-mail"
              className="w-full border rounded p-2 mb-3"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              className="w-full border rounded p-2 mb-3"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {authError && <p className="text-red-500 text-sm mb-3">{authError}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-sm text-blue-600 mt-3 hover:underline"
          >
            {isLogin ? 'Criar nova conta' : 'Já tenho conta'}
          </button>
        </div>
      </div>
    );
  }

  // Área logada
  const totalPropostas = propostas.length;
  const somaValores = propostas.reduce((acc, p) => acc + (p.valor || 0), 0);
  const valorMedio = totalPropostas ? (somaValores / totalPropostas).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📋 Módulo de Licitações</h1>
          <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Sair</button>
        </div>

        {/* Busca de editais reais */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔍 Buscar Editais Reais (PNCP)</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Ex: pavimentação, esgoto, ETE..."
              className="flex-1 border rounded-md p-2"
            />
            <button
              onClick={buscarEditaisPNCP}
              disabled={carregandoBusca}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {carregandoBusca ? 'Buscando...' : 'Pesquisar'}
            </button>
          </div>
          {erroBusca && <p className="text-red-500 text-sm">{erroBusca}</p>}
          {resultadosBusca.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Resultados encontrados:</h3>
              <ul className="space-y-2">
                {resultadosBusca.map((item, idx) => (
                  <li key={idx} className="border-b pb-2">
                    <p className="font-medium">{item.objetoContratacao?.substring(0, 150)}...</p>
                    <p className="text-sm text-gray-600">
                      Órgão: {item.orgaoEntidade?.razaoSocial || 'N/I'} | Data: {item.dataPublicacaoPncp}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-gray-500 text-sm uppercase">Total de Propostas</h3>
            <p className="text-3xl font-semibold">{totalPropostas}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-gray-500 text-sm uppercase">Valor Total</h3>
            <p className="text-3xl font-semibold">R$ {somaValores.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-gray-500 text-sm uppercase">Valor Médio</h3>
            <p className="text-3xl font-semibold">R$ {valorMedio}</p>
          </div>
        </div>

        {/* Formulário de nova proposta */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">➕ Nova Proposta</h2>
          <form onSubmit={criarProposta} className="flex flex-col md:flex-row gap-4">
            <select
              className="border rounded-md p-2 flex-1"
              value={selectedEdital}
              onChange={e => setSelectedEdital(e.target.value)}
              required
            >
              <option value="">Selecione o edital</option>
              {editais.map(e => <option key={e.id} value={e.id}>{e.titulo}</option>)}
            </select>
            <input
              type="text"
              placeholder="Título da proposta"
              className="border rounded-md p-2 flex-1"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor (R$)"
              className="border rounded-md p-2 flex-1"
              value={valor}
              onChange={e => setValor(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Salvar
            </button>
          </form>
        </div>

        {/* Tabela de propostas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-6 pb-0">📄 Minhas Propostas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {propostas.map(prop => {
                  const edital = editais.find(e => e.id === prop.edital_id);
                  return (
                    <tr key={prop.id}>
                      <td className="px-6 py-4">
                        {editandoId === prop.id ? (
                          <input
                            className="border rounded p-1 w-full"
                            value={editandoTitulo}
                            onChange={e => setEditandoTitulo(e.target.value)}
                          />
                        ) : (
                          prop.titulo
                        )}
                      </td>
                      <td className="px-6 py-4">{edital?.titulo || '-'}</td>
                      <td className="px-6 py-4">
                        {editandoId === prop.id ? (
                          <input
                            type="number"
                            step="0.01"
                            className="border rounded p-1 w-full"
                            value={editandoValor}
                            onChange={e => setEditandoValor(e.target.value)}
                          />
                        ) : (
                          `R$ ${prop.valor?.toFixed(2) || '0'}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editandoId === prop.id ? (
                          <div className="flex gap-2">
                            <button
                              className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                              onClick={() => atualizarProposta(prop.id, editandoTitulo, parseFloat(editandoValor))}
                            >
                              Salvar
                            </button>
                            <button
                              className="bg-gray-400 text-white px-2 py-1 rounded text-sm"
                              onClick={() => setEditandoId(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                              onClick={() => {
                                setEditandoId(prop.id);
                                setEditandoTitulo(prop.titulo);
                                setEditandoValor(prop.valor?.toString() || '0');
                              }}
                            >
                              Editar
                            </button>
                            <button
                              className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                              onClick={() => excluirProposta(prop.id)}
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;