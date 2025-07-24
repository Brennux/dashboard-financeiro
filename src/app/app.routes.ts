import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';

import { Transacoes } from './pages/transacoes/transacoes';
import { Categorias } from './pages/categorias/categorias';
import { Relatorios } from './pages/relatorios/relatorios';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: Dashboard },
    { path: 'transacoes', component: Transacoes },
    { path: 'categorias', component: Categorias },
    { path: 'relatorios', component: Relatorios },
    { path: '**', redirectTo: '/dashboard' }
];
