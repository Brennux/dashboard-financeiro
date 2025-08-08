import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';

export interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  categoria: string;
  tipo: 'entrada' | 'saida';
  data: Date;
}

export interface RespostaPaginada {
  data: Transacao[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransacoesService {
  private apiUrl = 'http://localhost:3000/transacoes';
  private transacoesSubject = new BehaviorSubject<Transacao[]>([]);
  transacoes$ = this.transacoesSubject.asObservable();

  // Subject para controlar as requisições de filtro com debounce
  private filtrosSubject = new Subject<{ mes?: string, categoria?: string, tipo?: string, busca?: string, page?: number, limit?: number }>();

  constructor(private http: HttpClient) {
    this.configurarFiltrosComDebounce();
    this.carregarTransacoes();
  }

  private configurarFiltrosComDebounce() {
    this.filtrosSubject.pipe(
      debounceTime(300), // Aguarda 300ms após a última mudança
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)), // Evita requisições desnecessárias
      switchMap(filtros => this.buscarTransacoes(filtros)) // Cancela requisições anteriores
    ).subscribe({
      next: (transacoes) => {
        this.transacoesSubject.next(transacoes);
      },
      error: (error) => {
        console.error('Erro ao carregar transações:', error);
      }
    });
  }

  private buscarTransacoes(filtros: { mes?: string, categoria?: string, tipo?: string, busca?: string, page?: number, limit?: number }): Observable<Transacao[]> {
    let params: any = {};
    if (filtros.mes) params.mes = filtros.mes;
    if (filtros.categoria) params.categoria = filtros.categoria;
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.busca) params.busca = filtros.busca;
    if (filtros.page) params.page = filtros.page;
    if (filtros.limit) params.limit = filtros.limit;

    return this.http.get<any>(this.apiUrl, { params })
      .pipe(
        catchError(error => {
          console.error('Erro ao carregar transações:', error);
          return throwError(() => error);
        }),
        // Transformar a resposta para sempre retornar um array
        map((response: any) => {
          let transacoes: Transacao[] = [];

          // Se a resposta é um array, retorna diretamente
          if (Array.isArray(response)) {
            transacoes = response;
          }
          // Se a resposta tem uma propriedade 'data' com array, retorna ela
          else if (response && Array.isArray(response.data)) {
            transacoes = response.data;
          }
          // Se a resposta tem uma propriedade com array de transações
          else if (response && Array.isArray(response.transacoes)) {
            transacoes = response.transacoes;
          }
          // Se a resposta tem uma propriedade 'items' com array
          else if (response && Array.isArray(response.items)) {
            transacoes = response.items;
          }
          else {
            // Caso contrário, retorna array vazio
            console.warn('Resposta da API não está no formato esperado:', response);
            transacoes = [];
          }

          // Ordenar as transações por data e ID (mais recente primeiro)
          return transacoes.sort((a, b) => {
            // Primeiro tenta ordenar por data (mais recente primeiro)
            const dataA = new Date(a.data).getTime();
            const dataB = new Date(b.data).getTime();
            if (dataA !== dataB) {
              return dataB - dataA; // Data mais recente primeiro
            }
            // Se as datas forem iguais, ordena por ID (mais recente primeiro)
            return b.id - a.id;
          });
        })
      );
  }

  carregarTransacoes(filtros?: { mes?: string, categoria?: string, tipo?: string, busca?: string, page?: number, limit?: number }) {
    if (filtros) {
      // Usar o subject com debounce para filtros
      this.filtrosSubject.next(filtros);
    } else {
      // Carregar todas as transações sem filtro
      this.buscarTransacoes({}).subscribe({
        next: (transacoes) => {
          this.transacoesSubject.next(transacoes);
        },
        error: (error) => {
          console.error('Erro ao carregar transações:', error);
        }
      });
    }
  }

  // Método para carregar sem debounce (para ações que precisam de resposta imediata)
  carregarTransacoesSemDebounce(filtros: { mes?: string, categoria?: string, tipo?: string, busca?: string, page?: number, limit?: number } = {}) {
    this.buscarTransacoes(filtros).subscribe({
      next: (transacoes) => {
        this.transacoesSubject.next(transacoes);
      },
      error: (error) => {
        console.error('Erro ao carregar transações:', error);
      }
    });
  }

  adicionarTransacao(transacao: Omit<Transacao, 'id'>): Observable<Transacao> {
    return this.http.post<Transacao>(this.apiUrl, transacao)
      .pipe(catchError(error => {
        console.error('Erro ao adicionar transação:', error);
        return throwError(() => error);
      }));
  }

  editarTransacao(id: number, transacao: Partial<Transacao>): Observable<Transacao> {
    return this.http.put<Transacao>(`${this.apiUrl}/${id}`, transacao)
      .pipe(catchError(error => {
        console.error('Erro ao editar transação:', error);
        return throwError(() => error);
      }));
  }

  excluirTransacao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => {
        console.error('Erro ao excluir transação:', error);
        return throwError(() => error);
      }));
  }
}
