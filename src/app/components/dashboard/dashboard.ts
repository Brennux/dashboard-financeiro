import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { TransacoesService, Transacao } from '../../service/transacoes.service';
import { Subscription } from 'rxjs';

interface GastoCategoria {
  categoria: string;
  total: number;
  cor: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  gastosPorCategoria: GastoCategoria[] = [];
  receitasPorCategoria: { categoria: string; total: number; }[] = [];
  transacoesRecentes: Transacao[] = [];
  private transacoesSub!: Subscription;
  private todasTransacoes: Transacao[] = [];

  // Propriedades para controle de período
  mesAtual: number = new Date().getMonth();
  anoAtual: number = new Date().getFullYear();

  constructor(private transacoesService: TransacoesService) { }

  pieChart: Chart | null = null;
  barChart: Chart | null = null;

  ngOnInit() {
    this.transacoesSub = this.transacoesService.transacoes$.subscribe(transacoes => {
      this.todasTransacoes = transacoes;
      this.transacoesRecentes = transacoes.slice(0, 5);
      this.processarDadosParaGrafico();

      // Recrear gráficos quando dados mudarem
      if (this.pieChart) {
        this.pieChart.destroy();
      }
      if (this.barChart) {
        this.barChart.destroy();
      }
      setTimeout(() => {
        this.createPieChart();
        this.createBarChart();
      }, 100);
    });
  }

  ngOnDestroy() {
    if (this.transacoesSub) {
      this.transacoesSub.unsubscribe();
    }
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    if (this.barChart) {
      this.barChart.destroy();
    }
  }

  processarDadosParaGrafico() {
    // Filtrar transações do período selecionado
    const transacoesDoMes = this.todasTransacoes.filter(t => {
      const data = new Date(t.data);
      return data.getMonth() === this.mesAtual && data.getFullYear() === this.anoAtual;
    });

    // Agrupar transações por categoria - DESPESAS (valores negativos)
    const gastosPorCategoria = new Map<string, number>();

    transacoesDoMes
      .filter(t => t.valor < 0) // Apenas despesas
      .forEach(transacao => {
        const categoria = transacao.categoria;
        const valorAtual = gastosPorCategoria.get(categoria) || 0;
        gastosPorCategoria.set(categoria, valorAtual + Math.abs(transacao.valor));
      });

    // Agrupar transações por categoria - RECEITAS (valores positivos)
    const receitasPorCategoria = new Map<string, number>();

    transacoesDoMes
      .filter(t => t.valor > 0) // Apenas receitas
      .forEach(transacao => {
        const categoria = transacao.categoria;
        const valorAtual = receitasPorCategoria.get(categoria) || 0;
        receitasPorCategoria.set(categoria, valorAtual + transacao.valor);
      });

    // Converter para o formato esperado pelo gráfico - DESPESAS
    this.gastosPorCategoria = Array.from(gastosPorCategoria.entries()).map(([categoria, total]) => ({
      categoria,
      total,
      cor: this.getCoresPorCategoria(categoria)
    }));

    // Converter para o formato esperado pelo gráfico - RECEITAS
    this.receitasPorCategoria = Array.from(receitasPorCategoria.entries()).map(([categoria, total]) => ({
      categoria,
      total
    }));
  }

  getCoresPorCategoria(categoria: string): string {
    const coresMap: { [key: string]: string } = {
      'Alimentação': 'red',
      'Transporte': 'blue',
      'Entretenimento': 'purple',
      'Renda': 'green',
      'Saúde': 'pink',
      'Educação': 'indigo',
      'Lazer': 'orange',
      'Compras': 'yellow',
      'Contas': 'gray',
      'Outros': 'cyan'
    };
    return coresMap[categoria] || 'gray';
  }

  createPieChart(): void {
    const ctx = document.getElementById('pieChart') as HTMLCanvasElement;

    if (!ctx) {
      return;
    }

    Chart.register(...registerables);

    // Se não há dados, criar gráfico vazio com mensagem
    const hasData = this.gastosPorCategoria.length > 0;

    const data = {
      labels: hasData ? this.gastosPorCategoria.map(g => g.categoria) : ['Nenhum dado disponível'],
      datasets: [{
        data: hasData ? this.gastosPorCategoria.map(g => g.total) : [1],
        backgroundColor: hasData ? this.gastosPorCategoria.map(g => this.getCategoriaColor(g.cor)) : ['#E5E7EB'],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 4,
        hoverOffset: 8
      }]
    };

    const config: ChartConfiguration = {
      type: 'pie' as ChartType,
      data: data,
      options: {
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
            enabled: hasData,
            callbacks: {
              label: (context) => {
                if (!hasData) return '';
                const value = context.parsed;
                const formatted = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(value);
                return `${context.label}: ${formatted}`;
              }
            }
          }
        }
      }
    };

    this.pieChart = new Chart(ctx, config);
  }

  createBarChart(): void {
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;

    if (!ctx) {
      return;
    }

    Chart.register(...registerables);

    // Combinar todas as categorias únicas
    const todasCategorias = new Set([
      ...this.gastosPorCategoria.map(g => g.categoria),
      ...this.receitasPorCategoria.map(r => r.categoria)
    ]);

    const categorias = Array.from(todasCategorias);

    // Mapear valores para cada categoria
    const valoresReceitas = categorias.map(categoria => {
      const receita = this.receitasPorCategoria.find(r => r.categoria === categoria);
      return receita ? receita.total : 0;
    });

    const valoresDespesas = categorias.map(categoria => {
      const gasto = this.gastosPorCategoria.find(g => g.categoria === categoria);
      return gasto ? gasto.total : 0;
    });

    const data = {
      labels: categorias,
      datasets: [
        {
          label: 'Receitas',
          data: valoresReceitas,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10B981',
          borderWidth: 2,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)'
        },
        {
          label: 'Despesas',
          data: valoresDespesas,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: '#EF4444',
          borderWidth: 2,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)'
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                const formatted = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(value);
                return `${context.dataset.label}: ${formatted}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0
                }).format(value as number);
              }
            }
          }
        }
      }
    };

    this.barChart = new Chart(ctx, config);
  }

  formatarData(data: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(data);
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  get totalGastos(): number {
    return this.gastosPorCategoria.reduce((total, categoria) => total + categoria.total, 0);
  }

  get totalReceitas(): number {
    return this.receitasPorCategoria.reduce((total, categoria) => total + categoria.total, 0);
  }

  get economia(): number {
    return this.totalReceitas - this.totalGastos;
  }

  // Getters para valores do mês atual
  get receitasDoMes(): number {
    return this.todasTransacoes
      .filter(t => {
        const data = new Date(t.data);
        return t.valor > 0 && data.getMonth() === this.mesAtual && data.getFullYear() === this.anoAtual;
      })
      .reduce((total, transacao) => total + transacao.valor, 0);
  }

  get gastosDoMes(): number {
    return this.todasTransacoes
      .filter(t => {
        const data = new Date(t.data);
        return t.valor < 0 && data.getMonth() === this.mesAtual && data.getFullYear() === this.anoAtual;
      })
      .reduce((total, transacao) => total + Math.abs(transacao.valor), 0);
  }

  get economiaDoMes(): number {
    return this.receitasDoMes - this.gastosDoMes;
  }

  // Propriedade para acessar Math no template
  Math = Math;

  // Getter para taxa de economia
  get taxaEconomia(): number {
    if (this.receitasDoMes === 0) return this.gastosDoMes > 0 ? -100 : 0;
    return Math.round((this.economiaDoMes / this.receitasDoMes) * 100);
  }

  // Getter para transações do mês atual
  get transacoesDoMes(): Transacao[] {
    return this.todasTransacoes.filter(t => {
      const data = new Date(t.data);
      return data.getMonth() === this.mesAtual && data.getFullYear() === this.anoAtual;
    });
  }

  // Getter para total de transações do mês
  get totalTransacoesDoMes(): number {
    return this.transacoesDoMes.length;
  }

  // Getter para número de receitas do mês
  get transacoesReceitasDoMes(): number {
    return this.transacoesDoMes.filter(t => t.valor > 0).length;
  }

  // Getter para número de despesas do mês
  get transacoesDespesasDoMes(): number {
    return this.transacoesDoMes.filter(t => t.valor < 0).length;
  }

  // Getter para média por transação
  get mediaPorTransacao(): number {
    if (this.totalTransacoesDoMes === 0) return 0;
    const totalMovimentado = this.receitasDoMes + this.gastosDoMes;
    return totalMovimentado / this.totalTransacoesDoMes;
  }

  get nomeDoMesAtual(): string {
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${nomesMeses[this.mesAtual]} ${this.anoAtual}`;
  }

  // Métodos para navegar entre meses
  alterarMes(direcao: number) {
    const novaData = new Date(this.anoAtual, this.mesAtual + direcao);
    this.mesAtual = novaData.getMonth();
    this.anoAtual = novaData.getFullYear();

    // Atualizar gráficos quando mudar período
    this.processarDadosParaGrafico();
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    if (this.barChart) {
      this.barChart.destroy();
    }
    setTimeout(() => {
      this.createPieChart();
      this.createBarChart();
    }, 100);
  }

  irParaMesAtual() {
    const hoje = new Date();
    this.mesAtual = hoje.getMonth();
    this.anoAtual = hoje.getFullYear();

    // Atualizar gráficos quando mudar período
    this.processarDadosParaGrafico();
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    if (this.barChart) {
      this.barChart.destroy();
    }
    setTimeout(() => {
      this.createPieChart();
      this.createBarChart();
    }, 100);
  }

  getCategoriaColor(cor: string): string {
    const coresMap: { [key: string]: string } = {
      'red': '#EF4444',
      'blue': '#3B82F6',
      'green': '#10B981',
      'purple': '#8B5CF6',
      'pink': '#EC4899',
      'indigo': '#6366F1',
      'orange': '#F59E0B',
      'yellow': '#EAB308',
      'cyan': '#06B6D4',
      'gray': '#6B7280'
    };
    return coresMap[cor] || '#6B7280';
  }
}
