# TWA Tilmidh — build AAB (JDK 17)

Sans Java, l’AAB ne peut pas être signé ici. Une fois JDK 17 installé :

```bash
cd twa
npx --yes @bubblewrap/cli install --jdk --androidSdk
npx --yes @bubblewrap/cli update --appVersionName 1 --appVersionCode 1
# crée android.keystore (alias tilmidh) — mot de passe UNIQUEMENT chez toi
npx --yes @bubblewrap/cli build --skipPwaValidation
```

Fingerprint pour Digital Asset Links :

```bash
keytool -list -v -keystore android.keystore -alias tilmidh
```

Coller le SHA-256 dans `public/.well-known/assetlinks.json` → `sha256_cert_fingerprints`, puis deploy.

Package : `app.tilmidh.twa`  
Host : `tilmidh.app`
