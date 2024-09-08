const express = require("express");
const multer = require("multer");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");

const { fetchMessages, insertMessages } = require("./mensagens");

const app = express();
const port = 3000;

app.use(express.json());

// Configuração do multer para upload de arquivos
const upload = multer({ dest: "uploads/" });

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", async (qr) => {
  await qrcode.toFile("qrcode.png", qr);
  console.log("QR Code gerado e salvo como qrcode.png");
});
client.on("disconnected", (reason) => {
  console.log("Cliente desconectado, motivo:", reason);
  client.destroy().then(() => {
    client.initialize(); // Reinicia o cliente
    console.log("Tentando reconectar o cliente...");
  });
});
client.on("ready", () => {
  console.log("Client is ready!");
});

client.initialize();

// Serve arquivos estáticos da pasta public
app.use(express.static("public"));

// Rota raiz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota para fornecer o QR Code
app.get("/qr-code", (req, res) => {
  const qrCodePath = path.join(__dirname, "qrcode.png");
  if (fs.existsSync(qrCodePath)) {
    res.json({
      qrCode: `data:image/png;base64,${fs
        .readFileSync(qrCodePath)
        .toString("base64")}`,
    });
  } else {
    res.status(404).json({ error: "QR Code não encontrado." });
  }
});

// Rota para enviar mensagem ou imagem
app.post("/send-message", upload.single("image"), (req, res) => {
  const number = req.body.number;
  const caption = req.body.caption || "";
  const imagePath = req.file ? req.file.path : null;
  const formattedNumber = `${number}@c.us`;

  if (imagePath) {
    client
      .sendMessage(formattedNumber, fs.readFileSync(imagePath), { caption })
      .then((response) => {
        fs.unlinkSync(imagePath); // Remove o arquivo após o envio
        res.json({ success: true, response });
      })
      .catch((err) => {
        fs.unlinkSync(imagePath); // Remove o arquivo em caso de erro
        res.status(500).json({ success: false, error: err.message });
      });
  } else {
    client
      .sendMessage(formattedNumber, req.body.message || "")
      .then((response) => {
        res.json({ success: true, response });
      })
      .catch((err) => {
        res.status(500).json({ success: false, error: err.message });
      });
  }
});

// Rota para buscar mensagens
app.get("/api/mensagens", async (req, res) => {
  try {
    const messages = await fetchMessages();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});

// Rota para inserir mensagens
app.post("/api/inserir-mensagens", async (req, res) => {
  const { numbers, message } = req.body;

  if (!Array.isArray(numbers) || numbers.length === 0 || !message) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    const result = await insertMessages(numbers, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Erro ao inserir mensagens." });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out", reason);
});

client.on("auth_failure", (msg) => {
  console.error("Authentication failure:", msg);
});
