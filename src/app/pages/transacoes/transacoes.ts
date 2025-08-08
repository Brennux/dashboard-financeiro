import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransacoesService, Transacao } from '../../service/transacoes.service';
import { CategoriasService } from '../../service/categorias.service';
import { ValidationService, ValidationError } from '../../service/validation.service';
import { NotificationService } from '../../service/notification.service';
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
  categorias: string[] = [];
  validationErrors: ValidationError[] = [];
  isSubmitting: boolean = false;

  // Propriedades para filtros
  mesesDisponiveis: string[] = [];
  mesSelecionado: string = '';
  categoriaSelecionada: string = '';
  tipoSelecionado: string = '';
  textoBusca: string = '';
  mostrarSugestoes: boolean = false;

  // Propriedades de paginação
  paginaAtual: number = 1;
  limitePorPagina: number = 10;
  totalPaginas: number = 1;

  // Propriedades para o calendário
  mostrarCalendario: boolean = false;
  anoAtual: number = new Date().getFullYear();
  anosDisponiveis: number[] = [];

  constructor(
    private transacoesService: TransacoesService,
    private categoriasService: CategoriasService,
    private validationService: ValidationService,
    private notificationService: NotificationService
  ) { }

  novaTransacao: TransacaoForm = {
    descricao: '',
    valor: 0,
    categoria: '',
    tipo: 'saida',
    data: new Date()
  };

  ngOnInit() {
    this.transacoesSub = this.transacoesService.transacoes$.subscribe(transacoes => {
      const transacoesArray = Array.isArray(transacoes) ? transacoes : [];

      // Ordenar as transações por data e ID (mais recente primeiro)
      this.transacoes = transacoesArray.sort((a, b) => {
        const dataA = new Date(a.data).getTime();
        const dataB = new Date(b.data).getTime();
        if (dataA !== dataB) {
          return dataB - dataA;
        }
        // Se as datas forem iguais, ordena por ID (mais recente primeiro)
        return b.id - a.id;
      });

      this.atualizarMesesDisponiveis();
    });

    this.categoriasService.categorias$.subscribe(categorias => {
      this.categorias = categorias.filter(c => c.ativa).map(c => c.nome);
    });

    this.atualizarTransacoesSemDebounce();
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
    if (this.mostrarSugestoes && !event.target.closest('.busca-container')) {
      this.mostrarSugestoes = false;
    }
  }

  get transacoesFiltradas(): Transacao[] {
    return this.transacoes;
  }

  // Método para atualizar meses disponíveis
  atualizarMesesDisponiveis() {
    const mesesSet = new Set<string>();
    const anosSet = new Set<number>();

    this.transacoes.forEach(transacao => {
      try {
        const data = typeof transacao.data === 'string' ? new Date(transacao.data) : new Date(transacao.data);
        if (!isNaN(data.getTime())) {
          const mesAno = `${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
          mesesSet.add(mesAno);
          anosSet.add(data.getFullYear());
        }
      } catch (error) {
        console.warn('Data inválida encontrada:', transacao.data);
      }
    });

    this.mesesDisponiveis = Array.from(mesesSet).sort((a, b) => {
      const [mesA, anoA] = a.split('/').map(Number);
      const [mesB, anoB] = b.split('/').map(Number);
      return anoB - anoA || mesB - mesA;
    });
    this.anosDisponiveis = Array.from(anosSet).sort((a, b) => b - a);
  }

  atualizarTransacoesFiltradas() {
    this.transacoesService.carregarTransacoes({
      mes: this.mesSelecionado,
      categoria: this.categoriaSelecionada,
      tipo: this.tipoSelecionado,
      busca: this.textoBusca,
      page: this.paginaAtual,
      limit: this.limitePorPagina
    });
  }

  // Método para atualizar sem debounce (para ações que precisam resposta imediata)
  atualizarTransacoesSemDebounce() {
    this.transacoesService.carregarTransacoesSemDebounce({
      mes: this.mesSelecionado,
      categoria: this.categoriaSelecionada,
      tipo: this.tipoSelecionado,
      busca: this.textoBusca,
      page: this.paginaAtual,
      limit: this.limitePorPagina
    });
  }

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
    this.paginaAtual = 1;
    this.atualizarTransacoesSemDebounce();
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

  limparFiltros() {
    this.mesSelecionado = '';
    this.categoriaSelecionada = '';
    this.tipoSelecionado = '';
    this.textoBusca = '';
    this.mostrarCalendario = false;
    this.mostrarSugestoes = false;
    this.paginaAtual = 1;
    this.atualizarTransacoesSemDebounce();
  }

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

    return Array.from(termos).slice(0, 5); 
  }

  aplicarSugestao(sugestao: string) {
    this.textoBusca = sugestao;
    this.mostrarSugestoes = false;
  }

  onBuscaFocus() {
    this.mostrarSugestoes = true;
  }

  onBuscaInput() {
    this.mostrarSugestoes = this.textoBusca.length >= 2;
    this.paginaAtual = 1;
    // O debounce agora é tratado no serviço, então podemos chamar diretamente
    this.atualizarTransacoesFiltradas();
  }

  // Métodos para mudança dos filtros (sem debounce - são ações diretas do usuário)
  onCategoriaChange() {
    this.paginaAtual = 1;
    this.atualizarTransacoesSemDebounce();
  }

  onTipoChange() {
    this.paginaAtual = 1;
    this.atualizarTransacoesSemDebounce();
  }

  limparBusca() {
    this.textoBusca = '';
    this.mostrarSugestoes = false;
    this.paginaAtual = 1;
    this.atualizarTransacoesSemDebounce();
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
    // Limpar erros de validação
    this.validationErrors = [];
    this.isSubmitting = false;
  }

  salvarTransacao() {
    // Limpar erros anteriores
    this.validationErrors = [];

    // Validar formulário
    this.validationErrors = this.validationService.validateTransacao(this.novaTransacao);

    if (this.validationErrors.length > 0) {
      this.notificationService.error('Erro de Validação', 'Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    // Verificar se todos os campos obrigatórios estão preenchidos
    if (!this.validarFormulario()) {
      this.notificationService.error('Campos Obrigatórios', 'Todos os campos são obrigatórios.');
      return;
    }

    this.isSubmitting = true;

    const transacaoParaServico = {
      descricao: this.novaTransacao.descricao,
      valor: this.novaTransacao.tipo === 'saida' ? -Math.abs(this.novaTransacao.valor) : Math.abs(this.novaTransacao.valor),
      categoria: this.novaTransacao.categoria,
      tipo: this.novaTransacao.tipo,
      data: this.novaTransacao.data
    };

    if (this.modoEdicao && this.transacaoEditando) {
      // Editar transação existente
      this.transacoesService.editarTransacao(this.transacaoEditando.id, transacaoParaServico).subscribe({
        next: () => {
          this.atualizarTransacoesSemDebounce();
          this.notificationService.transacaoEditada(this.novaTransacao.descricao);
          this.fecharModal();
          this.isSubmitting = false;
        },
        error: () => {
          this.notificationService.error('Erro', 'Erro ao editar transação. Tente novamente.');
          this.isSubmitting = false;
        }
      });
    } else {
      // Adicionar nova transação
      this.transacoesService.adicionarTransacao(transacaoParaServico).subscribe({
        next: () => {
          this.atualizarTransacoesSemDebounce();
          this.notificationService.transacaoAdicionada(this.novaTransacao.descricao, this.novaTransacao.valor);
          this.fecharModal();
          this.isSubmitting = false;
        },
        error: () => {
          this.notificationService.error('Erro', 'Erro ao adicionar transação. Tente novamente.');
          this.isSubmitting = false;
        }
      });
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
      this.transacoesService.excluirTransacao(this.transacaoParaExcluir.id).subscribe({
        next: () => {
          this.atualizarTransacoesSemDebounce();
          this.notificationService.transacaoExcluida(this.transacaoParaExcluir!.descricao);
          this.fecharModalConfirmacao();
        },
        error: () => {
          this.notificationService.error('Erro', 'Erro ao excluir transação. Tente novamente.');
        }
      });
    } else {
      this.fecharModalConfirmacao();
    }
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

  formatarData(data: Date | string): string {
    try {
      const dataObj = typeof data === 'string' ? new Date(data) : data;
      if (isNaN(dataObj.getTime())) {
        return 'Data inválida';
      }
      return new Intl.DateTimeFormat('pt-BR').format(dataObj);
    } catch (error) {
      return 'Data inválida';
    }
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarDataParaInput(data: Date | string): string {
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    if (isNaN(dataObj.getTime())) {
      return '';
    }
    return dataObj.toISOString().split('T')[0];
  }

  atualizarDataTransacao(event: any) {
    this.novaTransacao.data = new Date(event.target.value);
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

  // Métodos de paginação
  irParaPagina(pagina: number) {
    if (pagina < 1) return;
    this.paginaAtual = pagina;
    this.atualizarTransacoesSemDebounce();
  }

  alterarLimite(novoLimite: number) {
    this.limitePorPagina = novoLimite;
    this.paginaAtual = 1;
    this.atualizarTransacoesSemDebounce();
  }

  get podeIrParaAnterior(): boolean {
    return this.paginaAtual > 1;
  }

  get podeIrParaProxima(): boolean {
    return this.transacoes.length === this.limitePorPagina;
  }
}
