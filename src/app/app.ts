import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarPrincipal } from './components/navbar-principal/navbar-principal';
import { NotificationContainer } from './components/notification-container/notification-container';
import { Sidebar } from './components/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarPrincipal, NotificationContainer, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'dashboard-financeiro';
}
