import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { AddAceDialogComponent } from './add-ace-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AclService } from '@services/acl.service';
import { UserService } from '@services/user.service';
import { GroupService } from '@services/group.service';
import { RoleService } from '@services/role.service';
import { ToasterService } from '@services/toaster.service';
import { CdkTreeModule } from '@angular/cdk/tree';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { AutocompleteComponent } from './autocomplete/autocomplete.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

class FakeMatDialogRef {}
class FakeAclService {}
class FakeUserService {}
class FakeGroupService {}
class FakeRoleService {}
class FakeToasterService {}
describe('AddAceDialogComponent', () => {
  let component: AddAceDialogComponent;
  let fixture: ComponentFixture<AddAceDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddAceDialogComponent, AutocompleteComponent],
      imports: [
        CommonModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        CdkTreeModule,
        MatDividerModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useClass: FakeMatDialogRef },
        { provide: AclService, useClass: FakeAclService },
        { provide: UserService, useClass: FakeUserService },
        { provide: GroupService, useClass: FakeGroupService },
        { provide: RoleService, useClass: FakeRoleService },
        { provide: ToasterService, useClass: FakeToasterService },
        { provide: MAT_DIALOG_DATA, useValue: { endpoints: [] } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAceDialogComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
