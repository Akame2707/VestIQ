/* Cadastro de usuários — exclusivo da coordenação */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const USERS_KEY = 'vestiqUsuarios';

  function readUsers() {
    try {
      const value = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function message(text, type = 'erro') {
    const box = $('msg');
    box.textContent = text;
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
    setupTheme();
    const session = (() => {
      try { return JSON.parse(sessionStorage.getItem('vestiqLogado') || 'null'); }
      catch { return null; }
    })();
    const currentUser = session && readUsers().find((user) =>
      String(user.id) === String(session.id) && user.ativo !== false
    );

    const form = $('cadastro');
    if (!currentUser || currentUser.cargo !== 'coordenador') {
      $('acessoNegado').classList.remove('oculto');
      $('btnEntrarCoord').classList.remove('oculto');
      form.classList.add('oculto');
      return;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = $('nome').value.trim();
      const email = $('email').value.trim().toLowerCase();
      const password = $('senha').value;
      const role = $('cargo').value;

      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        message('Informe um nome válido e um e-mail válido.');
        return;
      }
      if (password.length < 8) {
        message('A senha provisória deve ter pelo menos 8 caracteres.');
        return;
      }
      if (!['professor', 'supervisor', 'coordenador'].includes(role)) {
        message('Selecione um cargo válido.');
        return;
      }

      const users = readUsers();
      if (users.some((user) => user.email?.toLowerCase() === email)) {
        message('Este e-mail já está cadastrado.');
        return;
      }
      users.push({
        id: Date.now(),
        nome: name,
        email,
        senha: password,
        cargo: role,
        ativo: true
      });

      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        message('Usuário criado com sucesso!', 'ok');
        form.reset();
      } catch (error) {
        console.error(error);
        message('Não foi possível salvar o usuário neste navegador.');
      }
    });
  });
})();
