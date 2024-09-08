const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');

// Criação de um novo cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth()
});

// Geração do QR Code para autenticação
client.on('qr', async qr => {
    try {
        // Gera o QR Code como uma imagem e salva
        await qrcode.toFile('qrcode.png', qr);
        console.log('QR Code gerado e salvo como qrcode.png');
    } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
    }
});

// Evento quando o cliente está pronto
client.on('ready', () => {
    console.log('Client is ready!');
    sendMessage();
});

// Função para enviar uma mensagem
function sendMessage() {
    // Número do destinatário no formato internacional
    const number = '556281229060'; // Substitua pelo número do destinatário
    const formattedNumber = number + '@c.us'; // Formato correto

    const message = 'Olá, esta é uma mensagem automatizada!';

 

    // Envia a mensagem
    client.sendMessage(formattedNumber, message).then(response => {
        console.log('Mensagem enviada:', response);
    }).catch(err => {
        console.error('Erro ao enviar mensagem:', err);
    });
}

// Inicialização do cliente
client.initialize();
