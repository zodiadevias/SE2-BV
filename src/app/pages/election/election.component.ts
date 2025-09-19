import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BackendService } from '../../../services/backend.service';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';
import { FileUploaderService } from '../../../services/file-uploader.service';

@Component({
  selector: 'app-election',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './election.component.html',
  styleUrl: './election.component.css',
})
export class ElectionComponent {
  email: string | any;
  electionForm: FormGroup;
  cdnUrl: string | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private backendService: BackendService,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private fileUploaderService: FileUploaderService
  ) {
    this.electionForm = this.formBuilder.group({
      name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
      domainFilter: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      start: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      end: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      partylists: this.formBuilder.array<FormGroup>([]),
      // ✅ NEW: Position presets array
      positionPresets: this.formBuilder.array<FormGroup>([
        this.formBuilder.group({ name: new FormControl<string>('President', { nonNullable: true }) }),
        this.formBuilder.group({ name: new FormControl<string>('Vice President', { nonNullable: true }) }),
        this.formBuilder.group({ name: new FormControl<string>('Secretary', { nonNullable: true }) }),
      ]),
    });

    // Initialize with one empty party
    this.addParty();
  }

  ngOnInit() {
    this.authService.authState$.subscribe(user => {
      if (user) {
        this.email = user.email;
        this.getOwnedElections();
      }
    });
    
  }

  // 🔹 Accessors
  get partylists(): FormArray<FormGroup> {
    return this.electionForm.get('partylists') as FormArray<FormGroup>;
  }

  candidatesAt(partyIndex: number): FormArray<FormGroup> {
    return this.partylists.at(partyIndex).get('candidates') as FormArray<FormGroup>;
  }

  get positionPresets(): FormArray<FormGroup> {
    return this.electionForm.get('positionPresets') as FormArray<FormGroup>;
  }

  // 🔹 Position Preset Controls
  addPreset(): void {
    this.positionPresets.push(
      this.formBuilder.group({
        name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      })
    );
  }

  removePreset(index: number): void {
    this.positionPresets.removeAt(index);
  }

  // 🔹 Party Controls
  addParty(): void {
    const partyGroup = this.formBuilder.group({
      name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
      candidates: this.formBuilder.array<FormGroup>([]),
    });
    this.partylists.push(partyGroup);

    // Start with one candidate
    const index = this.partylists.length - 1;
    this.addCandidate(index);
  }

  removeParty(index: number): void {
    this.partylists.removeAt(index);
  }

  // 🔹 Candidate Controls
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

  // 🔹 File Upload
  async onImageSelected(event: Event, partyIndex: number, candidateIndex: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const candidate = this.candidatesAt(partyIndex).at(candidateIndex);

    // Delete old image if exists
    const oldUrl = candidate.get('imageDataUrl')?.value;
    if (oldUrl) {
      const uuid = oldUrl.split('/')[3]; // extract UUID from https://ucarecdn.com/<uuid>/
      this.fileUploaderService.deleteFile(uuid).subscribe(() => {
        console.log('Deleted old image:', uuid);
      });
    }

    // Upload new one
    this.fileUploaderService.uploadFile(file).subscribe((res: any) => {
      const cdnUrl = `https://ucarecdn.com/${res.file}/-/preview/150x150/`;
      candidate.get('imageDataUrl')!.setValue(cdnUrl);
      console.log('Uploaded new image:', cdnUrl);
    });
  }

  // 🔹 Submit Form
  async submit() {
    if (this.electionForm.invalid) {
      this.electionForm.markAllAsTouched();
      return;
    }

    const payload = this.electionForm.getRawValue();

    // 1. Create election first
    const electionLength = await this.backendService.getElectionCount();
    const electionRes = await this.backendService.createElection(
      payload.name,
      payload.start,
      payload.end,
      payload.domainFilter,
      this.email
    );

    // 2. Collect candidates
    let allCandidates: any[] = [];

    for (let i = 0; i < payload.partylists.length; i++) {
      const party = payload.partylists[i];
      const candidates = party.candidates || [];

      const mapped = candidates.map((c: any) => ({
        name: c.fullName,
        position: c.position,
        platform: c.platform,
        cdn: c.imageDataUrl,
        partylist: party.name,
      }));

      allCandidates = [...allCandidates, ...mapped];
    }

    // 3. Send candidates to backend
    if (allCandidates.length > 0) {
      await this.backendService.addCandidates(electionLength, allCandidates);
    }

    // 4. Save history
    this.firebaseService.addToHistory(this.email, 'Election Created', electionRes.txHash, new Date());
    alert('Election created successfully ✅');

    // 5. Reset form
    this.electionForm.reset();
    this.partylists.clear();
    this.positionPresets.clear();
    // Add defaults again
    this.addParty();
    this.positionPresets.push(this.formBuilder.group({ name: new FormControl<string>('President') }));
    this.positionPresets.push(this.formBuilder.group({ name: new FormControl<string>('Vice President') }));
    this.positionPresets.push(this.formBuilder.group({ name: new FormControl<string>('Secretary') }));
  }

  // 🔹 Backend Queries
  id: any;
  candidateId: any;
  electionDetails: any | null = null;
  candidate: any | null = null;

  getElectionDetails(id: number) {
    this.backendService.getElectionDetails(id).then((res: any) => {
      this.electionDetails = res;
      console.log(this.electionDetails);
    });
  }

  getCandidate(id: number, candidateId: number) {
    this.backendService.getElectionCandidate(id, candidateId).then((res: any) => {
      this.candidate = res;
      console.log(this.candidate);
    });
  }

  ownedElections: any | null = null;
  getOwnedElections() {
    this.backendService.getOwnedElections(this.email).then((res: any) => {
      this.ownedElections = res;
      console.log(this.ownedElections);
    });
  }








}

