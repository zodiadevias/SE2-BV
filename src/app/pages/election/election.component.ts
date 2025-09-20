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
export default class ElectionComponent {
  email: string | any;
  electionForm: FormGroup;
  updateElectionForm: FormGroup;
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


    this.updateElectionForm = this.formBuilder.group({
      updateName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
      updateDomainFilter: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      updateStart: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      updateEnd: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      updatePartylists: this.formBuilder.array<FormGroup>([]),
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
    imageDataUrl: new FormControl<string>('', { nonNullable: true }), // CDN URL (after upload)
    file: new FormControl<File | null>(null), // Raw file (before upload)
  });
  this.candidatesAt(partyIndex).push(candidateGroup);
}


  removeCandidate(partyIndex: number, candidateIndex: number): void {
    this.candidatesAt(partyIndex).removeAt(candidateIndex);
  }

  // 🔹 File Upload
  onImageSelected(event: Event, partyIndex: number, candidateIndex: number): void {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  const candidate = this.candidatesAt(partyIndex).at(candidateIndex);

  // store the file for later upload
  candidate.get('file')!.setValue(file);

  // generate a local preview
  const reader = new FileReader();
  reader.onload = () => {
    candidate.get('imageDataUrl')!.setValue(reader.result as string);
  };
  reader.readAsDataURL(file);
}

submitting = false;


  // 🔹 Submit Form
// replace your existing submit() with this
async submit() {
  if (this.electionForm.invalid) {
    this.electionForm.markAllAsTouched();
    console.log('Invalid form');
    return;
  }

  this.submitting = true;
  this.electionForm.disable(); // disable form fields

  try {
    const payload = this.electionForm.getRawValue();

    // 1. Create election (use the returned electionId)
    const electionRes: any = await this.backendService.createElection(
      payload.name,
      payload.start,
      payload.end,
      payload.domainFilter,
      this.email
    );

    // backend might return { electionId } or raw number — handle both
    const createdElectionId = Number(
      electionRes?.electionId ?? electionRes ?? NaN
    );
    if (!createdElectionId || Number.isNaN(createdElectionId)) {
      throw new Error('Unable to determine created electionId from response: ' + JSON.stringify(electionRes));
    }

    // 2. Upload + collect candidates
    const allCandidates: any[] = [];

    for (let i = 0; i < payload.partylists.length; i++) {
      const party = payload.partylists[i];
      const candidates = party.candidates || [];

      for (const c of candidates) {
        let cdnUrl = c.imageDataUrl;

        if (c.file) {
          // if fileUploaderService returns an Observable, convert safely
          // adjust to your implementation (toPromise is deprecated in newer RxJS)
          const uploadRes: any = await this.fileUploaderService.uploadFile(c.file).toPromise();
          // adapt this line if uploadRes shape is different
          cdnUrl = `https://ucarecdn.com/${uploadRes.file}/-/preview/150x150/`;
        }

        allCandidates.push({
          name: c.fullName,
          position: c.position,
          platform: c.platform,
          cdn: cdnUrl,
          partylist: party.name,
        });
      }
    }

    // 3. Add candidates to the newly created election (use createdElectionId)
    if (allCandidates.length > 0) {
      await this.backendService.addCandidates(createdElectionId, allCandidates);
    }

    // 4. Save history (include electionId for clarity)
    this.firebaseService.addToHistory(this.email, 'Election Created', electionRes.txHash, new Date());

    alert('Election created successfully ✅');

    // 5. Reset form
    this.electionForm.reset();
    this.partylists.clear();
    this.positionPresets.clear();
    this.addParty();
    this.positionPresets.push(this.formBuilder.group({ name: new FormControl<string>('President') }));
    this.positionPresets.push(this.formBuilder.group({ name: new FormControl<string>('Vice President') }));
    this.positionPresets.push(this.formBuilder.group({ name: new FormControl<string>('Secretary') }));
  } catch (err: any) {
    console.error(err);
    alert('Something went wrong ❌ — ' + (err?.message ?? err));
  } finally {
    this.submitting = false;
    this.electionForm.enable(); // re-enable after submit
  }
}




  // 🔹 Backend Queries
  id: any;
  candidateId: any;
  electionDetails: any | null = null;
  candidate: any | null = null;

  // 🔹 Get details of election
getElectionDetails(electionId: number) {
  this.backendService.getElectionDetails(electionId).then((res: any) => {
    this.electionDetails = res;
    console.log("Election details:", this.electionDetails);
  });
}

// 🔹 Get single candidate
getCandidate(electionId: number, candidateId: number) {
  this.backendService.getElectionCandidate(electionId, candidateId).then((res: any) => {
    this.candidate = res;
    console.log("Candidate:", this.candidate);
  });
}


  ownedElections: any | null = null;
  getOwnedElections() {
    this.backendService.getOwnedElections(this.email).then((res: any) => {
      this.ownedElections = res;
      console.log(this.ownedElections);
    });
  }




  // FOR UPDATE CANDIDATES AND UPDATE ELECTION
  toggle = 'create';

  electionId: number | null = null;
  electionName: string | null = null;

  election: any | null = null;
  candidates: any | null = null;

  openElection(electionId: number, electionName: string) {
    this.toggle = 'update';
    this.electionId = electionId;
    this.electionName = electionName;


    this.backendService.getElectionDetails(electionId).then((res: any) => {
      this.election = res;
      console.log("Election details:", this.election);

      this.updateElectionForm.patchValue({
        updateName: this.election[0],
        updateDomainFilter: this.election[5],
        updateStart: new Date(this.election[3]).toISOString().slice(0, 16),
        updateEnd: new Date(this.election[4]).toISOString().slice(0, 16),
      });
    });
    

  }






}

