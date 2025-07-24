import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransacoesService, Transacao } from '../../service/transacoes.service';
import { Subscription } from 'rxjs';

interface TransacaoForm {
  descricao: string;
  valor: number;
  categoria: string;
  tipo: 'entrada' | 'saida';
  data: Date;
}

@Component({
  selector: 'app-transacoes',
  imports: [CommonModule, FormsModule],
  templateUrl: './transacoes.html',
  styleUrl: './transacoes.scss'
})
export class Transacoes implements OnInit, OnDestroy {
  mostrarModal = false;
  modoEdicao = false;
  transacaoEditando: Transacao | null = null;
  mostrarModalConfirmacao = false;
  transacaoParaExcluir: Transacao | null = null;

  transacoes: Transacao[] = [];
  private transacoesSub!: Subscription;

  // Propriedades para filtros
  mesesDisponiveis: string[] = [];
  mesSelecionado: string = '';
  categoriaSelecionada: string = '';
  tipoSelecionado: string = '';
  textoBusca: string = '';
  mostrarSugestoes: boolean = false;

  // Propriedades para o calendário
  mostrarCalendario: boolean = false;
  anoAtual: number = new Date().getFullYear();
  mesAtual: number = new Date().getMonth();
  anosDisponiveis: number[] = [];

  constructor(private transacoesService: TransacoesService) { }

  categorias = [
    'Alimentação',
    'Transporte',
    'Entretenimento',
    'Renda',
    'Saúde',
    'Educação',
    'Lazer',
    'Compras',
    'Contas',
    'Outros'
  ];

  novaTransacao: TransacaoForm = {
    descricao: '',
    valor: 0,
    categoria: '',
    tipo: 'saida',
    data: new Date()
  };

  ngOnInit() {
    this.transacoesSub = this.transacoesService.transacoes$.subscribe(transacoes => {
      this.transacoes = transacoes;
      this.atualizarMesesDisponiveis();
    });
  }

  ngOnDestroy() {
    if (this.transacoesSub) {
      this.transacoesSub.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any) {
    // Fecha o calendário se clicar fora dele
    if (this.mostrarCalendario && !event.target.closest('.calendario-container')) {
      this.mostrarCalendario = false;
    }

    // Fecha as sugestões se clicar fora delas
    if (this.mostrarSugestoes && !event.target.closest('.busca-container')) {
      this.mostrarSugestoes = false;
    }
  }

  // Getter para transações filtradas
  get transacoesFiltradas(): Transacao[] {
    return this.transacoes.filter(transacao => {
      const data = new Date(transacao.data);
      const mesAno = `${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;

      const filtroMes = !this.mesSelecionado || mesAno === this.mesSelecionado;
      const filtroCategoria = !this.categoriaSelecionada || transacao.categoria === this.categoriaSelecionada;
      const filtroTipo = !this.tipoSelecionado ||
        (this.tipoSelecionado === 'entrada' && transacao.valor > 0) ||
        (this.tipoSelecionado === 'saida' && transacao.valor < 0);
      const filtroBusca = !this.textoBusca ||
        transacao.descricao.toLowerCase().includes(this.textoBusca.toLowerCase()) ||
        transacao.categoria.toLowerCase().includes(this.textoBusca.toLowerCase());

      return filtroMes && filtroCategoria && filtroTipo && filtroBusca;
    });
  }

  // Método para atualizar meses disponíveis
  atualizarMesesDisponiveis() {
    const mesesSet = new Set<string>();
    const anosSet = new Set<number>();

    this.transacoes.forEach(transacao => {
      const data = new Date(transacao.data);
      const mesAno = `${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
      mesesSet.add(mesAno);
      anosSet.add(data.getFullYear());
    });

    this.mesesDisponiveis = Array.from(mesesSet).sort((a, b) => {
      // Ordena do mais recente para o mais antigo
      const [mesA, anoA] = a.split('/').map(Number);
      const [mesB, anoB] = b.split('/').map(Number);
      return anoB - anoA || mesB - mesA;
    });

    this.anosDisponiveis = Array.from(anosSet).sort((a, b) => b - a);
  }

  // Métodos para o calendário
  toggleCalendario() {
    this.mostrarCalendario = !this.mostrarCalendario;
  }

  fecharCalendario() {
    this.mostrarCalendario = false;
  }

  selecionarMes(mes: number, ano: number) {
    const mesFormatado = `${(mes + 1).toString().padStart(2, '0')}/${ano}`;
    this.mesSelecionado = mesFormatado;
    this.mostrarCalendario = false;
  }

  verificarMesComTransacoes(mes: number, ano: number): boolean {
    const mesFormatado = `${(mes + 1).toString().padStart(2, '0')}/${ano}`;
    return this.mesesDisponiveis.includes(mesFormatado);
  }

  verificarMesSelecionado(mes: number, ano: number): boolean {
    const mesFormatado = `${(mes + 1).toString().padStart(2, '0')}/${ano}`;
    return this.mesSelecionado === mesFormatado;
  }

  alterarAno(direcao: number) {
    this.anoAtual += direcao;
  }

  get nomesMeses(): string[] {
    return [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
  }

  get textoMesSelecionado(): string {
    if (!this.mesSelecionado) return 'Selecionar mês';
    return this.formatarNomeMes(this.mesSelecionado);
  }

  // Método para limpar filtros
  limparFiltros() {
    this.mesSelecionado = '';
    this.categoriaSelecionada = '';
    this.tipoSelecionado = '';
    this.textoBusca = '';
    this.mostrarCalendario = false;
    this.mostrarSugestoes = false;
  }

  // Método para formatar nome do mês
  formatarNomeMes(mesAno: string): string {
    const [mes, ano] = mesAno.split('/');
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${nomesMeses[parseInt(mes) - 1]} ${ano}`;
  }

  // Método para obter sugestões de busca
  get sugestoesBusca(): string[] {
    if (!this.textoBusca || this.textoBusca.length < 2) return [];

    const termos = new Set<string>();
    const termoBusca = this.textoBusca.toLowerCase();

    this.transacoes.forEach(transacao => {
      // Adicionar palavras da descrição que contenham o termo
      const palavrasDescricao = transacao.descricao.toLowerCase().split(' ');
      palavrasDescricao.forEach(palavra => {
        if (palavra.includes(termoBusca) && palavra.length > 2) {
          termos.add(palavra);
        }
      });

      // Adicionar categoria se contém o termo
      if (transacao.categoria.toLowerCase().includes(termoBusca)) {
        termos.add(transacao.categoria);
      }
    });

    return Array.from(termos).slice(0, 5); // Limitar a 5 sugestões
  }

  // Método para aplicar sugestão
  aplicarSugestao(sugestao: string) {
    this.textoBusca = sugestao;
    this.mostrarSugestoes = false;
  }

  // Método para controlar exibição das sugestões
  onBuscaFocus() {
    this.mostrarSugestoes = true;
  }

  onBuscaInput() {
    this.mostrarSugestoes = this.textoBusca.length >= 2;
  }

  limparBusca() {
    this.textoBusca = '';
    this.mostrarSugestoes = false;
  }

  abrirModal() {
    this.mostrarModal = true;
    this.modoEdicao = false;
    this.transacaoEditando = null;
    this.resetarFormulario();
  }

  abrirModalEdicao(transacao: Transacao) {
    this.mostrarModal = true;
    this.modoEdicao = true;
    this.transacaoEditando = transacao;

    // Preencher o formulário com os dados da transação
    this.novaTransacao = {
      descricao: transacao.descricao,
      valor: Math.abs(transacao.valor), // Remove o sinal negativo para exibição
      categoria: transacao.categoria,
      tipo: transacao.valor < 0 ? 'saida' : 'entrada',
      data: transacao.data
    };
  }

  fecharModal() {
    this.mostrarModal = false;
    this.modoEdicao = false;
    this.transacaoEditando = null;
    this.resetarFormulario();
  }

  resetarFormulario() {
    this.novaTransacao = {
      descricao: '',
      valor: 0,
      categoria: '',
      tipo: 'saida',
      data: new Date()
    };
  }

  salvarTransacao() {
    if (this.validarFormulario()) {
      const transacaoParaServico = {
        descricao: this.novaTransacao.descricao,
        valor: this.novaTransacao.tipo === 'saida' ? -Math.abs(this.novaTransacao.valor) : Math.abs(this.novaTransacao.valor),
        categoria: this.novaTransacao.categoria,
        data: this.novaTransacao.data
      };

      if (this.modoEdicao && this.transacaoEditando) {
        // Editar transação existente
        this.transacoesService.editarTransacao(this.transacaoEditando.id, transacaoParaServico);
      } else {
        // Adicionar nova transação
        this.transacoesService.adicionarTransacao(transacaoParaServico);
      }

      this.fecharModal();
    }
  }

  // Métodos para exclusão
  abrirModalConfirmacao(transacao: Transacao) {
    this.transacaoParaExcluir = transacao;
    this.mostrarModalConfirmacao = true;
  }

  fecharModalConfirmacao() {
    this.mostrarModalConfirmacao = false;
    this.transacaoParaExcluir = null;
  }

  confirmarExclusao() {
    if (this.transacaoParaExcluir) {
      this.transacoesService.excluirTransacao(this.transacaoParaExcluir.id);
    }
    this.fecharModalConfirmacao();
  }

  validarFormulario(): boolean {
    return !!(
      this.novaTransacao.descricao?.trim() &&
      this.novaTransacao.valor &&
      this.novaTransacao.categoria &&
      this.novaTransacao.tipo &&
      this.novaTransacao.data
    );
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

  formatarDataParaInput(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  atualizarDataTransacao(event: any) {
    this.novaTransacao.data = new Date(event.target.value);
  }
}
