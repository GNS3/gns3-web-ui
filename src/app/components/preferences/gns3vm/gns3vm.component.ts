import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Gns3vm } from '../../../models/gns3vm/gns3vm';
import { Gns3vmEngine } from '../../../models/gns3vm/gns3vmEngine';
import { VM } from '../../../models/gns3vm/vm';
import { Server } from '../../../models/server';
import { Gns3vmService } from '../../../services/gns3vm.service';
import { ServerService } from '../../../services/server.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-gns3vm',
  templateUrl: './gns3vm.component.html',
  styleUrls: ['./gns3vm.component.scss'],
})
export class Gns3vmComponent implements OnInit {
  public server: Server;
  public gns3vm: Gns3vm;
  public vmEngines: Gns3vmEngine[];
  public vms: VM[] = [];
  public vmForm: FormGroup;
  public port: number;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private gns3vmService: Gns3vmService,
    private router: Router,
    private formBuilder: FormBuilder,
    private toasterService: ToasterService
  ) {
    this.vmForm = this.formBuilder.group({
      ram: new FormControl(null, [Validators.required]),
      vcpus: new FormControl(null, [Validators.required]),
    });
  }

  ngOnInit() {
    const server_id = this.route.snapshot.paramMap.get('server_id');
    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;
      this.gns3vmService.getGns3vm(this.server).subscribe((vm: Gns3vm) => {
        this.gns3vm = vm;
        this.vmForm.controls['ram'].setValue(this.gns3vm.ram);
        this.vmForm.controls['vcpus'].setValue(this.gns3vm.vcpus);
        if (this.gns3vm.port) this.port = this.gns3vm.port;
        this.gns3vmService.getGns3vmEngines(this.server).subscribe((vmEngines: Gns3vmEngine[]) => {
          this.vmEngines = vmEngines;
        });
        this.gns3vmService.getVms(this.server, this.gns3vm.engine).subscribe((vms: VM[]) => {
          this.vms = vms;
        });
      });
    });
  }

  goBack() {
    this.router.navigate(['/server', this.server.id, 'preferences']);
  }

  setCloseAction(action: string) {
    this.gns3vm.when_exit = action;
  }

  changeVmEngine(event) {
    this.gns3vmService.getVms(this.server, event.value).subscribe(
      (vms: VM[]) => {
        this.vms = vms;
      },
      (error) => {}
    );
  }

  save() {
    if ((this.vmForm.valid && this.gns3vm.vmname) || (this.gns3vm.engine === 'remote' && this.gns3vm.vmname)) {
      this.gns3vm.ram = this.vmForm.get('ram').value;
      this.gns3vm.vcpus = this.vmForm.get('vcpus').value;
      if (this.port) this.gns3vm.port = this.port;

      this.gns3vmService.updateGns3vm(this.server, this.gns3vm).subscribe(() => {
        this.toasterService.success('GNS3 VM updated.');
      });
      this.goBack();
    } else {
      this.toasterService.error('Fill all required fields with correct values.');
    }
  }
}
