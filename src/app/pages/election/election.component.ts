import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-election',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './election.component.html',
  styleUrl: './election.component.css'
})
export class ElectionComponent {
  electionForm: FormGroup;

  constructor(private readonly formBuilder: FormBuilder) {
    this.electionForm = this.formBuilder.group({
      name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
      chainId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      start: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      end: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      partylists: this.formBuilder.array<FormGroup>([]),
    });

    // Initialize with one empty party by default
    this.addParty();
  }

  get partylists(): FormArray<FormGroup> {
    return this.electionForm.get('partylists') as FormArray<FormGroup>;
  }

  candidatesAt(partyIndex: number): FormArray<FormGroup> {
    return this.partylists.at(partyIndex).get('candidates') as FormArray<FormGroup>;
  }

  addParty(): void {
    const partyGroup = this.formBuilder.group({
      name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
      candidates: this.formBuilder.array<FormGroup>([]),
    });
    this.partylists.push(partyGroup);
    // Start each party with one candidate row
    const index = this.partylists.length - 1;
    this.addCandidate(index);
  }

  removeParty(index: number): void {
    this.partylists.removeAt(index);
  }

  addCandidate(partyIndex: number): void {
    const candidateGroup = this.formBuilder.group({
      fullName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      position: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      platform: new FormControl<string>('', { nonNullable: true }),
      imageDataUrl: new FormControl<string>('', { nonNullable: true }),
    });
    this.candidatesAt(partyIndex).push(candidateGroup);
  }

  removeCandidate(partyIndex: number, candidateIndex: number): void {
    this.candidatesAt(partyIndex).removeAt(candidateIndex);
  }

  async onImageSelected(event: Event, partyIndex: number, candidateIndex: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const dataUrl = await this.readFileAsDataUrl(file);
    this.candidatesAt(partyIndex).at(candidateIndex).get('imageDataUrl')!.setValue(dataUrl);
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  submit(): void {
    if (this.electionForm.invalid) {
      this.electionForm.markAllAsTouched();
      return;
    }
    const payload = this.electionForm.getRawValue();
    // TODO: integrate with backend / smart contracts. For now, log structure.
    // eslint-disable-next-line no-console
    console.log('Create election payload', payload);
    alert('Election created (mock). Check console for payload.');
  }
}
