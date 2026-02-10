export const mockBarbeiros = [
  { id: '1', nome: 'Carlos Silva', telefone: '(11) 99999-0001', ativo: true, comissao: 40 },
  { id: '2', nome: 'Rafael Santos', telefone: '(11) 99999-0002', ativo: true, comissao: 40 },
  { id: '3', nome: 'André Oliveira', telefone: '(11) 99999-0003', ativo: true, comissao: 35 },
  { id: '4', nome: 'Lucas Mendes', telefone: '(11) 99999-0004', ativo: false, comissao: 40 },
];

export const mockServicos = [
  { id: '1', nome: 'Corte Masculino', preco: 45, duracao: 30, ativo: true },
  { id: '2', nome: 'Barba', preco: 35, duracao: 20, ativo: true },
  { id: '3', nome: 'Corte + Barba', preco: 70, duracao: 45, ativo: true },
  { id: '4', nome: 'Sobrancelha', preco: 15, duracao: 10, ativo: true },
  { id: '5', nome: 'Pigmentação', preco: 80, duracao: 40, ativo: true },
  { id: '6', nome: 'Hidratação', preco: 50, duracao: 30, ativo: false },
];

export const mockProdutos = [
  { id: '1', nome: 'Pomada Modeladora', preco: 35, quantidade: 2, minimo: 5 },
  { id: '2', nome: 'Shampoo Profissional', preco: 28, quantidade: 1, minimo: 3 },
  { id: '3', nome: 'Cerveja Artesanal', preco: 15, quantidade: 24, minimo: 10 },
  { id: '4', nome: 'Água Mineral', preco: 5, quantidade: 30, minimo: 12 },
  { id: '5', nome: 'Óleo para Barba', preco: 45, quantidade: 8, minimo: 5 },
  { id: '6', nome: 'Cera Capilar', preco: 40, quantidade: 6, minimo: 5 },
];

export const mockAtendimentos = [
  { id: '1', data: '2026-02-10T14:30:00', cliente: 'João Silva', barbeiro: 'Carlos Silva', servicos: ['Corte + Barba'], produtos: [] as string[], formaPagamento: 'Pix', total: 70, observacoes: '' },
  { id: '2', data: '2026-02-10T13:15:00', cliente: 'Pedro Santos', barbeiro: 'Rafael Santos', servicos: ['Corte Masculino'], produtos: ['Cerveja Artesanal'], formaPagamento: 'Cartão Débito', total: 60, observacoes: '' },
  { id: '3', data: '2026-02-10T12:00:00', cliente: 'Lucas Oliveira', barbeiro: 'Carlos Silva', servicos: ['Barba'], produtos: [] as string[], formaPagamento: 'Dinheiro', total: 35, observacoes: 'Cliente VIP' },
  { id: '4', data: '2026-02-10T11:30:00', cliente: 'Marcos Lima', barbeiro: 'André Oliveira', servicos: ['Corte Masculino', 'Sobrancelha'], produtos: [] as string[], formaPagamento: 'Pix', total: 60, observacoes: '' },
  { id: '5', data: '2026-02-10T10:00:00', cliente: 'Gabriel Costa', barbeiro: 'Rafael Santos', servicos: ['Corte Masculino'], produtos: ['Pomada Modeladora'], formaPagamento: 'Cartão Crédito', total: 80, observacoes: '' },
];
