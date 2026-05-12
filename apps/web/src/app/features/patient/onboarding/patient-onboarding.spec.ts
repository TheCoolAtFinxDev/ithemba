import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientOnboarding } from './patient-onboarding';

describe('PatientOnboarding', () => {
  let component: PatientOnboarding;
  let fixture: ComponentFixture<PatientOnboarding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientOnboarding],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientOnboarding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
