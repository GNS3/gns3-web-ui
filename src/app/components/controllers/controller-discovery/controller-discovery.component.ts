import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, from, of, Observable } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Controller, ControllerProtocol } from '@models/controller';
import { Version } from '@models/version';
import { ControllerDatabase } from '@services/controller.database';
import { ControllerService } from '@services/controller.service';
import { VersionService } from '@services/version.service';

@Component({
  standalone: true,
  selector: 'app-controller-discovery',
  templateUrl: './controller-discovery.component.html',
  styleUrls: ['./controller-discovery.component.scss'],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDividerModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ControllerDiscoveryComponent implements OnInit {
  private versionService = inject(VersionService);
  private controllerService = inject(ControllerService);
  private controllerDatabase = inject(ControllerDatabase);
  private route = inject(ActivatedRoute);

  private defaultControllers = [
    {
      host: '127.0.0.1',
      port: 3080,
    },
  ];

  readonly discoveredController = signal<Controller | null>(null);

  constructor() {}

  ngOnInit() {
    if (this.controllerService.isServiceInitialized) this.discoverFirstController();
    this.controllerService.serviceInitialized.subscribe(async (value: boolean) => {
      if (value) {
        this.discoverFirstController();
      }
    });
  }

  async discoverFirstController() {
    let discovered = await this.discoverControllers();
    let local = await this.controllerService.findAll();

    local.forEach((added) => {
      discovered = discovered.filter((controller) => {
        return !(controller.host == added.host && controller.port == added.port);
      });
    });

    if (discovered.length > 0) {
      this.discoveredController.set(discovered.shift());
    }
  }

  async discoverControllers() {
    let discoveredControllers: Controller[] = [];
    this.defaultControllers.forEach(async (testController) => {
      const controller = new Controller();
      controller.host = testController.host;
      controller.port = testController.port;
      let version = await this.versionService
        .get(controller)
        .toPromise()
        .catch((error) => null);
      if (version) discoveredControllers.push(controller);
    });
    return discoveredControllers;
  }

  discoverFirstAvailableController() {
    forkJoin([from(this.controllerService.findAll()).pipe(map((s: Controller[]) => s)), this.discovery()]).subscribe(
      ([local, discovered]) => {
        local.forEach((added) => {
          discovered = discovered.filter((controller) => {
            return !(controller.host == added.host && controller.port == added.port);
          });
        });
        if (discovered.length > 0) {
          this.discoveredController.set(discovered.shift());
        }
      },
      (error) => {}
    );
  }

  discovery(): Observable<Controller[]> {
    const queries: Observable<Controller>[] = [];

    this.defaultControllers.forEach((testController) => {
      queries.push(
        this.isControllerAvailable(testController.host, testController.port).pipe(
          catchError((err) => {
            return of(null);
          })
        )
      );
    });

    return new Observable<Controller[]>((observer) => {
      forkJoin(queries).subscribe((discoveredControllers) => {
        observer.next(discoveredControllers.filter((s) => s != null));
        observer.complete();
      });
    });
  }

  isControllerAvailable(ip: string, port: number): Observable<Controller> {
    const controller = new Controller();
    controller.host = ip;
    controller.port = port;
    return this.versionService.get(controller).pipe(
      mergeMap((version: Version) => of(controller))
    );
  }

  ignore(controller: Controller) {
    this.discoveredController.set(null);
  }

  accept(controller: Controller) {
    if (controller.name == null) {
      controller.name = controller.host;
    }

    controller.location = 'remote';
    controller.protocol = location.protocol as ControllerProtocol;

    this.controllerService.create(controller).then((created: Controller) => {
      this.controllerDatabase.addController(created);
      this.discoveredController.set(null);
    });
  }
}
