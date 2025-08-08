import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Transacao } from './transacoes.service';

export interface ResumoFinanceiro {
    receitas: number;
    despesas: number;
    saldo: number;
    comparacao: string;
    // Campos opcionais para compatibilidade
    totalReceitas?: number;
    totalDespesas?: number;
    saldoLiquido?: number;
    economia?: number;
    numeroTransacoes?: number;
    numeroReceitas?: number;
    numeroDespesas?: number;
    percentualEconomia?: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = 'http://localhost:3000/dashboard';

    constructor(private http: HttpClient) { }

    /**
     * Obtém o resumo financeiro do dashboard
     * @returns Observable<ResumoFinanceiro>
     */
    obterResumoFinanceiro(): Observable<ResumoFinanceiro> {
        const url = `${this.apiUrl}/resumo`;
        return this.http.get<ResumoFinanceiro>(url).pipe(
            catchError(error => {
                console.error('Erro ao obter resumo financeiro:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Obtém as transações recentes para exibição no dashboard
     * @returns Observable<Transacao[]>
     */
    obterTransacoesRecentes(): Observable<Transacao[]> {
        const url = `${this.apiUrl}/transacoes-recentes`;
        return this.http.get<Transacao[]>(url).pipe(
            catchError(error => {
                console.error('Erro ao obter transações recentes:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Obtém dados para gráficos do dashboard
     * @param periodo Período para os dados do gráfico ('7-dias', '30-dias', '12-meses')
     * @returns Observable<any>
     */
    obterDadosGrafico(periodo: string = '30-dias'): Observable<any> {
        const url = `${this.apiUrl}/grafico`;
        return this.http.get<any>(url, { params: { periodo } }).pipe(
            catchError(error => {
                console.error('Erro ao obter dados do gráfico:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Obtém dados para gráficos do dashboard com filtro personalizado
     * @param dataInicio Data de início no formato YYYY-MM-DD
     * @param dataFim Data de fim no formato YYYY-MM-DD
     * @returns Observable<any>
     */
    obterDadosGraficoPersonalizado(dataInicio: string, dataFim: string): Observable<any> {
        const url = `${this.apiUrl}/grafico`;
        return this.http.get<any>(url, {
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

    /**
     * Obtém estatísticas por categoria (futuro)
     * @returns Observable<any>
     */
    obterEstatisticasCategorias(): Observable<any> {
        const url = `${this.apiUrl}/categorias`;
        return this.http.get<any>(url).pipe(
            catchError(error => {
                console.error('Erro ao obter estatísticas por categoria:', error);
                return throwError(() => error);
            })
        );
    }
}
