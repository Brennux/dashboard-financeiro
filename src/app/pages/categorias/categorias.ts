import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { TransacoesService, Transacao } from '../../service/transacoes.service';

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
  transacoes: Transacao[] = [];
  categoriasFiltradas: Categoria[] = [];
  mostrarModal = false;
  modoEdicao = false;
  categoriaEditando: Categoria | null = null;
  filtroTipo: 'todos' | 'receita' | 'despesa' = 'todos';
  filtroBusca = '';
  mostrarInativos = false;

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
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = this.formatarValor(context.parsed);
            const percentage = ((context.parsed / this.getTotalValor()) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };


  constructor(private transacoesService: TransacoesService) { }

  ngOnInit(): void {
    this.carregarCategorias();
    this.atualizarCategoriasComTransacoes();
    this.aplicarFiltros();
    this.atualizarGrafico();
    this.transacoesService.transacoes$.subscribe(transacoes => {
      this.transacoes = transacoes;
      this.atualizarCategoriasComTransacoes();
      this.aplicarFiltros();
      this.atualizarGrafico();
    });
  }

  carregarCategorias(): void {
    // Inicializa categorias cadastradas manualmente (se houver)
    this.categorias = [
      { id: 1, nome: 'Alimentação', icone: 'fas fa-utensils', cor: '#EF4444', tipo: 'despesa', totalTransacoes: 0, valorTotal: 0, ativa: true },
      { id: 2, nome: 'Transporte', icone: 'fas fa-car', cor: '#3B82F6', tipo: 'despesa', totalTransacoes: 0, valorTotal: 0, ativa: true },
      { id: 3, nome: 'Lazer', icone: 'fas fa-gamepad', cor: '#8B5CF6', tipo: 'despesa', totalTransacoes: 0, valorTotal: 0, ativa: true },
      { id: 4, nome: 'Salário', icone: 'fas fa-briefcase', cor: '#10B981', tipo: 'receita', totalTransacoes: 0, valorTotal: 0, ativa: true },
      { id: 5, nome: 'Freelance', icone: 'fas fa-laptop', cor: '#F59E0B', tipo: 'receita', totalTransacoes: 0, valorTotal: 0, ativa: true },
      { id: 6, nome: 'Educação', icone: 'fas fa-graduation-cap', cor: '#06B6D4', tipo: 'despesa', totalTransacoes: 0, valorTotal: 0, ativa: false }
    ];
  }

  atualizarCategoriasComTransacoes(): void {
    // Gera categorias a partir das transações, mantendo as cadastradas manualmente
    const categoriasMap = new Map<string, Categoria>();
    let nextId = this.categorias.length > 0 ? Math.max(...this.categorias.map(c => c.id)) + 1 : 1;

    // Adiciona categorias já cadastradas
    this.categorias.forEach(cat => {
      categoriasMap.set(cat.nome, { ...cat, totalTransacoes: 0, valorTotal: 0 });
    });

    // Gera categorias a partir das transações
    this.transacoes.forEach(transacao => {
      let categoria = categoriasMap.get(transacao.categoria);
      if (!categoria) {
        // Se não existe, cria uma nova categoria com valores padrão
        categoria = {
          id: nextId++,
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
    // Mostra todas as categorias ativas com valor diferente de zero (receita ou despesa)
    const categoriasAtivas = this.categorias.filter(c => c.ativa && c.valorTotal !== 0);

    if (categoriasAtivas.length === 0) {
      // Garante que o gráfico nunca suma
      this.pieChartData.labels = ['Sem dados'];
      this.pieChartData.datasets[0].data = [0];
      this.pieChartData.datasets[0].backgroundColor = ['#E5E7EB']; // cinza claro
    } else {
      this.pieChartData.labels = categoriasAtivas.map(c => c.nome);
      this.pieChartData.datasets[0].data = categoriasAtivas.map(c => Math.abs(c.valorTotal));
      this.pieChartData.datasets[0].backgroundColor = categoriasAtivas.map(c => c.cor);
    }
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
  }

  salvarCategoria(): void {
    if (!this.novaCategoria.nome.trim()) return;

    if (this.modoEdicao && this.categoriaEditando) {
      // Editar categoria existente
      const index = this.categorias.findIndex(c => c.id === this.categoriaEditando!.id);
      if (index !== -1) {
        this.categorias[index] = {
          ...this.categorias[index],
          nome: this.novaCategoria.nome,
          icone: this.novaCategoria.icone,
          cor: this.novaCategoria.cor,
          tipo: this.novaCategoria.tipo
        };
      }
    } else {
      // Criar nova categoria
      const novaId = Math.max(...this.categorias.map(c => c.id), 0) + 1;
      this.categorias.push({
        id: novaId,
        nome: this.novaCategoria.nome,
        icone: this.novaCategoria.icone,
        cor: this.novaCategoria.cor,
        tipo: this.novaCategoria.tipo,
        totalTransacoes: 0,
        valorTotal: 0,
        ativa: true
      });
    }

    this.aplicarFiltros();
    this.atualizarGrafico();
    this.fecharModal();
  }

  alternarStatusCategoria(categoria: Categoria): void {
    categoria.ativa = !categoria.ativa;
    this.aplicarFiltros();
    this.atualizarGrafico();
  }

  excluirCategoria(categoria: Categoria): void {
    if (confirm(`Tem certeza que deseja excluir a categoria "${categoria.nome}"?`)) {
      this.categorias = this.categorias.filter(c => c.id !== categoria.id);
      this.aplicarFiltros();
      this.atualizarGrafico();
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
}
