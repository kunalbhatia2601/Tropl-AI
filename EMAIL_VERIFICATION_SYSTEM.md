# Email Verification System - Implementation Guide

## Overview
This document describes the email verification system with OTP (One-Time Password) that has been implemented in the AI Interviewer platform.

## Architecture

### Flow Diagram
```
User Registration → Generate OTP → Send Email → User Enters OTP → Verify OTP → Email Verified → Resume Upload
```

## Components Implemented

### 1. Email Configuration (`src/lib/email.js`)
A reusable email utility using nodemailer with the following functions:

- **`sendEmail()`**: Core function to send any email
  - Parameters: `to`, `subject`, `html`, `text`
  - Uses SMTP configuration from environment variables
  - Returns: `{ success: boolean, messageId/error: string }`

- **`sendOTPEmail(email, name, otp)`**: Sends beautiful OTP verification email
  - Professional HTML template with gradient design
  - Shows 6-digit OTP code prominently
  - Includes expiry time and security warnings
  - Fallback plain text version

- **`sendWelcomeEmail(email, name)`**: Sends welcome email after verification
  - Congratulates user on successful verification
  - Lists next steps (upload resume, review data, start interviews)
  - Includes link to dashboard

- **`verifyEmailConfig()`**: Tests SMTP connection
  - Validates email server is ready
  - Useful for startup health checks

### 2. User Model Updates (`src/models/User.js`)
Added OTP-related methods to User schema:

- **`generateOTP()`**: Creates and stores OTP
  - Generates random 6-digit number
  - Hashes OTP using SHA256 before storing (security best practice)
  - Sets expiry time based on `OTP_EXPIRY_MINUTES` env variable
  - Returns plain OTP for email sending
  
- **`verifyOTP(otp)`**: Validates provided OTP
  - Checks if OTP exists and not expired
  - Hashes provided OTP and compares with stored hash
  - Returns boolean result
  
- **`clearOTP()`**: Removes OTP data after successful verification
  - Clears `emailVerificationToken` and `emailVerificationExpires`

### 3. API Endpoints

#### Registration Endpoint (`/api/auth/register`)
**Changes made:**
- Creates user with `emailVerified: false`
- Generates OTP using `user.generateOTP()`
- Sends OTP email via `sendOTPEmail()`
- Returns success WITHOUT JWT token (forces verification)
- Response includes `requiresVerification: true` flag

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for the verification code.",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "emailVerified": false
  },
  "requiresVerification": true
}
```

#### OTP Verification Endpoint (`/api/auth/verify-otp`)
**Route:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Process:**
1. Validates OTP format (must be 6 digits)
2. Finds user by email
3. Checks if already verified
4. Verifies OTP using `user.verifyOTP(otp)`
5. Marks user as `emailVerified: true`
6. Clears OTP data
7. Sends welcome email (async, doesn't block response)
8. Generates JWT token
9. Sets HTTP-only cookie
10. Returns user data

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully! Welcome to AI Interviewer.",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "user",
    "emailVerified": true
  }
}
```

#### Resend OTP Endpoint (`/api/auth/resend-otp`)
**Route:** `POST /api/auth/resend-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Process:**
1. Finds user by email
2. Checks if already verified
3. **Rate limiting**: Prevents resending if current OTP still valid for >8 minutes
4. Generates new OTP
5. Sends new email
6. Returns success

**Rate Limiting Logic:**
```javascript
// If OTP expires in 10 minutes, allow resend only after 2 minutes
// This prevents abuse while allowing legitimate resends
if (minutesLeft > (totalMinutes - 2)) {
  return 429; // Too Many Requests
}
```

### 4. Email Verification Page (`/auth/verify-email`)

**Features:**
- **6-digit OTP input** with auto-focus and auto-submit
- **Paste support**: Can paste full 6-digit code
- **Countdown timer**: 60-second cooldown for resend
- **Auto-submit**: Automatically submits when all 6 digits entered
- **Keyboard navigation**: Backspace moves to previous input
- **Loading states**: Shows spinner during verification/resend
- **Error handling**: Clear error messages
- **Email display**: Shows email address being verified
- **Responsive design**: Works on mobile and desktop

**URL Format:**
```
/auth/verify-email?email=user@example.com
```

**UI Components:**
- Email icon header with gradient background
- 6 input boxes for OTP digits (styled as large boxes)
- Verify button (disabled until all 6 digits entered)
- Resend button with countdown timer
- Help text with tips (check spam, expiry time)
- Back to registration link

### 5. Updated Registration Page
- Changed redirect from `/dashboard` to `/auth/verify-email?email=...`
- Updated success message to indicate email verification step

## Environment Variables

### Required Configuration (`.env.local`)
```bash
# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=AI Interviewer <noreply@aiinterviewer.com>

# OTP Configuration
OTP_EXPIRY_MINUTES=10
NEXT_PUBLIC_OTP_EXPIRY_MINUTES=10  # For frontend display
```

### Gmail Setup (for developers)
1. Enable 2-Factor Authentication in Google Account
2. Generate App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use App Password in `EMAIL_PASSWORD` (not your regular password)

## Security Features

### 1. OTP Hashing
- OTPs are **never stored in plain text**
- Uses SHA256 hashing before database storage
- Even if database compromised, OTPs can't be read

### 2. Expiry Mechanism
- OTPs expire after configurable time (default: 10 minutes)
- Expired OTPs automatically rejected

### 3. Rate Limiting
- Prevents OTP spam by limiting resend frequency
- 60-second cooldown in UI
- Server-side validation: can't resend if current OTP still fresh

### 4. No Authentication Without Verification
- JWT token only generated AFTER email verification
- Unverified users can't access protected routes

### 5. Input Validation
- OTP must be exactly 6 digits
- Email format validation
- XSS protection (Next.js built-in)

## User Experience Flow

### Happy Path
1. User fills registration form
2. Submits → sees success message
3. Redirected to verification page
4. Receives email with OTP within seconds
5. Enters OTP (or pastes from email)
6. Auto-submits when complete
7. Sees "Email verified" message
8. Gets JWT cookie automatically
9. Redirected to resume upload page

### Error Handling
- **Invalid OTP**: Clear error message, inputs reset, focus on first box
- **Expired OTP**: Can click "Resend" to get new code
- **Email not sent**: Registration still succeeds, user can resend
- **Network error**: Friendly error message, can retry

## Testing Checklist

### Manual Testing
- [ ] Register new user
- [ ] Receive OTP email
- [ ] Enter correct OTP → success
- [ ] Enter wrong OTP → error shown
- [ ] Wait for expiry → OTP rejected
- [ ] Click resend → new OTP received
- [ ] Paste 6-digit code → auto-submits
- [ ] Try resend too quickly → rate limit message
- [ ] Check spam folder hint displayed
- [ ] Mobile responsive design

### Email Testing
- [ ] Gmail delivery works
- [ ] HTML email displays correctly
- [ ] Plain text fallback works
- [ ] From name shows correctly
- [ ] Subject line clear
- [ ] OTP prominently displayed
- [ ] Expiry time shown
- [ ] Security warnings included

## Email Templates

### OTP Email Design
- **Header**: Logo with gradient background
- **Title**: "Verify Your Email"
- **OTP Box**: Large blue gradient box with 6-digit code
- **Expiry Info**: Shows minutes until expiration
- **Security Warning**: Yellow box with warning icon
- **Footer**: Company info, copyright, help text

### Welcome Email Design
- **Header**: Logo with celebration emoji
- **Title**: "Welcome Aboard! 🎉"
- **Next Steps**: Numbered list with icons
  1. Upload Resume
  2. Review Parsed Information
  3. Start Taking Interviews
- **CTA Button**: "Go to Dashboard" (gradient button)
- **Footer**: Support contact info

## Next Steps (Resume Upload)

After email verification, users should:
1. Be redirected to `/auth/upload-resume`
2. Upload PDF resume
3. System parses resume
4. Show editable form with parsed data
5. Save to Resume model
6. Redirect to dashboard

## Troubleshooting

### Email Not Sending
1. Check `EMAIL_USER` and `EMAIL_PASSWORD` in `.env.local`
2. For Gmail, ensure App Password (not regular password)
3. Check firewall/antivirus blocking port 587
4. Test with `verifyEmailConfig()` function

### OTP Not Working
1. Check system time (affects expiry calculation)
2. Verify `OTP_EXPIRY_MINUTES` is set
3. Check database for `emailVerificationToken` field
4. Ensure user document has OTP saved

### "User Not Found" Error
1. Verify email case (stored as lowercase)
2. Check `isActive: true` filter
3. Ensure user was created successfully

## Code Quality
- ✅ Error handling in all endpoints
- ✅ Loading states in UI
- ✅ Input validation (client + server)
- ✅ Security best practices (OTP hashing)
- ✅ Rate limiting
- ✅ Responsive design
- ✅ Accessible UI (labels, ARIA)
- ✅ Console logging for debugging
- ✅ Professional email templates

## Dependencies
- `nodemailer@7.0.7` - Email sending
- `crypto` (Node.js built-in) - OTP hashing
- `lucide-react` - Icons
- `next/navigation` - Routing

## Performance Considerations
- Email sending is async (doesn't block responses)
- Welcome email sent in background after verification
- OTP hashing is fast (SHA256)
- Database indexes on email field
- HTTP-only cookies for security + performance

## Accessibility
- Form labels for screen readers
- Focus management (auto-focus inputs)
- Keyboard navigation support
- High contrast colors
- Clear error messages
- Loading state announcements

---

## Summary
The email verification system is now fully implemented with:
✅ Beautiful OTP emails with security
✅ Robust verification endpoints
✅ Professional UI with great UX
✅ Security best practices
✅ Rate limiting and validation
✅ Welcome emails
✅ Error handling

**Ready for:** Resume upload implementation (next phase)
