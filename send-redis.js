const express = require("express");
const redis = require("redis");
const path = require("path");

const app = express();
const port = 3001;

const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});

// Conecte ao Redis com tratamento de erro
redisClient.connect().catch((err) => {
  console.error("Erro ao conectar ao Redis:", err);
  process.exit(1);
});

app.use(express.json());

// Serve arquivos estáticos da pasta public
app.use(express.static("public"));

// Rota raiz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota para inserir mensagens
app.post("/api/inserir-mensagens", async (req, res) => {
  const { numbers, message } = req.body;
  if (!Array.isArray(numbers) || numbers.length === 0 || !message) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }
  try {
    console.log("Iniciando inserção das mensagens na fila...");

    // Enfileira cada mensagem no Redis
    for (const number of numbers) {
      const messageData = JSON.stringify({ number, message });
      await redisClient.rPush("messageQueue", messageData);
      console.log(`Mensagem enfileirada: ${messageData}`);
    }

    // Verifica se as mensagens foram inseridas
    const queueLength = await redisClient.lLen("messageQueue");
    console.log(`Mensagens na fila: ${queueLength}`);

    res.json({ success: true, message: "Mensagens enfileiradas." });
  } catch (error) {
    console.error("Erro ao enfileirar mensagens:", error);
    res.status(500).json({ error: "Erro ao enfileirar mensagens." });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
