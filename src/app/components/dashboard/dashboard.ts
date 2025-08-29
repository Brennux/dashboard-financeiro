import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { TransacoesService, } from '../../service/transacoes.service';
import { DashboardService,  } from '../../service/dashboard.service';
import { Subscription } from 'rxjs';
import { IResumoFinanceiroResponse } from '../../interfaces/resumo-financeiro-response.interface';
import { ITransacaoRequest } from '../../interfaces/transacao-request.interface';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  transacoesRecentes: ITransacaoRequest[] = [];
  private transacoesSub!: Subscription;
  private todasTransacoes: ITransacaoRequest[] = [];

  resumoFinanceiro: IResumoFinanceiroResponse = {
    receitas: 0,
    despesas: 0,
    saldo: 0,
    comparacao: 'neutro'
  };

  // Propriedades para controle de período
  periodoSelecionado: string = '30-dias'; // Período padrão
  dadosGrafico: any = null; // Dados do gráfico vindos do backend

  // Propriedades para filtro personalizado
  mostrarFiltroPersonalizado: boolean = false;
  dataInicio: string = '';
  dataFim: string = '';

  // Propriedades para controle dos cards deslizáveis
  cardAtual: number = 0; // 0 = Poupança/Saldo, 1 = Entradas, 2 = Saídas, 3 = Comparação
  isDragging: boolean = false;
  startX: number = 0;
  currentTranslateX: number = 0;

  constructor(
    private transacoesService: TransacoesService,
    private dashboardService: DashboardService
  ) { }

  barChart: Chart | null = null;

  ngOnInit() {
    // Carregar dados do gráfico do backend (período padrão)
    this.carregarDadosGrafico(this.periodoSelecionado);

    // Carregar resumo financeiro
    this.dashboardService.obterResumoFinanceiro().subscribe({
      next: (resumo: IResumoFinanceiroResponse) => {
        this.resumoFinanceiro = resumo;
      },
      error: (error: any) => {
        console.error('Erro ao carregar resumo financeiro:', error);
      }
    });

    // Carregar transações recentes
    this.dashboardService.obterTransacoesRecentes().subscribe({
      next: (transacoes: ITransacaoRequest[]) => {
        // Ordenar por ID decrescente (mais recente primeiro) como fallback
        this.transacoesRecentes = transacoes.sort((a, b) => {
          // Primeiro tenta ordenar por data (mais recente primeiro)
          const dataA = new Date(a.data).getTime();
          const dataB = new Date(b.data).getTime();
          if (dataA !== dataB) {
            return dataB - dataA; // Data mais recente primeiro
          }
          // Se as datas forem iguais, ordena por ID (mais recente primeiro)
          return b.id - a.id;
        });
      },
      error: (error: any) => {
        console.error('Erro ao carregar transações recentes:', error);
      }
    });

    // Manter lógica existente
    this.transacoesSub = this.transacoesService.transacoes$.subscribe(transacoes => {
      this.todasTransacoes = transacoes;
      // Comentar a linha abaixo pois agora usamos dados do backend
      // this.transacoesRecentes = transacoes.slice(0, 5);

      // Aguardar um momento para garantir que o DOM esteja pronto
      setTimeout(() => {
        this.destroyCharts();
        this.createCharts();
      }, 50);
    });
  }

  ngOnDestroy() {
    if (this.transacoesSub) {
      this.transacoesSub.unsubscribe();
    }
    this.destroyCharts();
  }

  // Método para carregar dados do gráfico do backend
  carregarDadosGrafico(periodo: string): void {
    this.periodoSelecionado = periodo;
    this.dashboardService.obterDadosGrafico(periodo).subscribe({
      next: (dados: any) => {
        this.dadosGrafico = dados;
        // Atualizar gráfico após receber os dados
        setTimeout(() => {
          this.destroyCharts();
          this.createCharts();
        }, 50);
      },
      error: (error: any) => {
        console.error('Erro ao carregar dados do gráfico:', error);
        // Em caso de erro, usar dados locais como fallback
        this.dadosGrafico = null;
        setTimeout(() => {
          this.destroyCharts();
          this.createCharts();
        }, 50);
      }
    });
  }

  // Métodos auxiliares para gerenciar gráficos
  private destroyCharts() {
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }
  }

  private createCharts() {
    this.createBarChart();
  }

  // Função auxiliar para validar e converter datas
  private validarData(data: any): Date | null {
    try {
      if (!data) return null;

      const dataObj = typeof data === 'string' ? new Date(data) : data;

      if (!dataObj || isNaN(dataObj.getTime())) {
        return null;
      }

      return dataObj;
    } catch (error) {
      console.warn('Erro ao validar data:', error);
      return null;
    }
  }

  createBarChart(): void {
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;

    if (!ctx) {
      console.warn('Canvas barChart não encontrado');
      return;
    }

    // Verificar se já existe um gráfico neste canvas
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }

    Chart.register(...registerables);

    // Estrutura original mantida - dados mensais para visual similar à imagem
    const meses = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];

    let receitasData, despesasData;

    // Usar dados REAIS do backend se disponíveis
    if (this.dadosGrafico && this.dadosGrafico.receitas !== undefined && this.dadosGrafico.despesas !== undefined) {
      console.log('Usando dados reais do backend:', this.dadosGrafico);

      // Usar os valores EXATOS do backend
      const receitasTotal = Math.abs(this.dadosGrafico.receitas || this.dadosGrafico.totalReceitas || 0);
      const despesasTotal = Math.abs(this.dadosGrafico.despesas || this.dadosGrafico.totalDespesas || 0);

      // Para manter o visual de 12 meses, mas com dados reais:
      // Colocar todo o valor no mês atual e zeros nos outros
      const mesAtualIndex = new Date().getMonth();

      receitasData = Array.from({ length: 12 }, (_, i) => {
        return i === mesAtualIndex ? receitasTotal : 0;
      });

      despesasData = Array.from({ length: 12 }, (_, i) => {
        return i === mesAtualIndex ? despesasTotal : 0;
      });
    } else {
      console.log('Dados do backend não disponíveis, usando fallback local');
      // Fallback: usar dados locais das transações
      const mesAtualIndex = new Date().getMonth();
      const receitasTotal = this.totalEntradas;
      const despesasTotal = this.totalSaidas;

      receitasData = Array.from({ length: 12 }, (_, i) => {
        return i === mesAtualIndex ? receitasTotal : 0;
      });

      despesasData = Array.from({ length: 12 }, (_, i) => {
        return i === mesAtualIndex ? despesasTotal : 0;
      });
    }

    const data = {
      labels: meses,
      datasets: [
        {
          label: 'Receitas',
          data: receitasData,
          backgroundColor: '#3B82F6',
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 20,
        },
        {
          label: 'Despesas',
          data: despesasData,
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

  formatarData(data: Date | string): string {
    try {
      // Se data for string, converter para Date
      const dataObj = typeof data === 'string' ? new Date(data) : data;

      // Verificar se a data é válida
      if (!dataObj || isNaN(dataObj.getTime())) {
        return 'Data inválida';
      }

      return new Intl.DateTimeFormat('pt-BR').format(dataObj);
    } catch (error) {
      console.warn('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // Getters para dados dos cards - usar apenas dados filtrados por período
  get totalEntradas(): number {
    return this.todasTransacoes
      .filter(t => {
        const data = this.validarData(t.data);
        return data && t.valor > 0;
      })
      .reduce((total, transacao) => total + transacao.valor, 0);
  }

  get totalSaidas(): number {
    return this.todasTransacoes
      .filter(t => {
        const data = this.validarData(t.data);
        return data && t.valor < 0;
      })
      .reduce((total, transacao) => total + Math.abs(transacao.valor), 0);
  }

  get saldoLiquido(): number {
    return this.totalEntradas - this.totalSaidas;
  }

  get numeroEntradas(): number {
    return this.todasTransacoes.filter(t => t.valor > 0).length;
  }

  get numeroSaidas(): number {
    return this.todasTransacoes.filter(t => t.valor < 0).length;
  }

  // Método para carregar período específico
  carregarPeriodo(periodo: '7-dias' | '30-dias' | '12-meses') {
    this.carregarDadosGrafico(periodo);
  }

  // Métodos para filtro personalizado
  abrirFiltroPersonalizado() {
    this.mostrarFiltroPersonalizado = true;
    // Definir datas padrão (último mês)
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    this.dataFim = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    this.dataInicio = primeiroDiaMes.toISOString().split('T')[0];
  }

  fecharFiltroPersonalizado() {
    this.mostrarFiltroPersonalizado = false;
  }

  aplicarFiltroPersonalizado() {
    if (!this.dataInicio || !this.dataFim) {
      alert('Por favor, selecione as datas de início e fim.');
      return;
    }

    if (new Date(this.dataInicio) > new Date(this.dataFim)) {
      alert('A data de início deve ser anterior à data de fim.');
      return;
    }

    // Carregar dados com filtro personalizado
    this.carregarDadosGraficoPersonalizado(this.dataInicio, this.dataFim);
    this.periodoSelecionado = 'personalizado';
    this.mostrarFiltroPersonalizado = false;
  }

  // Método para carregar dados com datas personalizadas
  carregarDadosGraficoPersonalizado(dataInicio: string, dataFim: string): void {
    this.dashboardService.obterDadosGraficoPersonalizado(dataInicio, dataFim).subscribe({
      next: (dados: any) => {
        this.dadosGrafico = dados;
        // Atualizar gráfico após receber os dados
        setTimeout(() => {
          this.destroyCharts();
          this.createCharts();
        }, 50);
      },
      error: (error: any) => {
        console.error('Erro ao carregar dados do gráfico personalizado:', error);
        // Em caso de erro, usar dados locais como fallback
        this.dadosGrafico = null;
        setTimeout(() => {
          this.destroyCharts();
          this.createCharts();
        }, 50);
      }
    });
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

  // Métodos para controle dos cards deslizáveis
  onTouchStart(event: TouchEvent) {
    this.isDragging = true;
    this.startX = event.touches[0].clientX;
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.clientX;
    event.preventDefault();
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    const currentX = event.touches[0].clientX;
    const deltaX = currentX - this.startX;
    this.currentTranslateX = deltaX;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    const currentX = event.clientX;
    const deltaX = currentX - this.startX;
    this.currentTranslateX = deltaX;
  }

  onTouchEnd() {
    this.onDragEnd();
  }

  onMouseUp() {
    this.onDragEnd();
  }

  onDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const threshold = 80;
    if (Math.abs(this.currentTranslateX) > threshold) {
      if (this.currentTranslateX > 0) {
        this.cardAtual = Math.max(0, this.cardAtual - 1);
      } else {
        this.cardAtual = Math.min(3, this.cardAtual + 1);
      }
    }
    this.currentTranslateX = 0;
  }

  // Navegação dos cards
  irParaCard(index: number) {
    this.cardAtual = index;
  }

  // Método para calcular a transformação do card
  getCardTransform(): string {
    const baseTransform = -this.cardAtual * 25; // 25% por card, não 100%
    const dragOffset = this.isDragging ? (this.currentTranslateX / 3) : 0;
    const result = `translateX(${baseTransform + dragOffset}%)`;
    return result;
  }
}
