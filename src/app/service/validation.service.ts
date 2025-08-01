import { Injectable } from '@angular/core';

export interface ValidationError {
    field: string;
    message: string;
    type: 'required' | 'invalid' | 'min' | 'max' | 'custom';
}

export interface TransacaoValidation {
    descricao: string;
    valor: number;
    categoria: string;
    tipo: 'entrada' | 'saida';
    data: Date;
}

@Injectable({
    providedIn: 'root'
})
export class ValidationService {

    validateTransacao(transacao: Partial<TransacaoValidation>): ValidationError[] {
        const errors: ValidationError[] = [];

        // Validação da descrição
        if (!transacao.descricao?.trim()) {
            errors.push({
                field: 'descricao',
                message: 'Descrição é obrigatória',
                type: 'required'
            });
        } else if (transacao.descricao.trim().length < 3) {
            errors.push({
                field: 'descricao',
                message: 'Descrição deve ter pelo menos 3 caracteres',
                type: 'min'
            });
        } else if (transacao.descricao.trim().length > 100) {
            errors.push({
                field: 'descricao',
                message: 'Descrição não pode ter mais que 100 caracteres',
                type: 'max'
            });
        }

        // Validação do valor
        if (!transacao.valor || transacao.valor === 0) {
            errors.push({
                field: 'valor',
                message: 'Valor é obrigatório e deve ser maior que zero',
                type: 'required'
            });
        } else if (transacao.valor < 0) {
            errors.push({
                field: 'valor',
                message: 'Valor deve ser positivo (o tipo define se é entrada ou saída)',
                type: 'invalid'
            });
        } else if (transacao.valor > 1000000) {
            errors.push({
                field: 'valor',
                message: 'Valor não pode ser maior que R$ 1.000.000,00',
                type: 'max'
            });
        }

        // Validação da categoria
        if (!transacao.categoria?.trim()) {
            errors.push({
                field: 'categoria',
                message: 'Categoria é obrigatória',
                type: 'required'
            });
        }

        // Validação do tipo
        if (!transacao.tipo) {
            errors.push({
                field: 'tipo',
                message: 'Tipo é obrigatório',
                type: 'required'
            });
        }

        // Validação da data
        if (!transacao.data) {
            errors.push({
                field: 'data',
                message: 'Data é obrigatória',
                type: 'required'
            });
        } else {
            const hoje = new Date();
            const umAnoAtras = new Date();
            umAnoAtras.setFullYear(hoje.getFullYear() - 5);

            if (transacao.data > hoje) {
                errors.push({
                    field: 'data',
                    message: 'Data não pode ser no futuro',
                    type: 'invalid'
                });
            } else if (transacao.data < umAnoAtras) {
                errors.push({
                    field: 'data',
                    message: 'Data não pode ser mais antiga que 5 anos',
                    type: 'invalid'
                });
            }
        }

        return errors;
    }

    validateCategoria(categoria: { nome?: string; icone?: string; cor?: string; tipo?: string }): ValidationError[] {
        const errors: ValidationError[] = [];

        // Validação do nome
        if (!categoria.nome?.trim()) {
            errors.push({
                field: 'nome',
                message: 'Nome da categoria é obrigatório',
                type: 'required'
            });
        } else if (categoria.nome.trim().length < 2) {
            errors.push({
                field: 'nome',
                message: 'Nome deve ter pelo menos 2 caracteres',
                type: 'min'
            });
        } else if (categoria.nome.trim().length > 50) {
            errors.push({
                field: 'nome',
                message: 'Nome não pode ter mais que 50 caracteres',
                type: 'max'
            });
        }

        // Validação do ícone
        if (!categoria.icone?.trim()) {
            errors.push({
                field: 'icone',
                message: 'Ícone é obrigatório',
                type: 'required'
            });
        }

        // Validação da cor
        if (!categoria.cor?.trim()) {
            errors.push({
                field: 'cor',
                message: 'Cor é obrigatória',
                type: 'required'
            });
        } else if (!this.isValidColor(categoria.cor)) {
            errors.push({
                field: 'cor',
                message: 'Cor deve estar no formato hexadecimal válido',
                type: 'invalid'
            });
        }

        // Validação do tipo
        if (!categoria.tipo || (categoria.tipo !== 'receita' && categoria.tipo !== 'despesa')) {
            errors.push({
                field: 'tipo',
                message: 'Tipo deve ser "receita" ou "despesa"',
                type: 'required'
            });
        }

        return errors;
    }

    private isValidColor(color: string): boolean {
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return hexColorRegex.test(color);
    }

    formatValidationMessage(errors: ValidationError[]): string {
        return errors.map(error => error.message).join('\n');
    }

    hasFieldError(errors: ValidationError[], fieldName: string): boolean {
        return errors.some(error => error.field === fieldName);
    }

    getFieldErrors(errors: ValidationError[], fieldName: string): ValidationError[] {
        return errors.filter(error => error.field === fieldName);
    }
}
