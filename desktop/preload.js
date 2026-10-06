"use strict";

const { contextBridge, ipcRenderer } = require("electron");

/**
 * Expose a narrow, safe printer API to the remote CRM page.
 * No arbitrary shell / Node access — only list + print HTML.
 */
const bridge = {
  isDesktop: true,
  listPrinters: () => ipcRenderer.invoke("printers:list"),
  printHtml: (opts) => ipcRenderer.invoke("printers:print", opts),
};

contextBridge.exposeInMainWorld("syncDesktop", bridge);
// Legacy alias for older packaged builds
contextBridge.exposeInMainWorld("delhiDarbarDesktop", bridge);
