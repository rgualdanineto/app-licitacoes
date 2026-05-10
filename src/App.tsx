import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

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
  const [tituloProposta, setTituloProposta] = useState('');
  const [valor, setValor] = useState('');

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
    if (!selectedEdital || !tituloProposta) return;
    const { error } = await supabase.from('propostas').insert({
      edital_id: parseInt(selectedEdital),
      titulo: tituloProposta,
      valor: parseFloat(valor) || 0,
    });
    if (error) {
      alert('Erro: ' + error.message);
    } else {
      alert('Proposta salva!');
      setTituloProposta('');
      setValor('');
      carregarPropostas();
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>Módulo de Licitações</h1>

      <h2>Editais disponíveis</h2>
      <ul>
        {editais.map(e => (
          <li key={e.id}>
            <strong>{e.titulo}</strong> – {e.orgao} (até {e.data_limite})
          </li>
        ))}
      </ul>

      <hr />

      <h2>Criar nova proposta</h2>
      <form onSubmit={criarProposta}>
        <div>
          <label>Selecione o edital:</label>
          <select value={selectedEdital} onChange={e => setSelectedEdital(e.target.value)} required>
            <option value="">-- escolha --</option>
            {editais.map(e => (
              <option key={e.id} value={e.id}>{e.titulo}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Título da proposta:</label>
          <input type="text" value={tituloProposta} onChange={e => setTituloProposta(e.target.value)} required />
        </div>
        <div>
          <label>Valor (R$):</label>
          <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} />
        </div>
        <button type="submit">Salvar proposta</button>
      </form>

      <hr />

      <h2>Minhas propostas</h2>
      <ul>
        {propostas.map(p => (
          <li key={p.id}>{p.titulo} – R$ {p.valor}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;