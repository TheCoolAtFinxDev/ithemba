import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-landing',
  imports: [],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private auth = inject(AuthService);
  private router = inject(Router);

  login() {
    this.auth.login();
  }

  registerPatient() {
    this.router.navigate(['/register/patient']);
  }

  registerProvider() {
    this.router.navigate(['/register/provider']);
  }
}