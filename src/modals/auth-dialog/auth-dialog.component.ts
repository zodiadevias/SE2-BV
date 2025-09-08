import { Component } from '@angular/core';
import {MatDialogRef,MatDialogModule} from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-auth-dialog',
  imports: [MatFormFieldModule, FormsModule, ReactiveFormsModule, CommonModule, MatInputModule, MatButtonModule, MatDialogModule],
  templateUrl: './auth-dialog.component.html',
  styleUrl: './auth-dialog.component.css'
})
export class AuthDialogComponent {
 authForm: FormGroup;
  isLogin = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AuthDialogComponent>,
    private authService: AuthService
  ) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['']
    });
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    if (this.isLogin) {
      this.authForm.get('confirmPassword')?.clearValidators();
    } else {
      this.authForm.get('confirmPassword')?.setValidators([Validators.required]);
    }
    this.authForm.get('confirmPassword')?.updateValueAndValidity();
  }

  async submit() {
    if (this.authForm.invalid) return;

    const { email, password, confirmPassword } = this.authForm.value;

    try {
      if (this.isLogin) {
        await this.authService.login(email, password);
        console.log('Logged in!');
      } else {
        if (password !== confirmPassword) {
          this.errorMessage = 'Passwords do not match!';
          return;
        }
        await this.authService.register(email, password);
        console.log('Registered!');
      }
      this.dialogRef.close();
    } catch (err: any) {
      this.errorMessage = err.message;
    }
  }
}
