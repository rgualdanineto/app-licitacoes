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
}

function App() {
  const [editais, setEditais] = useState<Edital[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [selectedEdital, setSelectedEdital] = useState('');
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoTitulo, setEditandoTitulo] = useState('');
  const [editandoValor, setEditandoValor] = useState('');

  useEffect(() => {
    carregarEditais();
    carregarPropostas();
  }, []);

  async function carregarEditais() {
    const { data, error } = await supabase.from('editais').select('*');
    if (error) console.error(error);
    else setEditais(data || []);
  }

  async function carregarPropostas() {
    const { data, error } = await supabase.from('propostas').select('*');
    if (error) console.error(error);
    else setPropostas(data || []);
  }

  async function criarProposta(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEdital || !titulo) return;
    const { error } = await supabase.from('propostas').insert({
      edital_id: parseInt(selectedEdital),
      titulo,
      valor: parseFloat(valor) || 0,
    });
    if (error) {
      alert('Erro: ' + error.message);
    } else {
      setTitulo('');
      setValor('');
      carregarPropostas();
    }
  }

  async function atualizarProposta(id: number, novoTitulo: string, novoValor: number) {
    const { error } = await supabase.from('propostas').update({ titulo: novoTitulo, valor: novoValor }).eq('id', id);
    if (error) alert('Erro ao atualizar');
    else {
      setEditandoId(null);
      carregarPropostas();
    }
  }

  async function excluirProposta(id: number) {
    if (confirm('Deseja realmente excluir?')) {
      const { error } = await supabase.from('propostas').delete().eq('id', id);
      if (error) alert('Erro ao excluir');
      else carregarPropostas();
    }
  }

  const totalPropostas = propostas.length;
  const somaValores = propostas.reduce((acc, p) => acc + (p.valor || 0), 0);
  const valorMedio = totalPropostas ? (somaValores / totalPropostas).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">📋 Módulo de Licitações</h1>

        {/* Cards */}
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

        {/* Formulário */}
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