# S3 Bucket Setup for BigSpice Images

## 1. Create the bucket

Bucket name: **bigspice-images**  
Region: **ap-south-2** (Hyderabad)

Leave all other defaults, then apply the settings below.

---

## 2. Block Public Access settings

In the bucket → Permissions → Block Public Access, use:

| Setting                      | Value   |
| ---------------------------- | ------- |
| Block _all_ public access    | **OFF** |
| Block public ACLs            | **ON**  |
| Ignore public ACLs           | **ON**  |
| Block public bucket policies | **OFF** |
| Restrict public buckets      | **OFF** |

(We allow a bucket policy for public reads but block per-object ACLs.)

---

## 3. Bucket policy — allow public GET on all objects

Bucket → Permissions → Bucket Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bigspice-images/*"
    }
  ]
}
```

This makes every uploaded image accessible via its direct HTTPS URL so the app
can embed it in `<img>` tags without expiring links.

---

## 4. CORS policy — required for the pre-signed upload flow

Bucket → Permissions → Cross-Origin Resource Sharing (CORS):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": [
      "https://bigspice.in",
      "http://localhost:3000",
      "http://localhost:5000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 5. IAM — local development credentials

The `creds.json` already holds `aws_access_key_id` and `aws_secret_access_key`.
The IAM user for those keys needs this minimal policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ImageUploads",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::bigspice-images/*"
    }
  ]
}
```

---

## 6. IAM Role — EC2 production (no hardcoded keys)

On EC2, attach an IAM Role to the instance with the same policy above.
Remove (or blank out) `aws_access_key_id` / `aws_secret_access_key` from
`creds.json` on the server — boto3 will automatically pick up the instance role
from the EC2 metadata service.

Steps:

1. IAM → Roles → Create role → "AWS service / EC2"
2. Attach an inline or managed policy with the `s3:PutObject / GetObject / DeleteObject`
   permission on `arn:aws:s3:::bigspice-images/*`
3. EC2 → Instance → Actions → Security → Modify IAM role → select the new role
4. Redeploy — no code change needed

---

## 7. How the upload flows work

### Server-side upload (current, all existing forms)

```
Browser → multipart POST → Flask → Pillow resize → S3 PUT → S3 URL stored in DB
```

Handled by `_upload_image_to_s3()` in `app.py`.

### Pre-signed direct upload (new, for future client use)

```
1. POST /api/s3/presign  { folder, filename, content_type }
   ← { upload_url, public_url, key }

2. PUT <upload_url>   (raw file bytes, Content-Type header matching request)
   Authorization is embedded in the signed URL — no AWS credentials on client.

3. Store <public_url> in your DB / state.
```

Example (JavaScript):

```js
// Step 1 — get signed URL
const { upload_url, public_url } = await fetch("/api/s3/presign", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    folder: "products",
    filename: file.name,
    content_type: file.type,
  }),
}).then((r) => r.json());

// Step 2 — upload directly to S3
await fetch(upload_url, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file,
});

// Step 3 — public_url now points to the uploaded image
console.log("Image URL:", public_url);
```

---

## 8. S3 key structure

```
uploads/products/   – product listing images    (max 1200px, q82, WebP)
uploads/logos/      – seller store logos         (max 400px,  q85, WebP)
uploads/profiles/   – buyer profile pictures     (max 400px,  q85, WebP)
uploads/banners/    – homepage ad banners        (max 1600px, q85, WebP)
```
