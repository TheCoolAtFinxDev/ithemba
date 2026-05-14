import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-unauthorized',
  imports: [],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.css',
})
export class Unauthorized {
  private router = inject(Router);
  private auth = inject(AuthService);

  goHome() {
    const role = this.auth.role;
    if (role === 'ADMIN') this.router.navigate(['/admin']);
    else if (role === 'PROVIDER') this.router.navigate(['/provider']);
    else if (this.auth.isAuthenticated) this.router.navigate(['/patient']);
    else this.router.navigate(['/']);
  }

  logout() { this.auth.logout(); }
}
