import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AdButlerResponse } from '@models/adbutler';
import { ThemeService } from '@services/theme.service';
import { Location } from '@angular/common';

const adButlerResponseBodyRegex: RegExp =
  /<a href="(.*)">(.*)<\/a><br\/>(.*)<br\/>\s*<button><a .*>(.*)<\/a>\s*<\/button>/i;

@Component({
  selector: 'app-adbutler',
  templateUrl: './adbutler.component.html',
  styleUrl: './adbutler.component.scss',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdbutlerComponent implements OnInit {
  private httpClient = inject(HttpClient);
  private themeService = inject(ThemeService);
  private location = inject(Location);

  readonly isVisible = signal(false);
  readonly isLightThemeEnabled = signal(false);

  // Default ad props in case adbutler request fails
  readonly adUrl = signal(
    'https://try.solarwinds.com/gns3-free-toolset-giveaway?CMP=LEC-HAD-GNS3-SW_NA_X_NP_X_X_EN_STSGA_SW-ST-20200901_ST_OF1_TRY-NWSLTR'
  );
  readonly adBody = signal(
    'Network Config Generator makes it easy configure network devices, including VLANs without opening the CLI'
  );
  readonly buttonLabel = signal('Check it out!');

  hide() {
    this.isVisible.set(false);
  }

  ngOnInit() {
    if (this.location.path().includes('nodes')) return;
    this.httpClient
      .get<AdButlerResponse>('https://servedbyadbutler.com/adserve/;ID=165803;size=0x0;setID=371476;type=json;')
      .subscribe(
        (response) => {
          if (response?.placements?.placement_1?.body) {
            try {
              // Use a regexp to parse the AdButler response. Preferably we would use the AdButler API
              // directly to get the data we need through a JSON response, but making an API request
              // involves storing credentials, which would be unwise to store in this repo. Best thing
              // would to have gns3.com proxy the JSON ad data to this web ui app.
              const htmlWithoutNewlines = response.placements.placement_1.body.replace(/(\r\n|\n|\r)/gm, '');
              const parsedAdResponseParts = adButlerResponseBodyRegex.exec(htmlWithoutNewlines);

              // Ad title (2nd capture group) currently not used
              this.adUrl.set(parsedAdResponseParts[1].trim());
              this.adBody.set(parsedAdResponseParts[3].trim());
              this.buttonLabel.set(parsedAdResponseParts[4].trim());
            } catch (e) {}
          }

          this.isVisible.set(true);
        },
        (error) => {}
      );

    this.themeService.getActualTheme() === 'light'
      ? this.isLightThemeEnabled.set(true)
      : this.isLightThemeEnabled.set(false);

    this.themeService.themeChanged.subscribe(() => {
      this.themeService.getActualTheme() === 'light'
        ? this.isLightThemeEnabled.set(true)
        : this.isLightThemeEnabled.set(false);
    });
  }
}
