# Cloudinary and Cal.com setup

## Cloudinary

Use these values in Vercel and in your local `.env` file:

```bash
CLOUDINARY_CLOUD_NAME=dpbpa8o1w
CLOUDINARY_API_KEY=[paste from Cloudinary dashboard]
CLOUDINARY_API_SECRET=[paste from Cloudinary dashboard]
CLOUDINARY_UPLOAD_PRESET=klaro_uploads
CLOUDINARY_URL=cloudinary://[API_KEY]:[API_SECRET]@dpbpa8o1w
```

### Notes

- Use the API key and secret from the **Root** API key pair in Cloudinary.
- Keep the secret private; do not commit it.
- If you use signed uploads, `CLOUDINARY_UPLOAD_PRESET` can stay `klaro_uploads`.

## Cal.com

Use this for your 1-hour doctor appointment setup.

### Profile

- **Name:** Klara
- **Username:** klara
- **Bio:** Friendly care companion for Klaro patients — helps organize symptoms, lab results, and next steps before a doctor visit.

### About section

```text
Klara is your friendly care companion for Klaro. Use this session to review symptoms, organize lab results, prepare questions for your doctor, and map out the next steps in your care. This session is for guidance and coordination, not emergency treatment.
```

### 1-hour meeting template

```text
1-Hour Session with Klara

Duration: 60 minutes

What we’ll cover:
- Review your symptoms or concern
- Organize your lab results or documents
- Prepare questions for your doctor
- Outline next steps and suggested follow-up

Please bring any documents, lab results, medications, or notes you want to discuss.
This is a guidance session and does not replace emergency medical care.
```

### Cal.com environment variables

```bash
CAL_COM_API_KEY=[paste from Cal.com]
CAL_COM_BASE_URL=https://api.cal.com
CAL_COM_WEBHOOK_SECRET=[generate a 20+ character secret]
```

### Suggested booking settings

- **Duration:** 60 minutes
- **Title:** 1-Hour Session with Klara
- **Description:** Use the template above
- **Visibility:** Public or unlisted, depending on your flow
- **Buffer:** 10–15 minutes before/after if the doctor needs prep time
