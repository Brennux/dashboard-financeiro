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

    // Simular dados mensais para um visual similar à imagem
    const meses = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];

    // Gerar dados simulados baseados nas transações existentes
    const receitasSimuladas = Array.from({ length: 12 }, (_, i) => {
      const base = this.receitasDoMes || 5000;
      return base + (Math.random() * 3000 - 1500);
    });

    const despesasSimuladas = Array.from({ length: 12 }, (_, i) => {
      const base = this.gastosDoMes || 3000;
      return base + (Math.random() * 2000 - 1000);
    });

    const data = {
      labels: meses,
      datasets: [
        {
          label: 'Receitas',
          data: receitasSimuladas,
          backgroundColor: '#3B82F6',
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 20,
        },
        {
          label: 'Despesas',
          data: despesasSimuladas,
          backgroundColor: '#60A5FA',
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 20,
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            bottom: 20
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
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
          x: {
            display: true,
            grid: {
              display: false
            },
            ticks: {
              color: '#6B7280',
              font: {
                size: 12
              }
            }
          },
          y: {
            display: false,
            grid: {
              display: false
            },
            beginAtZero: true
          }
        },
        elements: {
          bar: {
            borderRadius: 8
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
    // Para controles de período como 12 meses, ajustar logicamente
    if (Math.abs(direcao) > 1) {
      // Para períodos maiores, vamos voltar um ano
      this.anoAtual = direcao > 0 ? this.anoAtual + 1 : this.anoAtual - 1;
    } else {
      const novaData = new Date(this.anoAtual, this.mesAtual + direcao);
      this.mesAtual = novaData.getMonth();
      this.anoAtual = novaData.getFullYear();
    }

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

  getIconeCategoria(categoria: string): { icon: string; color: string; background: string } {
    const iconesMap: { [key: string]: { icon: string; color: string; background: string } } = {
      'Alimentação': { icon: 'fas fa-utensils', color: 'text-red-600', background: 'bg-red-100' },
      'Transporte': { icon: 'fas fa-car', color: 'text-blue-600', background: 'bg-blue-100' },
      'Entretenimento': { icon: 'fas fa-film', color: 'text-purple-600', background: 'bg-purple-100' },
      'Renda': { icon: 'fas fa-dollar-sign', color: 'text-green-600', background: 'bg-green-100' },
      'Saúde': { icon: 'fas fa-heartbeat', color: 'text-pink-600', background: 'bg-pink-100' },
      'Educação': { icon: 'fas fa-graduation-cap', color: 'text-indigo-600', background: 'bg-indigo-100' },
      'Lazer': { icon: 'fas fa-gamepad', color: 'text-orange-600', background: 'bg-orange-100' },
      'Compras': { icon: 'fas fa-shopping-bag', color: 'text-yellow-600', background: 'bg-yellow-100' },
      'Contas': { icon: 'fas fa-file-invoice-dollar', color: 'text-gray-600', background: 'bg-gray-100' },
      'Outros': { icon: 'fas fa-ellipsis-h', color: 'text-cyan-600', background: 'bg-cyan-100' }
    };
    return iconesMap[categoria] || { icon: 'fas fa-circle', color: 'text-gray-600', background: 'bg-gray-100' };
  }
}
