import { Component, OnInit, inject } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { filter, take } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-landing',
  imports: [NgIf, AsyncPipe, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  loading$ = this.auth.loading$;

  ngOnInit() {
    // After the APP_INITIALIZER finishes (loading$ goes false), redirect
    // authenticated users straight to their portal — handles the OAuth callback.
    this.auth.loading$.pipe(filter(l => !l), take(1)).subscribe(() => {
      if (this.auth.isAuthenticated) {
        const role = this.auth.role;
        if (role === 'ADMIN') this.router.navigate(['/admin']);
        else if (role === 'PROVIDER') this.router.navigate(['/provider']);
        else if (role === 'EMPLOYER') this.router.navigate(['/employer']);
        else this.router.navigate(['/patient']);
      }
    });
  }

  login() { this.auth.login(); }
  register(role?: 'PATIENT' | 'PROVIDER' | 'EMPLOYER') {
    this.router.navigate(['/register'], role ? { queryParams: { role } } : {});
  }
}
