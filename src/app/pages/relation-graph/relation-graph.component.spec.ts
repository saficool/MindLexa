import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationGraphComponent } from './relation-graph.component';

describe('RelationGraphComponent', () => {
  let component: RelationGraphComponent;
  let fixture: ComponentFixture<RelationGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelationGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelationGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
