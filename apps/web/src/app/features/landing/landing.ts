import { Component, inject } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-landing',
  imports: [NgIf, AsyncPipe],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private auth = inject(AuthService);
  loading$ = this.auth.loading$;

  login() { this.auth.login(); }
}
