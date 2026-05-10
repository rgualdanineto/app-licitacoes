export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const termo = url.searchParams.get('termo') || '';
  const pagina = url.searchParams.get('pagina') || '1';
  const uf = url.searchParams.get('uf') || 'SP';

  const apiUrl = `https://pncp.gov.br/api/consulta/v1/contratacoes?pagina=${pagina}&tamanhoPagina=20&codigoUF=${uf}`;

  const response = await fetch(apiUrl);
  const data = await response.json();

  const resultados = data.filter(item => {
    const objeto = item?.objetoContratacao?.toLowerCase() || '';
    return objeto.includes(termo.toLowerCase());
  });

  return new Response(JSON.stringify(resultados), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}