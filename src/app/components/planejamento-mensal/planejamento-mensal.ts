import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-planejamento-mensal',
    imports: [CommonModule],
    templateUrl: './planejamento-mensal.html',
    styleUrl: './planejamento-mensal.scss'
})
export class PlanejamentoMensal {
    mesAtual = new Date().getMonth();
    anoAtual = new Date().getFullYear();

    orcamento = {
        renda: 5000,
        categorias: [
            { nome: 'Alimentação', planejado: 800, gasto: 650, cor: 'red' },
            { nome: 'Transporte', planejado: 400, gasto: 380, cor: 'blue' },
            { nome: 'Entretenimento', planejado: 300, gasto: 420, cor: 'purple' },
            { nome: 'Saúde', planejado: 200, gasto: 150, cor: 'pink' },
            { nome: 'Educação', planejado: 250, gasto: 180, cor: 'indigo' },
            { nome: 'Outros', planejado: 200, gasto: 120, cor: 'gray' }
        ]
    };

    metas = [
        {
            nome: 'Reserva de Emergência',
            valorAlvo: 10000,
            valorAtual: 3500,
            prazo: new Date('2025-12-31'),
            cor: 'green'
        },
        {
            nome: 'Viagem de Férias',
            valorAlvo: 3000,
            valorAtual: 1200,
            prazo: new Date('2025-07-15'),
            cor: 'blue'
        },
        {
            nome: 'Novo Laptop',
            valorAlvo: 4500,
            valorAtual: 2100,
            prazo: new Date('2025-09-30'),
            cor: 'purple'
        }
    ];

    // Propriedade para acessar Math no template
    Math = Math;

    get nomeDoMes(): string {
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${meses[this.mesAtual]} ${this.anoAtual}`;
    }

    get totalPlanejado(): number {
        return this.orcamento.categorias.reduce((total, cat) => total + cat.planejado, 0);
    }

    get totalGasto(): number {
        return this.orcamento.categorias.reduce((total, cat) => total + cat.gasto, 0);
    }

    get saldoRestante(): number {
        return this.orcamento.renda - this.totalGasto;
    }

    formatarValor(valor: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    getPercentualGasto(categoria: any): number {
        return (categoria.gasto / categoria.planejado) * 100;
    }

    getPercentualMeta(meta: any): number {
        return (meta.valorAtual / meta.valorAlvo) * 100;
    }

    getCorCategoria(cor: string): string {
        const cores: { [key: string]: string } = {
            'red': 'bg-red-500',
            'blue': 'bg-blue-500',
            'purple': 'bg-purple-500',
            'pink': 'bg-pink-500',
            'indigo': 'bg-indigo-500',
            'gray': 'bg-gray-500',
            'green': 'bg-green-500'
        };
        return cores[cor] || 'bg-gray-500';
    }

    getDiasRestantes(prazo: Date): number {
        const hoje = new Date();
        const diff = prazo.getTime() - hoje.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    }
}
