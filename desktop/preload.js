"use strict";

const { contextBridge, ipcRenderer } = require("electron");

/**
 * Expose a narrow, safe printer API to the remote CRM page.
 * No arbitrary shell / Node access — only list + print HTML.
 */
contextBridge.exposeInMainWorld("delhiDarbarDesktop", {
  isDesktop: true,
  listPrinters: () => ipcRenderer.invoke("printers:list"),
  printHtml: (opts) => ipcRenderer.invoke("printers:print", opts),
});
