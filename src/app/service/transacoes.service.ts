import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { ITransacaoRequest } from '../interfaces/transacao-request.interface';

export interface RespostaPaginada {
  data: ITransacaoRequest[];
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
  private transacoesSubject = new BehaviorSubject<ITransacaoRequest[]>([]);
  transacoes$ = this.transacoesSubject.asObservable();

  private filtrosSubject = new Subject<{ mes?: string, categoria?: string, tipo?: string, busca?: string, page?: number, limit?: number }>();


    private readonly _httpClient = inject(HttpClient);
    constructor(){
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

  private buscarTransacoes(filtros: { mes?: string, categoria?: string, tipo?: string, busca?: string, page?: number, limit?: number }): Observable<ITransacaoRequest[]> {
    let params: any = {};
    if (filtros.mes) params.mes = filtros.mes;
    if (filtros.categoria) params.categoria = filtros.categoria;
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.busca) params.busca = filtros.busca;
    if (filtros.page) params.page = filtros.page;
    if (filtros.limit) params.limit = filtros.limit;

    return this._httpClient.get<RespostaPaginada>(this.apiUrl, { params })
      .pipe(
        catchError(error => {
          console.error('Erro ao carregar transações:', error);
          return throwError(() => error);
        }),

        map((response: any) => {
          let transacoes: ITransacaoRequest[] = [];

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
            console.warn('Resposta da API não está no formato esperado:', response);
            transacoes = [];
          }

          return transacoes.sort((a, b) => {
            // Primeiro tenta ordenar por data (mais recente primeiro)
            const dataA = new Date(a.data).getTime();
            const dataB = new Date(b.data).getTime();
            if (dataA !== dataB) {
              return dataB - dataA; 
            }
            // Se as datas forem iguais, ordena por ID (mais recente primeiro)
            return b.id - a.id;
          });
        })
      );
  }

  carregarTransacoes(filtros?: { mes?: string, categoria?: string, tipo?: string, busca?: string, page?: number, limit?: number }) {
    if (filtros) {
      this.filtrosSubject.next(filtros);
    } else {
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

  adicionarTransacao(transacao: Omit<ITransacaoRequest, 'id'>): Observable<ITransacaoRequest> {
    return this._httpClient.post<ITransacaoRequest>(this.apiUrl, transacao)
      .pipe(catchError(error => {
        console.error('Erro ao adicionar transação:', error);
        return throwError(() => error);
      }));
  }

  editarTransacao(id: number, transacao: Partial<ITransacaoRequest>): Observable<ITransacaoRequest> {
    return this._httpClient.put<ITransacaoRequest>(`${this.apiUrl}/${id}`, transacao)
      .pipe(catchError(error => {
        console.error('Erro ao editar transação:', error);
        return throwError(() => error);
      }));
  }

  excluirTransacao(id: number): Observable<void> {
    return this._httpClient.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => {
        console.error('Erro ao excluir transação:', error);
        return throwError(() => error);
      }));
  }
}
