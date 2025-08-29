import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { CartaoCredito } from './components/cartao-credito/cartao-credito';
import { Contas } from './components/contas/contas';
import { PlanejamentoMensal } from './components/planejamento-mensal/planejamento-mensal';

import { Transacoes } from './pages/transacoes/transacoes';
import { Categorias } from './pages/categorias/categorias';
import { Relatorios } from './pages/relatorios/relatorios';


export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: Dashboard },
    { path: 'cartao-credito', component: CartaoCredito },
    { path: 'contas', component: Contas },
    { path: 'planejamento-mensal', component: PlanejamentoMensal },
    { path: 'transacoes', component: Transacoes },
    { path: 'categorias', component: Categorias },
    { path: 'relatorios', component: Relatorios },
    { path: '**', redirectTo: '/dashboard' }
];
