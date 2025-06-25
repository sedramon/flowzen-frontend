import { Component, OnInit } from '@angular/core';
import { SettingsService } from './services/settings.service';
import { Facility } from '../../models/Facility';
import { MatTableDataSource } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  dataSourceFacilities = new MatTableDataSource<Facility>([]);
  displayedColumnsServices: string[] = ['name', 'address', 'openingHour', 'closingHour', 'actions'];

  constructor(private settingsService: SettingsService, private authService: AuthService) {
    
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako iz nekog razloga korisnik nije dostupan, uradi fallback (npr. redirect ili error)
      return;
    }

    this.settingsService.getAllFacilities(currentUser.tenant).subscribe((facilities) => {
      this.dataSourceFacilities.data = facilities;
      console.log(facilities);
    });
  }




}
