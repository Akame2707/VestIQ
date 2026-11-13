// Recuperação de senha demonstrativa do VestIQ.
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formRecuperar');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('novaSenha');
    const confirmInput = document.getElementById('confirmarSenha');
    const message = document.getElementById('mensagem');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const confirmation = confirmInput.value;

        if (password.length < 8) {
            showMessage('A senha precisa ter pelo menos 8 caracteres.', 'erro');
            return;
        }

        if (password !== confirmation) {
            showMessage('As senhas não são iguais.', 'erro');
            return;
        }

        let users = [];
        try {
            users = JSON.parse(localStorage.getItem('vestiqUsuarios')) || [];
        } catch {
            showMessage('Não foi possível ler os usuários cadastrados.', 'erro');
            return;
        }

        const user = users.find((item) => item.email.toLowerCase() === email);
        if (!user) {
            showMessage('Não encontramos uma conta com esse e-mail.', 'erro');
            return;
        }

        user.senha = password;
        localStorage.setItem('vestiqUsuarios', JSON.stringify(users));
        showMessage('Senha alterada! Você já pode entrar com a nova senha.', 'sucesso');
        form.reset();
    });

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `alerta ${type}`;
    }
});
