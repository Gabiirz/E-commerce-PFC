import { Component, OnInit, OnDestroy, HostListener, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../service/authService/auth.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CartStateService } from '../../service/data-access/cart-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink,CommonModule, FormsModule, ReactiveFormsModule, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  
  cartState = Inject(CartStateService).state;
  userLoggedIn = false;
  isDropdownOpen = false;
  userEmail: string | null = null;
  private authSub: Subscription | undefined;

  constructor(private authService: AuthService,) {}
  
  ngOnInit() {
    this.authSub = this.authService.isLoggedIn$.subscribe(async (loggedIn) => {
      this.userLoggedIn = loggedIn;
      if (loggedIn) {
        this.userEmail = await this.authService.getCurrentUserEmail();
      } else {
        this.userEmail = null;
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  async signOut() {
    await this.authService.signOut();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.isDropdownOpen = false;
    }
  }

}


  




