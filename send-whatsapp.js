const express = require("express");
const multer = require("multer");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");
const redis = require("redis");

const app = express();
const port = 3000;

const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});

// Conecte ao Redis com tratamento de erro
redisClient.connect().catch((err) => {
  console.error("Erro ao conectar ao Redis:", err);
  process.exit(1);
});

// Configuração do multer para upload de arquivos
const upload = multer({ dest: "uploads/" });

// Inicializa o cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", async (qr) => {
  await qrcode.toFile("qrcode.png", qr);
  console.log("QR Code gerado e salvo como qrcode.png");
});

client.on("ready", () => {
  console.log("Client is ready!");
  // Começa a processar a fila quando o cliente estiver pronto
  processQueue();
});

client.on("disconnected", (reason) => {
  console.error("Cliente desconectado:", reason);
  // Opcional: Tentar reconectar automaticamente
  client.initialize();
});

client.initialize();

app.use(express.json());

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

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

// Função para processar a fila do Redis
async function processQueue() {
  while (true) {
    try {
      // Pega a primeira mensagem da fila (e a remove)
      const messageData = await redisClient.lPop("messageQueue");

      if (messageData) {
        const { number, message } = JSON.parse(messageData);
        const formattedNumber = `${number}@c.us`;

        // Tenta enviar a mensagem via WhatsApp
        try {
          await client.sendMessage(formattedNumber, message);
          console.log(`Mensagem enviada para ${number}`);
        } catch (err) {
          console.error(`Erro ao enviar mensagem para ${number}:`, err);

          // Reenfileira a mensagem em caso de erro
          await redisClient.rPush("messageQueue", messageData);
        }
      } else {
        console.log("Nenhuma mensagem na fila, aguardando...");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Aguarda 5 segundos
      }
    } catch (error) {
      console.error("Erro ao processar a fila:", error);
    }
  }
}
