import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('esteira', {
  chamar(canal: string, corpo?: unknown) {
    return ipcRenderer.invoke('esteira', canal, corpo ?? {})
  },
})
