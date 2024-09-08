const mysql = require("mysql2/promise");

// Configurações da conexão com o banco de dados
const connectionConfig = {
  host: "localhost",
  user: "root",
  password: "masterkey",
  database: "zappiki",
};

// Função para obter a conexão com o banco de dados
async function getConnection() {
  return mysql.createConnection(connectionConfig);
}

module.exports = { getConnection };
