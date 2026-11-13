/* Login VestIQ — protótipo local */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const USERS_KEY = 'vestiqUsuarios';

  function readUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  }

  function ensureDemoAccounts() {
    const users = readUsers();
    if (users.length > 0) return;
    localStorage.setItem(USERS_KEY, JSON.stringify([
      { id: 1, nome: 'Coordenação VestIQ', email: 'coordenador@vestiq.com', senha: 'VestIQ123', cargo: 'coordenador', ativo: true },
      { id: 2, nome: 'Supervisor VestIQ', email: 'supervisor@vestiq.com', senha: 'VestIQ123', cargo: 'supervisor', ativo: true },
      { id: 3, nome: 'Professora Exemplo', email: 'professor@vestiq.com', senha: 'VestIQ123', cargo: 'professor', ativo: true }
    ]));
  }

  function showMessage(message, type = 'erro') {
    const box = $('msg');
    box.textContent = message;
    box.className = `alerta ${type}`;
  }

  function setupTheme() {
    const theme = localStorage.getItem('vestiqTema') ||
      (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    const host = document.querySelector('.auth-main');
    if (!host) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle auth-theme';
    const apply = (value) => {
      document.documentElement.setAttribute('data-theme', value);
      localStorage.setItem('vestiqTema', value);
      button.textContent = value === 'dark' ? '☀' : '☾';
      button.setAttribute('aria-label', value === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    };
    button.addEventListener('click', () => apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    host.append(button);
    apply(theme);
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureDemoAccounts();
    setupTheme();
    const form = $('login');
    const email = $('email');
    const password = $('senha');
    const role = $('cargo');
    const button = form.querySelector('button[type="submit"], button:not([type])');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const normalizedEmail = email.value.trim().toLowerCase();
      if (!normalizedEmail || !password.value) {
        showMessage('Preencha seu e-mail e sua senha.');
        return;
      }

      const user = readUsers().find((item) =>
        item.email?.toLowerCase() === normalizedEmail &&
        item.senha === password.value &&
        item.cargo === role.value &&
        item.ativo !== false
      );

      if (!user) {
        showMessage('E-mail, senha ou perfil incorretos. Confira seus dados.');
        return;
      }

      sessionStorage.setItem('vestiqLogado', JSON.stringify({
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo
      }));

      if (button) {
        button.disabled = true;
        button.textContent = 'Entrando...';
      }
      location.replace('index.html');
    });

    form.querySelectorAll('input, select').forEach((field) => {
      field.addEventListener('input', () => {
        $('msg').textContent = '';
        $('msg').className = '';
      });
    });
  });
})();
