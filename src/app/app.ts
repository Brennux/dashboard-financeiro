import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarPrincipal } from './components/navbar-principal/navbar-principal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarPrincipal],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'dashboard-financeiro';
}
