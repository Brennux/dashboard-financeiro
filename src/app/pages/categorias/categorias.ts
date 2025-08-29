import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { TransacoesService, } from '../../service/transacoes.service';
import { CategoriasService, CategoriaBase } from '../../service/categorias.service';
import { ValidationService, ValidationError } from '../../service/validation.service';
import { NotificationService } from '../../service/notification.service';
import { ITransacaoRequest } from '../../interfaces/transacao-request.interface';

export interface Categoria {
  id: number;
  nome: string;
  icone: string;
  cor: string;
  tipo: 'receita' | 'despesa';
  totalTransacoes: number;
  valorTotal: number;
  ativa: boolean;
}

export interface NovaCategoria {
  nome: string;
  icone: string;
  cor: string;
  tipo: 'receita' | 'despesa';
}

@Component({
  selector: 'app-categorias',
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss'
})
export class Categorias implements OnInit {
  categorias: Categoria[] = [];
  categoriasBase: CategoriaBase[] = [];
  transacoes: ITransacaoRequest[] = [];
  categoriasFiltradas: Categoria[] = [];
  mostrarModal = false;
  modoEdicao = false;
  categoriaEditando: Categoria | null = null;
  filtroTipo: 'todos' | 'receita' | 'despesa' = 'todos';
  filtroBusca = '';
  mostrarInativos = false;
  validationErrors: ValidationError[] = [];
  isSubmitting: boolean = false;

  // Propriedades para o calendário
  mostrarCalendario: boolean = false;
  anoAtual: number = new Date().getFullYear();
  nomesMeses: string[] = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  mesSelecionado: string = '';
  textoMesSelecionado: string = '';
  mesesComTransacoes: Set<string> = new Set();
  toggleCalendario(): void {
    this.mostrarCalendario = !this.mostrarCalendario;
  }

  alterarAno(delta: number): void {
    this.anoAtual += delta;
  }

  selecionarMes(mes: number, ano: number): void {
    this.mesSelecionado = `${ano}-${(mes + 1).toString().padStart(2, '0')}`;
    this.textoMesSelecionado = `${this.nomesMeses[mes]}/${ano}`;
    this.mostrarCalendario = false;
    this.onFiltroMes();
  }

  verificarMesSelecionado(mes: number, ano: number): boolean {
    return this.mesSelecionado === `${ano}-${(mes + 1).toString().padStart(2, '0')}`;
  }

  limparFiltroMes(): void {
    this.configurarMesAtual();
    this.mostrarCalendario = false;
    this.onFiltroMes();
  }

  fecharCalendario(): void {
    this.mostrarCalendario = false;
  }

  atualizarMesesComTransacoes(): void {
    this.mesesComTransacoes.clear();
    this.transacoes.forEach(transacao => {
      const data = new Date(transacao.data);
      const chave = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
      this.mesesComTransacoes.add(chave);
    });
  }

  verificarMesComTransacoes(mes: number, ano: number): boolean {
    const chave = `${ano}-${(mes + 1).toString().padStart(2, '0')}`;
    return this.mesesComTransacoes.has(chave);
  }

  novaCategoria: NovaCategoria = {
    nome: '',
    icone: 'fas fa-tag',
    cor: '#3B82F6',
    tipo: 'despesa'
  };

  // Ícones disponíveis
  iconesDisponiveis = [
    'fas fa-home', 'fas fa-car', 'fas fa-utensils', 'fas fa-shopping-cart',
    'fas fa-gamepad', 'fas fa-plane', 'fas fa-gift', 'fas fa-heart',
    'fas fa-book', 'fas fa-dumbbell', 'fas fa-mobile-alt', 'fas fa-wifi',
    'fas fa-bolt', 'fas fa-tshirt', 'fas fa-pills', 'fas fa-gas-pump',
    'fas fa-film', 'fas fa-music', 'fas fa-coffee', 'fas fa-beer',
    'fas fa-graduation-cap', 'fas fa-briefcase', 'fas fa-chart-line', 'fas fa-piggy-bank'
  ];

  // Cores disponíveis
  coresDisponiveis = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
    '#06B6D4', '#F43F5E', '#8B5A2B', '#6B7280', '#1F2937'
  ];

  // Configuração do gráfico
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            // Desabilita tooltip se não há dados reais
            if (context.label === 'Nenhum dado disponível') return '';

            const label = context.label || '';
            const value = this.formatarValor(context.parsed);
            const total = this.pieChartData.datasets[0].data.reduce((acc: number, val: any) => acc + val, 0);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };


  constructor(
    private transacoesService: TransacoesService,
    private categoriasService: CategoriasService,
    private validationService: ValidationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // Configurar filtro para o mês atual por padrão
    this.configurarMesAtual();

    this.carregarCategorias();
    this.atualizarCategoriasComTransacoes();
    this.atualizarMesesComTransacoes();
    this.aplicarFiltros();
    this.atualizarGrafico();

    // Subscrever às mudanças das transações
    this.transacoesService.transacoes$.subscribe(transacoes => {
      this.transacoes = transacoes;
      this.atualizarCategoriasComTransacoes();
      this.atualizarMesesComTransacoes();
      this.aplicarFiltros();
      this.atualizarGrafico();
    });

    // Subscrever às mudanças das categorias
    this.categoriasService.categorias$.subscribe(categorias => {
      this.categoriasBase = categorias;
      this.atualizarCategoriasComTransacoes();
      this.aplicarFiltros();
      this.atualizarGrafico();
    });
  }

  configurarMesAtual(): void {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth();

    this.anoAtual = ano;
    this.mesSelecionado = `${ano}-${(mes + 1).toString().padStart(2, '0')}`;
    this.textoMesSelecionado = `${this.nomesMeses[mes]}/${ano}`;
  }

  onFiltroMes(): void {
    this.atualizarCategoriasComTransacoes();
    this.atualizarMesesComTransacoes();
    this.aplicarFiltros();
    this.atualizarGrafico();
  }

  carregarCategorias(): void {
    // As categorias agora são carregadas automaticamente pelo serviço
    // Este método é mantido para compatibilidade, mas não faz nada
  }

  atualizarCategoriasComTransacoes(): void {
    // Gera categorias a partir das categorias base do serviço e das transações
    const categoriasMap = new Map<string, Categoria>();

    // Adiciona categorias do serviço
    this.categoriasBase.forEach(catBase => {
      categoriasMap.set(catBase.nome, {
        id: catBase.id,
        nome: catBase.nome,
        icone: catBase.icone,
        cor: catBase.cor,
        tipo: catBase.tipo,
        ativa: catBase.ativa,
        totalTransacoes: 0,
        valorTotal: 0
      });
    });

    // Filtra transações pelo mês selecionado, se houver
    const transacoesFiltradas = this.mesSelecionado
      ? this.transacoes.filter(t => {
        const data = new Date(t.data);
        const mes = data.toISOString().slice(0, 7); // 'YYYY-MM'
        return mes === this.mesSelecionado;
      })
      : this.transacoes;

    // Gera categorias a partir das transações filtradas
    transacoesFiltradas.forEach(transacao => {
      let categoria = categoriasMap.get(transacao.categoria);
      if (!categoria) {
        // Se não existe nas categorias base, cria uma temporária
        const nextId = Math.max(...this.categoriasBase.map(c => c.id), 0) + 1;
        categoria = {
          id: nextId,
          nome: transacao.categoria,
          icone: 'fas fa-tag',
          cor: '#3B82F6',
          tipo: transacao.valor >= 0 ? 'receita' : 'despesa',
          totalTransacoes: 0,
          valorTotal: 0,
          ativa: true
        };
        categoriasMap.set(transacao.categoria, categoria);
      }
      categoria.totalTransacoes++;
      categoria.valorTotal += transacao.valor;
    });

    this.categorias = Array.from(categoriasMap.values());
  }

  aplicarFiltros(): void {
    this.categoriasFiltradas = this.categorias.filter(categoria => {
      const passaTipoFiltro = this.filtroTipo === 'todos' || categoria.tipo === this.filtroTipo;
      const passaBuscaFiltro = categoria.nome.toLowerCase().includes(this.filtroBusca.toLowerCase());
      const passaAtivoFiltro = this.mostrarInativos || categoria.ativa;

      return passaTipoFiltro && passaBuscaFiltro && passaAtivoFiltro;
    });
  }

  atualizarGrafico(): void {
    // Filtra transações pelo mês selecionado para o gráfico
    const transacoesFiltradas = this.mesSelecionado
      ? this.transacoes.filter(t => {
        const data = new Date(t.data);
        const mes = data.toISOString().slice(0, 7); // 'YYYY-MM'
        return mes === this.mesSelecionado;
      })
      : this.transacoes;

    // Cria um mapa para calcular valores por categoria
    const categoriasMap = new Map<string, { nome: string, cor: string, valor: number }>();

    // Inicializa com categorias ativas
    this.categorias.forEach(cat => {
      if (cat.ativa) {
        categoriasMap.set(cat.nome, { nome: cat.nome, cor: cat.cor, valor: 0 });
      }
    });

    // Soma valores das transações filtradas
    transacoesFiltradas.forEach(transacao => {
      const cat = categoriasMap.get(transacao.categoria);
      if (cat) {
        cat.valor += transacao.valor;
      }
    });

    const categoriasComValor = Array.from(categoriasMap.values()).filter(c => c.valor !== 0);
    const hasData = categoriasComValor.length > 0;

    // Força a recriação do objeto para garantir que o Chart.js detecte as mudanças
    this.pieChartData = {
      labels: hasData ? categoriasComValor.map(c => c.nome) : ['Nenhum dado disponível'],
      datasets: [{
        data: hasData ? categoriasComValor.map(c => Math.abs(c.valor)) : [1],
        backgroundColor: hasData ? categoriasComValor.map(c => c.cor) : ['#E5E7EB'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  abrirModal(categoria?: Categoria): void {
    this.mostrarModal = true;
    if (categoria) {
      this.modoEdicao = true;
      this.categoriaEditando = categoria;
      this.novaCategoria = {
        nome: categoria.nome,
        icone: categoria.icone,
        cor: categoria.cor,
        tipo: categoria.tipo
      };
    } else {
      this.modoEdicao = false;
      this.categoriaEditando = null;
      this.resetarFormulario();
    }
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.modoEdicao = false;
    this.categoriaEditando = null;
    this.resetarFormulario();
  }

  resetarFormulario(): void {
    this.novaCategoria = {
      nome: '',
      icone: 'fas fa-tag',
      cor: '#3B82F6',
      tipo: 'despesa'
    };
    // Limpar erros de validação
    this.validationErrors = [];
    this.isSubmitting = false;
  }

  salvarCategoria(): void {
    // Limpar erros anteriores
    this.validationErrors = [];

    // Validar categoria
    this.validationErrors = this.validationService.validateCategoria(this.novaCategoria);

    if (this.validationErrors.length > 0) {
      this.notificationService.error('Erro de Validação', 'Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    if (!this.novaCategoria.nome.trim()) {
      this.notificationService.error('Campo Obrigatório', 'O nome da categoria é obrigatório.');
      return;
    }

    this.isSubmitting = true;

    try {
      if (this.modoEdicao && this.categoriaEditando) {
        // Editar categoria existente
        this.categoriasService.editarCategoria(this.categoriaEditando.id, {
          nome: this.novaCategoria.nome,
          icone: this.novaCategoria.icone,
          cor: this.novaCategoria.cor,
          tipo: this.novaCategoria.tipo,
          ativa: this.categoriaEditando.ativa
        });
        this.notificationService.categoriaEditada(this.novaCategoria.nome);
      } else {
        // Criar nova categoria
        this.categoriasService.adicionarCategoria({
          nome: this.novaCategoria.nome,
          icone: this.novaCategoria.icone,
          cor: this.novaCategoria.cor,
          tipo: this.novaCategoria.tipo,
          ativa: true
        });
        this.notificationService.categoriaAdicionada(this.novaCategoria.nome);
      }

      this.fecharModal();
    } catch (error) {
      this.notificationService.error('Erro', 'Erro ao salvar categoria. Tente novamente.');
    } finally {
      this.isSubmitting = false;
    }
  }

  alternarStatusCategoria(categoria: Categoria): void {
    try {
      this.categoriasService.alternarStatusCategoria(categoria.id);
      const novoStatus = categoria.ativa ? 'desativada' : 'ativada';
      this.notificationService.success(
        'Status Alterado',
        `Categoria "${categoria.nome}" foi ${novoStatus} com sucesso.`
      );
    } catch (error) {
      this.notificationService.error('Erro', 'Erro ao alterar status da categoria. Tente novamente.');
    }
  }

  excluirCategoria(categoria: Categoria): void {
    if (confirm(`Tem certeza que deseja excluir a categoria "${categoria.nome}"?`)) {
      this.categoriasService.excluirCategoria(categoria.id);
    }
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  getTotalValor(): number {
    return this.categorias
      .filter(c => c.ativa)
      .reduce((total, categoria) => total + Math.abs(categoria.valorTotal), 0);
  }

  getTotalReceitas(): number {
    return this.categorias
      .filter(c => c.ativa && c.tipo === 'receita')
      .reduce((total, categoria) => total + categoria.valorTotal, 0);
  }

  getTotalDespesas(): number {
    return this.categorias
      .filter(c => c.ativa && c.tipo === 'despesa')
      .reduce((total, categoria) => total + Math.abs(categoria.valorTotal), 0);
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  getCategoriasAtivas(): number {
    return this.categorias.filter(c => c.ativa).length;
  }

  // Métodos para validação e exibição de erros
  getFieldError(fieldName: string): string | null {
    const error = this.validationErrors.find(error => error.field === fieldName);
    return error ? error.message : null;
  }

  hasFieldError(fieldName: string): boolean {
    return this.validationErrors.some(error => error.field === fieldName);
  }

  getFieldClass(fieldName: string): string {
    if (this.hasFieldError(fieldName)) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    }
    return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  }
}
