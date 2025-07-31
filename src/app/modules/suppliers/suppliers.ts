import { Component, OnInit } from '@angular/core';
import { SuppliersService } from './services/suppliers.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-suppliers',
  imports: [],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss'
})
export class Suppliers implements OnInit{
  constructor(private suppliersService: SuppliersService, private authService: AuthService) {}


  ngOnInit(): void {
    this.suppliersService.getAllSuppliers(this.authService.getCurrentUser()!.tenant).subscribe();
  }

}
