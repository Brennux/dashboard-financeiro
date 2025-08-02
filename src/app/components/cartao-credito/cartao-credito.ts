import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-cartao-credito',
    imports: [CommonModule],
    templateUrl: './cartao-credito.html',
    styleUrl: './cartao-credito.scss'
})
export class CartaoCredito {
    cartoes = [
        {
            nome: 'Cartão Principal',
            numero: '**** **** **** 1234',
            limite: 5000,
            usado: 1250,
            vencimento: '15/08/2025',
            bandeira: 'Visa'
        },
        {
            nome: 'Cartão Reserva',
            numero: '**** **** **** 5678',
            limite: 3000,
            usado: 750,
            vencimento: '20/08/2025',
            bandeira: 'Mastercard'
        }
    ];

    formatarValor(valor: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    getPercentualUso(usado: number, limite: number): number {
        return (usado / limite) * 100;
    }
}
