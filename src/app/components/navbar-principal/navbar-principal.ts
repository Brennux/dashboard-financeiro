import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar-principal',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar-principal.html',
  styleUrl: './navbar-principal.scss'
})
export class NavbarPrincipal {
  isMenuOpen = false;
  userName = 'João Silva';
  userEmail = 'joao@exemplo.com';

  menuItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fas fa-chart-pie' },
    { label: 'Transações', route: '/transacoes', icon: 'fas fa-exchange-alt' },
    { label: 'Categorias', route: '/categorias', icon: 'fas fa-tags' },
    { label: 'Relatórios', route: '/relatorios', icon: 'fas fa-chart-bar' },
  ];

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
