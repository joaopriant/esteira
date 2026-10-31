import { dialog, type BrowserWindow } from 'electron'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NsisUpdater } from 'electron-updater'
import { pastaDeDados } from '../app/criar'
import { Atualizacao } from './atualizacao'

export async function checarAtualizacao(janela: BrowserWindow): Promise<void> {
  const arquivo = await lerFeed(path.join(pastaDeDados(), 'atualizacao.json'))
  const url = Atualizacao.urlDoFeed({ env: process.env.ESTEIRA_UPDATE_URL, arquivo })
  if (!url || !Atualizacao.deveChecar({ empacotado: true, modo: 'real', url })) return

  const atualizador = new NsisUpdater({ provider: 'generic', url })
  atualizador.disableWebInstaller = true
  atualizador.logger = {
    info(mensagem) {
      console.info(Atualizacao.redigir(String(mensagem ?? '')))
    },
    warn(mensagem) {
      console.warn(Atualizacao.redigir(String(mensagem ?? '')))
    },
    error(mensagem) {
      console.error(Atualizacao.redigir(String(mensagem ?? '')))
    },
  }
  Atualizacao.ligar({
    atualizador: {
      desligarInstalacaoAutomatica() {
        atualizador.autoDownload = false
        atualizador.autoInstallOnAppQuit = false
      },
      aoDisponivel(ouvinte) {
        atualizador.on('update-available', (info) => ouvinte(info.version))
      },
      aoBaixado(ouvinte) {
        atualizador.on('update-downloaded', () => ouvinte())
      },
      aoErro(ouvinte) {
        atualizador.on('error', (erro) => ouvinte(erro))
      },
      baixar() {
        void atualizador.downloadUpdate()
      },
      instalar() {
        atualizador.quitAndInstall(true, true)
      },
    },
    perguntar: async (confirmacao) => {
      const { response } = await dialog.showMessageBox(janela, {
        type: 'info',
        buttons: [confirmacao.instalar, confirmacao.agoraNao],
        defaultId: 1,
        cancelId: 1,
        noLink: true,
        title: 'Esteira',
        message: confirmacao.mensagem,
        detail: confirmacao.detalhe,
      })
      return response
    },
    avisarErro(falha) {
      void dialog.showMessageBox(janela, {
        type: 'error',
        buttons: ['Fechar'],
        noLink: true,
        title: 'Esteira',
        message: falha.mensagem,
        detail: falha.detalhe,
      })
    },
  })
  try {
    await atualizador.checkForUpdates()
  } catch (erro) {
    console.error(`Atualização (${Atualizacao.hostParaLog(url)}): ${Atualizacao.falhaAoInstalar(erro).detalhe}`)
  }
}

async function lerFeed(caminho: string): Promise<string | undefined> {
  try {
    return await readFile(caminho, 'utf8')
  } catch {
    return undefined
  }
}
