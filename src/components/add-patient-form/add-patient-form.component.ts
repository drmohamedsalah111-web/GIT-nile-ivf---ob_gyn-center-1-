import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientsService } from '../../services/patients.service';

@Component({
  selector: 'app-add-patient-form',
  templateUrl: './add-patient-form.component.html',
  styleUrls: ['./add-patient-form.component.css']
})
export class AddPatientFormComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private patientsService: PatientsService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.min(1), Validators.max(150)]],
      phone: [''],
      husband_name: [''],
      history: ['']
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const response = await this.patientsService.addPatient(this.form.value);

    this.isSubmitting = false;

    if (response.ok) {
      this.successMessage = 'Patient added successfully';
      this.form.reset();
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } else {
      this.errorMessage = 'Something went wrong';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    }
  }

  get name() {
    return this.form.get('name');
  }

  get age() {
    return this.form.get('age');
  }

  get phone() {
    return this.form.get('phone');
  }

  get husband_name() {
    return this.form.get('husband_name');
  }

  get history() {
    return this.form.get('history');
  }
}
