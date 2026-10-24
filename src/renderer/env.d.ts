interface EsteiraPonte {
  chamar: (canal: string, corpo?: unknown) => Promise<unknown>
}

interface Window {
  esteira?: EsteiraPonte
}
