const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const axios = require('axios');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

let win;

const serverKey = 'SB-Mid-server-h5tXfEB-FmylxjIniRjESyyE';
const apiURL = 'https://api.sandbox.midtrans.com/v2/charge';

const NGROK_DOMAIN = "fox-verified-rationally.ngrok-free.app";

const appServer = express();
const port = 80;

appServer.use(bodyParser.json());

const startNgrok = () => {
  console.log("🚀 Memulai Ngrok...");

  const ngrokProcess = spawn("ngrok", ["http", "--domain=" + NGROK_DOMAIN, "80"], { shell: true });

  ngrokProcess.stdout.on("data", (data) => console.log(`Ngrok: ${data}`));
  ngrokProcess.stderr.on("data", (data) => console.error(`Ngrok Error: ${data}`));
  ngrokProcess.on("close", (code) => console.log(`Ngrok exited with code ${code}`));
};

const createQrisPayment = async (orderID, amount) => {
  const requestBody = {
    payment_type: 'gopay',
    transaction_details: {
      order_id: orderID,
      gross_amount: amount,
    },
    gopay: {
      enable_redirect: false,
    },
  };

  try {
    const response = await axios.post(apiURL, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      auth: { username: serverKey, password: '' },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

const saveWebhookToFile = (notification) => {
  const logData = `Time: ${new Date().toISOString()}\nOrder ID: ${notification.order_id}\nStatus: ${notification.transaction_status}\nAmount: ${notification.gross_amount}\n\n`;
  fs.appendFileSync('webhook_log.txt', logData, 'utf8');
};

const generateQRCode = async (url) => {
  try {
    await qrcode.toFile('qrcode.png', url, { width: 256 });
    console.log('✅ QR code disimpan sebagai qrcode.png');
  } catch (error) {
    console.error('❌ Error membuat QR code:', error);
  }
};

let currentOrderID = null;

const startPayment = async () => {
  const orderID = `order-${Date.now()}`;
  currentOrderID = orderID;
  const amount = 10000.0;

  try {
    const response = await createQrisPayment(orderID, amount);
    console.log("📌 Full Response:", JSON.stringify(response, null, 2));

    if (response.actions && response.actions.length > 0) {
      const qrCodeURL = response.actions[0].url;
      console.log(`🔗 QR Code URL: ${qrCodeURL}`);
      await generateQRCode(qrCodeURL);
    } else {
      console.error("❌ Error: actions tidak ditemukan dalam response");
    }
  } catch (error) {
    console.error("❌ Error membuat pembayaran:", error.response ? error.response.data : error.message);
  }
};

ipcMain.on('buka-dslrbooth', () => {
  const dslrboothPath = path.join(__dirname, 'dslr', 'dslrBooth.exe');

  console.log(`📷 Menjalankan: ${dslrboothPath}`);

  if (win) win.minimize();

  const dslrboothProcess = spawn(dslrboothPath, [], { detached: true, stdio: 'ignore' });

  dslrboothProcess.on('error', (error) => console.error(`❌ Gagal membuka DSLRBooth: ${error.message}`));
  dslrboothProcess.on('exit', () => {
    console.log("✅ DSLRBooth ditutup.");
    if (win) {
      win.restore();
      win.setFullScreen(true);
      setTimeout(() => win.webContents.send('tampilkan-halaman-1'), 1000);
    }
  });

  dslrboothProcess.unref();
});

// ✅ **Event IPC untuk memulai pembayaran**
ipcMain.on("start-payment", async () => await startPayment());

// ✅ **Webhook untuk menerima notifikasi Midtrans**
appServer.post('/midtrans-notification', (req, res) => {
  const notification = req.body;
  console.log('📩 Received notification:', notification);

  saveWebhookToFile(notification);
  res.status(200).send('Notification received');
});

// ✅ **Fungsi untuk membaca status pembayaran dari log**
const bacaLog = () => {
  const filePath = path.join(__dirname, 'webhook_log.txt');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8').split('\n').filter(line => line.trim() !== "");
    return data.slice(-5);
  } else {
    return [];
  }
};

ipcMain.handle('cek-status', async () => {
  const lastLines = bacaLog();
  const jsonResponse = { status: 'success', data: lastLines };

  const statusLine = lastLines.find(line => line.startsWith("Status"));
  const orderIdLine = lastLines.find(line => line.startsWith("Order ID"));

  const status = statusLine ? statusLine.split(":")[1].trim() : "Status tidak ditemukan";
  const orderId = orderIdLine ? orderIdLine.split(":")[1].trim() : "Order ID tidak ditemukan";

  console.log("📌 Status:", status);
  console.log("📌 Order ID:", orderId);

  if (status === "settlement" && orderId === currentOrderID) {
    if (win) win.webContents.send('tampilkan-halaman-3');
  } else if (status === "pending" && orderId === currentOrderID) {
    if (win) win.webContents.send('tampilkan-pending');
  } else if (status === "expire") {
    console.log("⚠️ Transaksi kedaluwarsa, mengulang sistem...");
    currentOrderID = null;
    if (win) win.webContents.send('tampilkan-expire');
    setTimeout(() => startPayment(), 2000);
  }

  return jsonResponse;
});

const createWindow = () => {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
    frame: false,
    fullscreen: true,
  });

  win.loadFile('index.html');
  win.maximize();
};

app.whenReady().then(() => {
  startNgrok();
  createWindow();
  appServer.listen(port, () => console.log(`📡 Webhook server running on http://localhost:${port}`));
});
