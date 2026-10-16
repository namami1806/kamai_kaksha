import crypto from 'crypto';

// Ed25519 Keypair for Kamai Kaksha Authority (ephemeral in-memory generation or from env)
// Server-side only: Private key NEVER leaves server memory and is never committed to git.
let privateKey, publicKey;
try {
  if (process.env.ED25519_PRIVATE_KEY) {
    privateKey = crypto.createPrivateKey(process.env.ED25519_PRIVATE_KEY);
    publicKey = crypto.createPublicKey(privateKey);
  } else {
    const keyPair = crypto.generateKeyPairSync('ed25519');
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;
  }
} catch (err) {
  console.error('Error initializing Ed25519 keypair:', err);
  const fallback = crypto.generateKeyPairSync('ed25519');
  privateKey = fallback.privateKey;
  publicKey = fallback.publicKey;
}

// Export Public Key in SPKI PEM & Raw Hex
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });
const publicKeyHex = publicKeyDer.toString('hex');

// In-memory credentials store
const credentialsStore = new Map();

/**
 * Canonicalize credential payload for deterministic signing (RFC 8785 style recursive sorting)
 */
function deterministicStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => JSON.stringify(k) + ':' + deterministicStringify(obj[k]));
  return '{' + pairs.join(',') + '}';
}

function canonicalizePayload(data) {
  const { proof, ...signable } = data;
  return deterministicStringify(signable);
}

/**
 * Sign a W3C / DigiLocker Verifiable Credential using Server-Side Ed25519
 */
export function issueVerifiableCredential({
  studentId = 'priya_17',
  studentName = 'Priya Kumari',
  age = 17,
  district = 'Gaya',
  state = 'Bihar',
  courseId = 'SAMPLE-CRS-SOLAR-101',
  qualification = 'Solar Photovoltaic & DC Microgrid Inverter Technician (Level 1)',
  competencies = [
    'DC Inverter Wiring & High-Current Safety',
    'Multimeter Battery Terminal Voltage Measurement',
    'Lead-Acid & Lithium-Ion Cell Testing',
    'Small Electronics PCB Soldering'
  ],
  guardianConsentVerified = true
}) {
  const credentialId = `SAMPLE-CRED-${studentId.toUpperCase()}-${courseId.replace(/[^A-Z0-9]/g, '-')}`;
  const now = new Date().toISOString();

  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schema.org'
    ],
    id: `did:credential:${credentialId}`,
    type: ['VerifiableCredential', 'VocationalSkillCredential'],
    issuer: {
      id: 'did:web:kamai-kaksha.example',
      name: 'Kamai Kaksha Skills Authority',
      issuerNote: 'Demo issuer, not a government credential'
    },
    issuanceDate: now,
    credentialSubject: {
      id: `did:student:${studentId}`,
      name: studentName,
      age,
      isMinor: age < 18,
      guardianConsentVerified,
      minorAdvisory: 'minor safeguards, pending legal review',
      district,
      state,
      qualification,
      courseId,
      alignedFramework: 'NSDC / NCVET National Skills Qualification Framework (Modelled)',
      competencies,
      grade: 'Distinction (95% Practical Score)'
    },
    disclaimer: 'Sample credential modelled on NSDC / NCVET / DigiLocker standards. Demo issuer, not a government credential.'
  };

  // Sign canonical payload
  const canonicalBytes = Buffer.from(canonicalizePayload(credential), 'utf-8');
  const signature = crypto.sign(null, canonicalBytes, privateKey);
  const signatureHex = signature.toString('hex');

  // Attach Ed25519 cryptographic proof
  credential.proof = {
    type: 'Ed25519Signature2020',
    created: now,
    verificationMethod: 'did:web:kamai-kaksha.example#key-1',
    proofPurpose: 'assertionMethod',
    proofValueHex: signatureHex
  };

  credentialsStore.set(credentialId, credential);
  credentialsStore.set(credential.id, credential);

  return credential;
}

/**
 * Verify Ed25519 Signature of a Credential
 */
export function verifyCredentialById(credentialId) {
  const credential = credentialsStore.get(credentialId);
  if (!credential) {
    return {
      verified: false,
      error: 'Credential not found in registry',
      credentialId
    };
  }

  return verifyCredentialPayload(credential);
}

/**
 * Verify any Credential Object using Server Public Key
 */
export function verifyCredentialPayload(credential) {
  try {
    if (!credential || !credential.proof || !credential.proof.proofValueHex) {
      return { verified: false, error: 'Missing cryptographic proof in credential' };
    }

    const signature = Buffer.from(credential.proof.proofValueHex, 'hex');
    const canonicalBytes = Buffer.from(canonicalizePayload(credential), 'utf-8');
    const isValid = crypto.verify(null, canonicalBytes, publicKey, signature);

    return {
      verified: isValid,
      credentialId: credential.id,
      issuer: credential.issuer.id,
      issuerNote: 'Demo issuer, not a government credential',
      subject: credential.credentialSubject.id,
      studentName: credential.credentialSubject.name,
      qualification: credential.credentialSubject.qualification,
      issuanceDate: credential.issuanceDate,
      signatureAlgorithm: 'Ed25519',
      verifiedAt: new Date().toISOString(),
      disclaimer: 'Sample credential modelled on NSDC / NCVET / DigiLocker standards. Demo issuer, not a government credential.'
    };
  } catch (err) {
    return {
      verified: false,
      error: `Verification exception: ${err.message}`
    };
  }
}

/**
 * Get Public Key Details
 */
export function getPublicKeyInfo() {
  return {
    algorithm: 'Ed25519',
    issuer: 'did:web:kamai-kaksha.example',
    issuerNote: 'Demo issuer, not a government credential',
    publicKeyPem,
    publicKeyHex
  };
}

export function getCredential(id) {
  return credentialsStore.get(id) || credentialsStore.get(`did:credential:${id}`) || null;
}

export function removeCredential(id) {
  credentialsStore.delete(id);
  credentialsStore.delete(`did:credential:${id}`);
  const baseId = id.replace('did:credential:', '');
  credentialsStore.delete(baseId);
}

export function clearAllCredentials() {
  credentialsStore.clear();
}

