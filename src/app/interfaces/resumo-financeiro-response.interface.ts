export interface IResumoFinanceiroResponse {
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