# Security & Data Protection Policy

## 1. Demo & Educational Purpose
Kamai Kaksha is an educational demonstration prototype developed for hackathon evaluation.
- All learner profiles, mentor interactions, guardian consents, micro-tasks, job listings, and peer validation data are **sample synthetic data** modelled on vocational education programs (DIKSHA/SWAYAM/NSDC).
- **Zero Real PII**: No real Personally Identifiable Information (PII) is collected, stored, or processed. All student IDs and task IDs are prefixed with demo tags (e.g., `STUDENT-*`, `SAMPLE-*`).
- **Zero Real Payments**: All UPI transactions, wallet balances, and Tool Kit Funds are entirely simulated. No connection to real banking, NPCI, or UPI rails exists.

## 2. Minor Safeguards (Pending Legal Review)
- In accordance with minor safeguard principles under consideration, parental/guardian consent is simulated via an OTP gate before allowing micro-task earnings for learners under 18 years of age.
- Daily earnings caps and work-hour restrictions are strictly enforced in demo task dispatching.

## 3. Ephemeral Voice Handling
- Voice audio blobs submitted during the Life Map intake are held ephemerally for local/demo transcription and deleted immediately after processing.
- Zero biometric voiceprints or raw voice recordings are retained on disk or database.

## 4. Cryptographic Credentials
- Verifiable credentials are signed server-side using standard Ed25519 (`ed25519` keypair generated in-memory on boot or provided via environment).
- Credentials use the demo DID `did:web:kamai-kaksha.example` and are strictly labeled "Demo issuer, not a government credential".
- Tamper detection verifies cryptographic signatures before rendering or validation.

## 5. Reporting Security Vulnerabilities
If you discover any security issue or unintentional data leakage pattern in this prototype, please report it via GitHub Issues or contact the maintainers. As this is an offline-first demo prototype, issues will be addressed promptly in the open repository.
