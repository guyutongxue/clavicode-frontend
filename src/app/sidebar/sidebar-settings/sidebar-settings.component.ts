import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';

@Component({
  selector: 'app-sidebar-settings',
  templateUrl: './sidebar-settings.component.html',
  styleUrls: ['./sidebar-settings.component.scss']
})
export class SidebarSettingsComponent implements OnInit {

  constructor(private themeService: ThemeService) { }

  theme = 'classic';

  ngOnInit(): void {
    this.theme = this.themeService.currentThemeName;
  }

  onThemeChange() {
    this.themeService.setTheme(this.theme);
  }

}
