export async function chamar<T>(canal: string, corpo?: unknown): Promise<T> {
  const ponte = window.esteira
  if (ponte) return ponte.chamar(canal, corpo) as Promise<T>
  const resposta = await fetch(`/api/${canal}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo ?? {}),
  })
  const json = (await resposta.json()) as { dados?: T; erro?: string }
  if (!resposta.ok || json.erro) throw new Error(json.erro || 'Não consegui completar.')
  return json.dados as T
}
