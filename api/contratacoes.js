// api/contratacoes.js
export const config = { runtime: "edge" };

export default async function handler(request) {
  const url = new URL(request.url);
  const dataInicial = url.searchParams.get("dataInicial") || "";
  const uf = url.searchParams.get("uf") || "";
  const pagina = url.searchParams.get("pagina") || "1";

  let apiUrl = `https://pncp.gov.br/api/consulta/v1/contratacoes?pagina=${pagina}&tamanhoPagina=20`;
  if (dataInicial && uf) {
    apiUrl = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataInicial}&uf=${uf}&pagina=${pagina}`;
  }

  const response = await fetch(apiUrl);
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}