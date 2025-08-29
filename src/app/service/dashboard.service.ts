import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IResumoFinanceiroResponse } from '../interfaces/resumo-financeiro-response.interface';
import { ITransacaoRequest } from '../interfaces/transacao-request.interface';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = 'http://localhost:3000/dashboard';

    private readonly _httpClient = inject(HttpClient);

    obterResumoFinanceiro(): Observable<IResumoFinanceiroResponse> {
        const url = `${this.apiUrl}/resumo`;
        return this._httpClient.get<IResumoFinanceiroResponse>(url).pipe(
            catchError(error => {
                console.error('Erro ao obter resumo financeiro:', error);
                return throwError(() => error);
            })
        );
    }

    obterTransacoesRecentes(): Observable<ITransacaoRequest[]> {
        const url = `${this.apiUrl}/transacoes-recentes`;
        return this._httpClient.get<ITransacaoRequest[]>(url).pipe(
            catchError(error => {
                console.error('Erro ao obter transações recentes:', error);
                return throwError(() => error);
            })
        );
    }

    
    obterDadosGrafico(periodo: string = '30-dias'): Observable<any> {
        const url = `${this.apiUrl}/grafico`;
        return this._httpClient.get<any>(url, { params: { periodo } }).pipe(
            catchError(error => {
                console.error('Erro ao obter dados do gráfico:', error);
                return throwError(() => error);
            })
        );
    }

    obterDadosGraficoPersonalizado(dataInicio: string, dataFim: string): Observable<any> {
        const url = `${this.apiUrl}/grafico`;
        return this._httpClient.get<any>(url, {
            params: {
                dataInicio: dataInicio,
                dataFim: dataFim
            }
        }).pipe(
            catchError(error => {
                console.error('Erro ao obter dados do gráfico personalizado:', error);
                return throwError(() => error);
            })
        );
    }

    obterEstatisticasCategorias(): Observable<any> {
        const url = `${this.apiUrl}/categorias`;
        return this._httpClient.get<any>(url).pipe(
            catchError(error => {
                console.error('Erro ao obter estatísticas por categoria:', error);
                return throwError(() => error);
            })
        );
    }
}
