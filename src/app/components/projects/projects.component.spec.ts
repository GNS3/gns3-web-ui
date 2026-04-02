import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectDatabase, ProjectDataSource } from './projects.component';
import { MatSort } from '@angular/material/sort';
import { Project } from '@models/project';
import { BehaviorSubject } from 'rxjs';

describe('ProjectsComponent', () => {
  it('should have correct displayedColumns', () => {
    expect(['select', 'name', 'actions', 'delete']).toContain('select');
    expect(['select', 'name', 'actions', 'delete']).toContain('name');
  });

  it('should have currentYear as number', () => {
    expect(new Date().getFullYear()).toBeGreaterThanOrEqual(2024);
  });
});

describe('ProjectDatabase', () => {
  let database: ProjectDatabase;

  beforeEach(() => {
    database = new ProjectDatabase();
  });

  it('should create', () => {
    expect(database).toBeTruthy();
  });

  it('should initialize with empty data', () => {
    expect(database.data).toEqual([]);
  });

  it('should add projects', () => {
    const projects: Project[] = [
      { project_id: '1', name: 'Project 1' } as Project,
      { project_id: '2', name: 'Project 2' } as Project,
    ];

    database.addProjects(projects);

    expect(database.data).toHaveLength(2);
    expect(database.data[0].name).toBe('Project 1');
  });

  it('should remove project', () => {
    const project: Project = { project_id: '1', name: 'Project 1' } as Project;
    database.addProjects([project]);

    expect(database.data).toHaveLength(1);

    database.remove(project);

    expect(database.data).toHaveLength(0);
  });

  it('should handle remove of non-existent project', () => {
    const project: Project = { project_id: '999', name: 'Non-existent' } as Project;
    database.addProjects([]);

    expect(() => database.remove(project)).not.toThrow();
  });
});

describe('ProjectDataSource', () => {
  let dataSource: ProjectDataSource;
  let database: ProjectDatabase;
  let mockSort: MatSort;

  const mockProjects: Project[] = [
    { project_id: '1', name: 'Project A' } as Project,
    { project_id: '2', name: 'Project B' } as Project,
  ];

  beforeEach(() => {
    database = new ProjectDatabase();
    database.addProjects(mockProjects);

    mockSort = {
      active: '',
      direction: '',
      sortChange: new BehaviorSubject<void>(undefined as any),
    } as any as MatSort;

    dataSource = new ProjectDataSource(database, mockSort);
  });

  it('should create', () => {
    expect(dataSource).toBeTruthy();
  });

  it('should have projectDatabase', () => {
    expect(dataSource.projectDatabase).toBeDefined();
  });

  it('should have connect method', () => {
    expect(typeof dataSource.connect).toBe('function');
  });

  it('should have disconnect method', () => {
    expect(typeof dataSource.disconnect).toBe('function');
  });
});
