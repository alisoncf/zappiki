document.addEventListener('DOMContentLoaded', () => {
    const qrImage = document.getElementById('qr-image');
    const sendImageForm = document.getElementById('sendImageForm');
    const statusDiv = document.getElementById('status');

    // Obtém o QR Code
    fetch('http://localhost:3000/qr-code')
        .then(response => response.json())
        .then(data => {
            qrImage.src = data.qrCode;
        })
        .catch(err => {
            statusDiv.textContent = 'Erro ao carregar QR Code.';
        });

    // Envia a mensagem
    sendImageForm.addEventListener('submit', event => {
        event.preventDefault();

        const formData = new FormData(sendImageForm);

        fetch('http://localhost:3000/send-message', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    statusDiv.textContent = 'Mensagem enviada com sucesso!';
                } else {
                    statusDiv.textContent = 'Erro ao enviar mensagem: ' + data.error;
                }
            })
            .catch(err => {
                statusDiv.textContent = 'Erro ao enviar mensagem.';
            });
    });
});
