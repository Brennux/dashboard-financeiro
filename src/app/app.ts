import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarPrincipal } from './components/navbar-principal/navbar-principal';
import { NotificationContainer } from './components/notification-container/notification-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarPrincipal, NotificationContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'dashboard-financeiro';
}
