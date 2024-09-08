const { getConnection } = require("./db");

// Função para buscar mensagens
async function fetchMessages() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute("SELECT * FROM mensagem");
    await connection.end();
    return rows;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    throw error;
  }
}

// Função para inserir mensagens
async function insertMessages(numbers, message) {
  try {
    const connection = await getConnection();
    const query = "INSERT INTO mensagem (numero, mensagem) VALUES (?, ?)";
    for (let number of numbers) {
      await connection.execute(query, [number, message]);
    }
    await connection.end();
    return { success: true, message: "Mensagens inseridas com sucesso." };
  } catch (error) {
    console.error("Erro ao inserir mensagens:", error);
    throw error;
  }
}

module.exports = { fetchMessages, insertMessages };
