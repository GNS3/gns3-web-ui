import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from '../../services/theme.service';
import { AdButlerResponse } from '../../models/adbutler';

const adButlerResponseBodyRegex: RegExp = /<a href="(.*)">(.*)<\/a><br\/>(.*)<br\/>\s*<button><a .*>(.*)<\/a>\s*<\/button>/i

@Component({
    selector: 'app-adbutler',
    templateUrl: './adbutler.component.html',
    styleUrls: ['./adbutler.component.scss']
})

export class AdbutlerComponent implements OnInit {
    isVisible: boolean = false;
    isLightThemeEnabled: boolean = false;

    // Default ad props in case adbutler request fails
    adUrl: string = 'https://try.solarwinds.com/gns3-free-toolset-giveaway?CMP=LEC-HAD-GNS3-SW_NA_X_NP_X_X_EN_STSGA_SW-ST-20200901_ST_OF1_TRY-NWSLTR';
    adBody: string = 'Network Config Generator makes it easy configure network devices, including VLANs without opening the CLI'
    buttonLabel: string = 'Check it out!'

    constructor(
        private httpClient: HttpClient,
        private themeService: ThemeService
    ) {}

    hide() {
        this.isVisible = false;
    }

    ngOnInit() {
        this.httpClient
            .get<AdButlerResponse>('https://servedbyadbutler.com/adserve/;ID=165803;size=0x0;setID=371476;type=json;')
            .subscribe(response => {
                if (response?.placements?.placement_1?.body) {
                    try {
                        // Use a regexp to parse the AdButler response. Preferably we would use the AdButler API
                        // directly to get the data we need through a JSON response, but making an API request
                        // involves storing credentials, which would be unwise to store in this repo. Best thing
                        // would to have gns3.com proxy the JSON ad data to this web ui app.
                        const htmlWithoutNewlines = response.placements.placement_1.body.replace(/(\r\n|\n|\r)/gm, '');
                        const parsedAdResponseParts = adButlerResponseBodyRegex.exec(htmlWithoutNewlines);

                        // Ad title (2nd capture group) currently not used
                        this.adUrl = parsedAdResponseParts[1].trim();
                        this.adBody = parsedAdResponseParts[3].trim();
                        this.buttonLabel = parsedAdResponseParts[4].trim();
                    } catch (e) {}
                }

                this.isVisible = true;
            },
            error => {}
        );

        this.themeService.getActualTheme() === 'light'
            ? this.isLightThemeEnabled = true
            : this.isLightThemeEnabled = false;

        this.themeService.themeChanged.subscribe((value: string) => {
            console.log(value)
            this.themeService.getActualTheme() === 'light'
                ? this.isLightThemeEnabled = true
                : this.isLightThemeEnabled = false;
        });
    }
}
