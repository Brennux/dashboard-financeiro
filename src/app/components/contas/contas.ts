import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-contas',
    imports: [CommonModule],
    templateUrl: './contas.html',
    styleUrl: './contas.scss'
})
export class Contas {
    contasPagar = [
        {
            id: 1,
            descricao: 'Conta de Luz',
            valor: 150.50,
            vencimento: new Date('2025-08-15'),
            categoria: 'Contas',
            status: 'pendente',
            recorrente: true
        },
        {
            id: 2,
            descricao: 'Internet',
            valor: 89.90,
            vencimento: new Date('2025-08-10'),
            categoria: 'Contas',
            status: 'vencida',
            recorrente: true
        },
        {
            id: 3,
            descricao: 'Financiamento do Carro',
            valor: 450.00,
            vencimento: new Date('2025-08-20'),
            categoria: 'Financiamento',
            status: 'pendente',
            recorrente: true
        }
    ];

    contasReceber = [
        {
            id: 1,
            descricao: 'Salário',
            valor: 4500.00,
            vencimento: new Date('2025-08-05'),
            categoria: 'Renda',
            status: 'recebido',
            recorrente: true
        },
        {
            id: 2,
            descricao: 'Freelance',
            valor: 800.00,
            vencimento: new Date('2025-08-12'),
            categoria: 'Renda',
            status: 'pendente',
            recorrente: false
        }
    ];

    formatarValor(valor: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    formatarData(data: Date): string {
        return new Intl.DateTimeFormat('pt-BR').format(data);
    }

    getDiasRestantes(vencimento: Date): number {
        const hoje = new Date();
        const diff = vencimento.getTime() - hoje.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'pago': return 'text-green-600 bg-green-100';
            case 'pendente': return 'text-yellow-600 bg-yellow-100';
            case 'vencida': return 'text-red-600 bg-red-100';
            case 'recebido': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    }

    marcarComoPago(conta: any) {
        conta.status = 'pago';
    }

    marcarComoRecebido(conta: any) {
        conta.status = 'recebido';
    }
}
