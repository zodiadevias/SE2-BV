import { Component } from '@angular/core';
import {MatDialogRef,MatDialogModule} from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import emailjs, { send, type EmailJSResponseStatus } from '@emailjs/browser';

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
  otpSent = false;
  generatedOtp: string = '';
  otpInput: string = '';
  isOtpVerified = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AuthDialogComponent>,
    private authService: AuthService,
    private router: Router
  ) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: [''],
      role: ['voter', Validators.required], // default role
      otp: ['']
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

  async sendOtp() {
    const { email } = this.authForm.value;
    if (!email) {
      this.errorMessage = 'Please enter a valid email.';
      return;
    }

    this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await emailjs.send(
        'blockvote',
        'template_q1zygbv',
        {
          email: email,
          passcode: this.generatedOtp
        },
        'M-Lel7Aav1F3ztGZV' // public key from EmailJS
      );
      this.otpSent = true;
      this.errorMessage = '';
      console.log('OTP sent successfully!');
      console.log('Generated OTP:', this.generatedOtp);
    } catch (err) {
      this.errorMessage = 'Failed to send OTP. Try again.';
      console.error(err);
    }
  }

  // Step 2: Verify OTP
  verifyOtp() {
  const enteredOtp = this.authForm.value.otp;
  console.log('Entered OTP:', enteredOtp, 'Generated OTP:', this.generatedOtp);

  if (enteredOtp?.trim() === this.generatedOtp.trim()) {
    this.isOtpVerified = true;
    this.errorMessage = '';
    this.errorMessage = 'Success. Please wait.'
    this.submit();

  } else {
    this.errorMessage = 'Invalid OTP';
  }
}



async submit() {
  if (this.isLogin) {
    // login flow
    const { email, password } = this.authForm.value;
    try {
      await this.authService.login(email!, password!);
      this.dialogRef.close();
    } catch (err: any) {
      this.errorMessage = err.message;
    }
    return;
  }

  // Registration flow
  if (!this.isOtpVerified) {
    this.errorMessage = 'Please verify OTP before registering.';
    return;
  }

  const { email, password, confirmPassword, role } = this.authForm.value;
  if (password !== confirmPassword) {
    this.errorMessage = 'Passwords do not match!';
    return;
  }

  try {
    await this.authService.register(email!, password!, role!);
    this.dialogRef.close();
  } catch (err: any) {
    this.errorMessage = err.message;
  }
}


}
