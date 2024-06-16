import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlsComponent } from './pls/pls.component'; // Update path as necessary

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PlsComponent], // Correct import for standalone component
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'parachute-landing-simulator';
}