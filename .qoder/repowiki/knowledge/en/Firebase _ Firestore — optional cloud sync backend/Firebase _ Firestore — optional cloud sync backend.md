---
kind: external_dependency
name: Firebase / Firestore — optional cloud sync backend
slug: firebase-google-cloud
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
    - client_constraint
scope:
    - '**'
---

### Identity + role
- Google Firebase project `mtf-monitor` (project id `mtf-monitor`, auth domain `mtf-monitor.firebaseapp.com`) provides the optional cloud-sync layer; without it the app runs fully offline on localStorage.

### Integration points
- Security rules live in `firestore.rules`; collections used: `syncs/{code}`, `watchlist`, `positions`, `closed_trades`, `settings`. Each write requires either `ownerUid` or `syncCode` on the document.

### Auth / signing shape

### Client constraint