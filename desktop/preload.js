const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopPrint", () => ipcRenderer.invoke("print-sheet"));
