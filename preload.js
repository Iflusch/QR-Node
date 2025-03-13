console.log('Preload script is running!');

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    bukaDSLRBooth: () => ipcRenderer.send("buka-dslrbooth"),
    startPayment: () => ipcRenderer.send("start-payment"),
    getStatus: () => ipcRenderer.send("get-status"),
    cekStatus: () => ipcRenderer.invoke('cek-status'),
    onTampilkanHalaman3: (callback) => {
        ipcRenderer.on('tampilkan-halaman-3', (_event, args) => callback(args));
    },
    onTampilkanPending: (callback) => {
        ipcRenderer.on('tampilkan-pending', (_event, args) => callback(args));
    },
    onTampilkanExpire: (callback) => {
        ipcRenderer.on('tampilkan-expire', (_event, args) => callback(args));
    }
    
});
 