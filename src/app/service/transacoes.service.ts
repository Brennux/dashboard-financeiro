import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  data: Date;
  categoria: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransacoesService {
  private readonly STORAGE_KEY = 'transacoes-financeiro';
  private transacoes: Transacao[] = [];
  private transacoesSubject = new BehaviorSubject<Transacao[]>(this.transacoes);
  transacoes$ = this.transacoesSubject.asObservable();

  constructor() {
    this.carregarDoLocalStorage();
  }

  private carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);
    if (dadosSalvos) {
      try {
        this.transacoes = JSON.parse(dadosSalvos).map((t: any) => ({
          ...t,
          data: new Date(t.data)
        }));
        this.transacoesSubject.next(this.transacoes);
      } catch (error) {
        console.error('Erro ao carregar transações do localStorage:', error);
        this.transacoes = [];
      }
    }
  }

  private salvarNoLocalStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.transacoes));
  }

  adicionarTransacao(transacao: Omit<Transacao, 'id'>) {
    const novaTransacao: Transacao = {
      ...transacao,
      id: this.gerarNovoId()
    };
    this.transacoes.unshift(novaTransacao);
    this.salvarNoLocalStorage();
    this.transacoesSubject.next(this.transacoes);
  }

  editarTransacao(id: number, dadosAtualizados: Omit<Transacao, 'id'>) {
    const index = this.transacoes.findIndex(t => t.id === id);
    if (index !== -1) {
      this.transacoes[index] = { ...dadosAtualizados, id };
      this.salvarNoLocalStorage();
      this.transacoesSubject.next(this.transacoes);
      return true;
    }
    return false;
  }

  excluirTransacao(id: number) {
    const index = this.transacoes.findIndex(t => t.id === id);
    if (index !== -1) {
      this.transacoes.splice(index, 1);
      this.salvarNoLocalStorage();
      this.transacoesSubject.next(this.transacoes);
      return true;
    }
    return false;
  }

  private gerarNovoId(): number {
    return this.transacoes.length > 0 ? Math.max(...this.transacoes.map(t => t.id)) + 1 : 1;
  }
}
