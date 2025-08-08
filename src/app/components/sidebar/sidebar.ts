import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.scss'
})
export class Sidebar {
    menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'fas fa-home',
            route: '/dashboard',
            active: true
        },
        {
            id: 'cartao-credito',
            label: 'Cartão de Crédito',
            icon: 'fas fa-credit-card',
            route: '/cartao-credito',
            active: false
        },
        {
            id: 'contas',
            label: 'Contas',
            icon: 'fas fa-file-invoice-dollar',
            route: '/contas',
            active: false
        },
        {
            id: 'planejamento',
            label: 'Planejamento Mensal',
            icon: 'fas fa-calendar-alt',
            route: '/planejamento-mensal',
            active: false
        },
       
    ];

    constructor(private router: Router) { }

    setActiveItem(itemId: string) {
        this.menuItems.forEach(item => {
            item.active = item.id === itemId;
        });
    }

    navigateToItem(item: any) {
        this.setActiveItem(item.id);
        this.router.navigate([item.route]);
    }
}