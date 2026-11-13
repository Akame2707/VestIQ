(() => {
  
  
  'use strict'; 
  const DB = Object.freeze({
    users: 'vestiqUsuarios',      
    products: 'vestiqProdutos',  
    requests: 'vestiqReservas',  
    session: 'vestiqLogado',     
    alerts: 'vestiqAvisos',      
    theme: 'vestiqTema'          
  });
  

  
  const ROLES = Object.freeze({
    coordenador: 'Coordenador',
    supervisor: 'Supervisor',
    professor: 'Professor'
  });

  
  
  const $ = (id) => document.getElementById(id);

  
  const read = (key, fallback = []) => {
    try {
      
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback; 
    } catch (error) {
      
      console.error(`Não foi possível ler ${key}:`, error);
      return fallback;
    }
  };

  
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value)); 
      return true; 
    } catch (error) {
      console.error(`Não foi possível salvar ${key}:`, error);
      alertBox('Não foi possível salvar os dados neste navegador.');
      return false; 
    }
  };

  
  function seed() {
    const users = read(DB.users, null);
    
    if (!Array.isArray(users) || users.length === 0) {
      write(DB.users, [
        { id: 1, nome: 'Coordenação VestIQ', email: 'coordenador@vestiq.com', senha: 'VestIQ123', cargo: 'coordenador', ativo: true },
        { id: 2, nome: 'Supervisor VestIQ', email: 'supervisor@vestiq.com', senha: 'VestIQ123', cargo: 'supervisor', ativo: true },
        { id: 3, nome: 'Professora Exemplo', email: 'professor@vestiq.com', senha: 'VestIQ123', cargo: 'professor', ativo: true }
      ]);
    }

    
    if (!Array.isArray(read(DB.products, null))) {
      write(DB.products, [
        { id: 1, nome: 'Agulha', categoria: 'Acessórios', quantidade: 9, minimo: 5 },
        { id: 2, nome: 'Linha', categoria: 'Costura', quantidade: 35, minimo: 10 },
        { id: 3, nome: 'Tecido', categoria: 'Tecidos', quantidade: 0, minimo: 5 },
        { id: 4, nome: 'Tesoura', categoria: 'Ferramentas', quantidade: 12, minimo: 4 }
      ]);
    }

    
    if (!Array.isArray(read(DB.requests, null))) write(DB.requests, []);
    if (!Array.isArray(read(DB.alerts, null))) write(DB.alerts, []);
  }

  
  function alertBox(message, type = 'erro') {
    let box = $('mensagemGlobal');
    
    if (!box) {
      box = document.createElement('div');
      box.id = 'mensagemGlobal';
      document.querySelector('main')?.prepend(box); 
    }
    if (!box) return; 

    box.className = `alerta ${type}`; 
    box.textContent = message;        
    box.classList.remove('oculto');   
  }

  
  function getTheme() {
    const saved = localStorage.getItem(DB.theme);
    if (saved === 'light' || saved === 'dark') return saved;
    
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme); 
    localStorage.setItem(DB.theme, theme); 

    
    document.querySelectorAll('.theme-toggle').forEach((button) => {
      button.textContent = theme === 'dark' ? '☀' : '☾';
      button.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    });
  }

  
  function ensureThemeToggle() {
    const host = document.querySelector('.usuario') || document.querySelector('.auth-main');
    if (!host || host.querySelector('.theme-toggle')) return; 

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    
    button.addEventListener('click', () => applyTheme(getTheme() === 'dark' ? 'light' : 'dark'));

    
    if (host.classList.contains('usuario')) host.insertBefore(button, host.firstChild);
    else {
      button.classList.add('auth-theme');
      host.append(button);
    }
    applyTheme(getTheme()); 
  }

  
  function currentSession() {
    let session = null;
    try {
      session = JSON.parse(sessionStorage.getItem(DB.session) || 'null');
    } catch {
      session = null;
    }

    if (!session?.id) return null; 

    
    const user = read(DB.users, []).find((item) => String(item.id) === String(session.id));
    if (!user || user.ativo === false) {
      sessionStorage.removeItem(DB.session); 
      return null;
    }
    return user;
  }

  
  function guard() {
    const user = currentSession();
    if (!user) {
      location.replace('login.html');
      return null;
    }
    return user;
  }

  
  const canManageProducts = (user) => user?.cargo === 'coordenador';           
  const canViewProducts = (user) => ['coordenador', 'professor'].includes(user?.cargo);
  const canViewReports = (user) => ['coordenador', 'supervisor'].includes(user?.cargo);
  const canManageUsers = (user) => user?.cargo === 'coordenador';              

  
  function saveAlert(message) {
    const alerts = read(DB.alerts, []);
    alerts.unshift({ 
      id: Date.now(),
      text: message,
      data: new Date().toLocaleString('pt-BR'),
      lido: false
    });
    write(DB.alerts, alerts.slice(0, 100)); 
  }

  
  function setSession(user) {
    sessionStorage.setItem(DB.session, JSON.stringify({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo
    }));
  }

  
  function shell(activePage) {
    const user = guard(); 
    if (!user) return null;

    ensureThemeToggle(); 

    
    document.querySelectorAll('[data-user-name]').forEach((node) => node.textContent = user.nome);
    
    document.querySelectorAll('[data-user-role]').forEach((node) => node.textContent = ROLES[user.cargo] || user.cargo);
    
    document.querySelectorAll('[data-avatar]').forEach((node) => {
      node.textContent = user.nome.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    });

    
    document.querySelectorAll('[data-link="produtos"]').forEach((node) => {
      node.classList.toggle('oculto', !canViewProducts(user));
    });
    
    document.querySelectorAll('[data-link="relatorios"]').forEach((node) => {
      node.classList.toggle('oculto', !canViewReports(user));
    });
    
    document.querySelectorAll(`[data-link="${activePage}"]`).forEach((node) => node.classList.add('ativo'));

    
    const menuButton = $('menuMobile');
    const menu = $('menu');
    menuButton?.addEventListener('click', () => {
      const opened = menu?.classList.toggle('aberto') ?? false;
      menuButton.setAttribute('aria-expanded', String(opened));
      menuButton.setAttribute('aria-label', opened ? 'Fechar menu' : 'Abrir menu');
    });

    
    $('btnSair')?.addEventListener('click', () => {
      sessionStorage.removeItem(DB.session);
      location.replace('login.html');
    });

    return user;
  }

  
  function getStatus(product) {
    const quantity = Number(product.quantidade) || 0;
    const minimum = Number(product.minimo) || 0;
    if (quantity <= 0) return 'zero';      
    if (quantity <= minimum) return 'baixo'; 
    return 'ok';                            
  }

  
  function statusLabel(value) {
    return ({ ok: 'Disponível', baixo: 'Estoque baixo', zero: 'Esgotado' })[value] || 'Indefinido';
  }

  
  function appendCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value ?? '';
    row.append(cell);
    return cell;
  }

 
  function renderHome() {
    const user = shell('inicio');
    if (!user) return;

    const products = read(DB.products, []);
    const requests = read(DB.requests, []);

    
    $('nProdutos').textContent = products.length;
    $('nUnidades').textContent = products.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
    $('nPedidos').textContent = requests.filter((item) => item.status === 'Reservado').length;
    $('nomeBoas').textContent = user.nome.split(' ')[0]; 
    if ($('cargoBoas')) $('cargoBoas').textContent = ROLES[user.cargo];

    
    const recent = $('ultimosPedidos');
    if (recent) {
      recent.replaceChildren(); 
      requests
        .slice()
        .sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0)) 
        .slice(0, 5)
        .forEach((request) => {
          const row = document.createElement('tr');
          [request.produtoNome, request.quantidade, request.professor, request.dataUso, request.status]
            .forEach((value) => appendCell(row, value));
          recent.append(row);
        });
    }

    
    const supervisorArea = $('areaSupervisor');
    if (supervisorArea) supervisorArea.classList.toggle('oculto', user.cargo !== 'supervisor' && user.cargo !== 'coordenador');

    
    const select = $('entradaProduto');
    if (select) {
      select.replaceChildren();
      products.forEach((product) => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.nome} — ${product.quantidade} disponível(is)`;
        select.append(option);
      });
    }

    
    const alertsBox = $('avisosRecentes');
    if (alertsBox && ['supervisor', 'coordenador'].includes(user.cargo)) {
      alertsBox.classList.remove('oculto');
      alertsBox.querySelectorAll('p').forEach((node) => node.remove());
      read(DB.alerts, []).slice(0, 5).forEach((alert) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = `${alert.data} — ${alert.text}`;
        alertsBox.append(paragraph);
      });
    }

    
    $('formEntrada')?.addEventListener('submit', (event) => {
      event.preventDefault(); 
      if (!['supervisor', 'coordenador'].includes(user.cargo)) return;

      const items = read(DB.products, []);
      const id = Number(select?.value);
      const amount = Number($('entradaQtd')?.value);
      const product = items.find((item) => Number(item.id) === id);

      if (!product || !Number.isInteger(amount) || amount < 1) {
        alertBox('Selecione um produto e informe uma quantidade válida.');
        return;
      }

      product.quantidade = (Number(product.quantidade) || 0) + amount;
      if (!write(DB.products, items)) return;

      saveAlert(`Entrada registrada: ${amount} unidade(s) de ${product.nome}.`);
      alertBox('Entrada de estoque registrada!', 'ok');
      event.target.reset();
      renderHomeRefresh(); 
    });
  }

  
  function renderHomeRefresh() {
    const products = read(DB.products, []);
    $('nProdutos').textContent = products.length;
    $('nUnidades').textContent = products.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);

    const select = $('entradaProduto');
    if (select) {
      select.replaceChildren();
      products.forEach((product) => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.nome} — ${product.quantidade} disponível(is)`;
        select.append(option);
      });
    }
  }

 
  function renderProducts() {
    const user = shell('produtos');
    if (!user) return;

    
    if (!canViewProducts(user)) {
      location.replace('index.html');
      return;
    }

    const body = $('listaProdutos');
    const form = $('formProduto');
    const formPanel = form?.closest('.painel');
    
    if (formPanel) formPanel.classList.toggle('oculto', !canManageProducts(user));

    
    const draw = () => {
      const products = read(DB.products, []);
      const term = ($('busca')?.value || '').trim().toLocaleLowerCase('pt-BR');

      body.replaceChildren(); 

      products
        .filter((product) =>
          `${product.nome} ${product.categoria} ${product.id}`.toLocaleLowerCase('pt-BR').includes(term)
        )
        .forEach((product) => {
          const row = document.createElement('tr');
          [product.nome, product.categoria, Number(product.quantidade) || 0, Number(product.minimo) || 0]
            .forEach((value) => appendCell(row, value));

          
          const statusCell = document.createElement('td');
          const badge = document.createElement('span');
          const state = getStatus(product);
          badge.className = `pill ${state === 'ok' ? '' : state}`;
          badge.textContent = statusLabel(state);
          statusCell.append(badge);
          row.append(statusCell);

          
          const actions = document.createElement('td');
          if (canManageProducts(user)) {
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'btn danger';
            remove.textContent = 'Excluir';
            remove.addEventListener('click', () => {
              if (!confirm(`Deseja excluir "${product.nome}"?`)) return;
              const updated = read(DB.products, []).filter((item) => item.id !== product.id);
              if (write(DB.products, updated)) {
                saveAlert(`Produto excluído: ${product.nome}`);
                draw();
                alertBox('Produto excluído.', 'ok');
              }
            });
            actions.append(remove);
          } else {
            actions.textContent = 'Somente consulta';
          }
          row.append(actions);
          body.append(row);
        });

      $('totalProdutos').textContent = products.length;
    };

    
    $('busca')?.addEventListener('input', draw);

    
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!canManageProducts(user)) {
        alertBox('Somente a coordenação pode cadastrar produtos.');
        return;
      }

      const name = $('nome').value.trim();
      const category = $('categoria').value.trim();
      const quantity = Number($('quantidade').value);
      const minimum = Number($('minimo').value);

      if (!name || !category || !Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(minimum) || minimum < 0) {
        alertBox('Confira os campos. Quantidade e estoque mínimo devem ser números inteiros iguais ou maiores que zero.');
        return;
      }

      const products = read(DB.products, []);
      
      const existing = products.find((item) => item.nome.trim().toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'));
      if (existing) {
        existing.quantidade = (Number(existing.quantidade) || 0) + quantity;
        existing.minimo = minimum;
        existing.categoria = category;
      } else {
        products.push({ id: Date.now(), nome: name, categoria: category, quantidade: quantity, minimo: minimum });
      }

      if (!write(DB.products, products)) return;
      saveAlert(`Produto cadastrado/atualizado: ${name}.`);
      alertBox('Produto salvo no estoque.', 'ok');
      form.reset();
      $('quantidade').value = 0;
      $('minimo').value = 5;
      draw();
    });

    draw(); 
  }

 
  function renderReports() {
    const user = shell('relatorios');
    if (!user) return;

    if (!canViewReports(user)) {
      location.replace('index.html');
      return;
    }

    const products = read(DB.products, []);

    
    $('rpTotal').textContent = products.length;
    $('rpQtd').textContent = products.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
    $('rpBaixo').textContent = products.filter((item) => getStatus(item) === 'baixo').length;
    $('rpZero').textContent = products.filter((item) => getStatus(item) === 'zero').length;

    
    const table = $('rpTabela');
    table.replaceChildren();
    products.forEach((product) => {
      const row = document.createElement('tr');
      [product.nome, product.categoria, Number(product.quantidade) || 0, Number(product.minimo) || 0, statusLabel(getStatus(product))]
        .forEach((value) => appendCell(row, value));
      table.append(row);
    });
  }

 
  function renderProfile() {
    const user = shell('perfil');
    if (!user) return;

    
    const fillProfile = (person) => {
      $('perfilNome').textContent = person.nome;
      $('perfilEmail').textContent = person.email;
      $('perfilCargo').textContent = ROLES[person.cargo] || person.cargo;
      $('perfilAvatar').textContent = person.nome.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    };
    fillProfile(user);

    
    const form = $('formPerfil');
    $('editNome').value = user.nome;
    $('editEmail').value = user.email;

    form?.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = $('editNome').value.trim();
      const email = $('editEmail').value.trim().toLowerCase();
      const password = $('editSenha').value;
      const confirmPassword = $('editSenha2').value;

      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alertBox('Informe um nome e um e-mail válido.');
        return;
      }
      if ((password || confirmPassword) && (password.length < 8 || password !== confirmPassword)) {
        alertBox('A nova senha deve ter ao menos 8 caracteres e coincidir com a confirmação.');
        return;
      }

      const users = read(DB.users, []);
      const index = users.findIndex((item) => String(item.id) === String(user.id));
      if (index < 0) return;

      
      if (users.some((item) => String(item.id) !== String(user.id) && item.email.toLowerCase() === email)) {
        alertBox('Este e-mail já está em uso por outro usuário.');
        return;
      }

      users[index].nome = name;
      users[index].email = email;
      if (password) users[index].senha = password;

      if (!write(DB.users, users)) return;

      setSession(users[index]); 
      saveAlert(`Perfil atualizado: ${name}`);
      fillProfile(users[index]);

      
      document.querySelectorAll('[data-user-name]').forEach((node) => node.textContent = name);
      document.querySelectorAll('[data-avatar]').forEach((node) => {
        node.textContent = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
      });

      $('editSenha').value = '';
      $('editSenha2').value = '';
      alertBox('Perfil atualizado com sucesso!', 'ok');
    });

    
    const adminPanel = $('adminUsers');
    if (!canManageUsers(user) || !adminPanel) return;

    adminPanel.classList.remove('oculto');
    const table = $('usuariosTabela');

    const drawUsers = () => {
      table.replaceChildren();
      read(DB.users, []).forEach((person) => {
        const row = document.createElement('tr');
        appendCell(row, person.nome);
        appendCell(row, person.email);

        
        const roleCell = document.createElement('td');
        if (String(person.id) === String(user.id)) {
          
          roleCell.textContent = ROLES[person.cargo];
        } else {
          const select = document.createElement('select');
          select.className = 'select-cargo';
          Object.entries(ROLES).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            option.selected = person.cargo === value;
            select.append(option);
          });

          select.addEventListener('change', () => {
            const users = read(DB.users, []);
            const target = users.find((item) => String(item.id) === String(person.id));
            if (!target) return;

            
            if (
              target.cargo === 'coordenador' &&
              select.value !== 'coordenador' &&
              users.filter((item) => item.cargo === 'coordenador' && item.ativo !== false).length <= 1
            ) {
              select.value = 'coordenador';
              alertBox('É necessário manter ao menos um coordenador ativo.');
              return;
            }

            target.cargo = select.value;
            if (!write(DB.users, users)) return;
            saveAlert(`Cargo de ${target.nome} alterado para ${ROLES[target.cargo]}.`);
            alertBox(`Cargo de ${target.nome} atualizado.`, 'ok');
          });
          roleCell.append(select);
        }
        row.append(roleCell);

        
        const actions = document.createElement('td');
        if (String(person.id) !== String(user.id)) {
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'btn danger';
          remove.textContent = 'Excluir';
          remove.addEventListener('click', () => {
            const users = read(DB.users, []);
            const target = users.find((item) => String(item.id) === String(person.id));
            if (!target || !confirm(`Deseja excluir a conta de ${target.nome}?`)) return;

            
            if (target.cargo === 'coordenador' && users.filter((item) => item.cargo === 'coordenador' && item.ativo !== false).length <= 1) {
              alertBox('Não é possível excluir o último coordenador ativo.');
              return;
            }

            if (write(DB.users, users.filter((item) => String(item.id) !== String(person.id)))) {
              saveAlert(`Usuário excluído: ${target.nome}`);
              drawUsers();
              alertBox('Usuário excluído.', 'ok');
            }
          });
          actions.append(remove);
        }
        row.append(actions);
        table.append(row);
      });
    };

    drawUsers();
  }

 
  function renderRequests() {
    const user = shell('pedidos');
    if (!user) return;

    const products = read(DB.products, []);
    const select = $('pedidoProduto');
    select.replaceChildren();

    
    products.forEach((product) => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = `${product.nome} — ${product.quantidade} disponível(is)`;
      option.disabled = Number(product.quantidade) <= 0;
      select.append(option);
    });

    const table = $('meusPedidos');

    
    const drawRequests = () => {
      table.replaceChildren();
      read(DB.requests, [])
        .filter((request) => String(request.professorId) === String(user.id))
        .sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0))
        .forEach((request) => {
          const row = document.createElement('tr');
          [request.produtoNome, request.quantidade, request.turma, request.curso, request.dataUso, request.status]
            .forEach((value) => appendCell(row, value));
          table.append(row);
        });
    };
    drawRequests();

    
    $('formPedido').addEventListener('submit', (event) => {
      event.preventDefault();

      const items = read(DB.products, []);
      const product = items.find((item) => Number(item.id) === Number(select.value));
      const quantity = Number($('pedidoQtd').value);
      const date = $('dataUso').value;
      const group = $('turma').value.trim();
      const course = $('curso').value.trim();

      if (!product || !Number.isInteger(quantity) || quantity < 1 || !date || !group || !course) {
        alertBox('Preencha todos os campos com valores válidos.');
        return;
      }

      
      const requestedDate = new Date(`${date}T12:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(requestedDate.getTime()) || requestedDate < today) {
        alertBox('Escolha uma data de utilização igual ou posterior a hoje.');
        return;
      }

      
      if (Number(product.quantidade) < quantity) {
        alertBox(`Estoque insuficiente. Há ${product.quantidade} unidade(s) de ${product.nome}.`);
        return;
      }

      
      product.quantidade = Number(product.quantidade) - quantity;
      if (!write(DB.products, items)) return;

      
      const requests = read(DB.requests, []);
      requests.push({
        id: Date.now(),
        produtoId: product.id,
        produtoNome: product.nome,
        quantidade: quantity,
        professorId: user.id,
        professor: user.nome,
        turma: group,
        curso: course,
        dataUso: date,
        status: 'Reservado',
        criadoEm: new Date().toISOString()
      });

      
      if (!write(DB.requests, requests)) {
        product.quantidade += quantity;
        write(DB.products, items);
        alertBox('Não foi possível registrar a reserva. O estoque foi restaurado.');
        return;
      }

      saveAlert(`Reserva realizada por ${user.nome}: ${quantity} ${product.nome} para ${date}.`);
      alertBox('Reserva confirmada! O estoque foi atualizado.', 'ok');
      event.target.reset();

      
      const option = select.querySelector(`option[value="${product.id}"]`);
      if (option) {
        option.textContent = `${product.nome} — ${product.quantidade} disponível(is)`;
        option.disabled = product.quantidade <= 0;
      }
      drawRequests();
    });
  }

 
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getTheme());   
    ensureThemeToggle();      
    seed();                   

    
    const page = document.body.dataset.page;
    const routes = {
      home: renderHome,
      products: renderProducts,
      reports: renderReports,
      profile: renderProfile,
      requests: renderRequests
    };

    
    if (routes[page]) routes[page]();
  });

  
  window.addEventListener('storage', (event) => {
    if (event.key === DB.theme && event.newValue) applyTheme(event.newValue);
  });
})();