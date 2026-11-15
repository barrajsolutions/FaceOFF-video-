# Lead quiz: CELI, CELIAPP or RRSP?

A 1-minute quiz that collects leads, in English (`index.html`) and French (`fr.html`). Each page links to the other, and every lead records which language it came from. Visitors answer 6 questions, enter their name and email to see their result, and then get the full 2026 guide with your CELI and CELIAPP videos.

**Flow:** landing → 6 questions → lead form → personalized result → full guide (CELI, CELIAPP, RRSP, comparison table, videos)

**Each lead includes:** date, first name, email, phone (optional), province, whether they want a call, their result, their 6 answers, and the traffic source (`?utm_source=` / `?utm_campaign=` in the link).

## Connect it to a Google Sheet (free, about 5 minutes)

1. Create a new Google Sheet.
2. Open **Extensions → Apps Script**, delete what's there, and paste in `google-apps-script.gs`. To get an email for every new lead, put your address in `NOTIFY_EMAIL`.
3. Click **Deploy → New deployment**, pick the type **Web app**, set **Who has access** to **Anyone**, and click **Deploy**. Allow the permissions.
4. Copy the web app URL (it ends in `/exec`).
5. In `quiz/config.js`, paste the URL into `LEAD_ENDPOINT` (it works for both languages):
   ```js
   LEAD_ENDPOINT: "https://script.google.com/macros/s/XXXX/exec",
   ```
6. Commit and push. Each new lead now shows up as a row in your Sheet.

Until a URL is set, leads are saved only in the visitor's browser. That's good for testing: open `quiz/#admin` (or `quiz/fr.html#admin`) to see them and copy them as CSV.

If you already deployed the script before the `lang` column was added, paste the new version and deploy again (**Deploy → Manage deployments → Edit → New version**).

## Put it online

With GitHub Pages turned on for the repo, the quiz is at `https://<your-user>.github.io/<repo>/quiz/` (English) and `.../quiz/fr.html` (French).

Share it with tracking, for example:
- Facebook: `.../quiz/?utm_source=facebook&utm_campaign=celi-video`
- TikTok: `.../quiz/?utm_source=tiktok`

Put the link in your video captions and bio. End your videos with something like "Take the free 1-minute quiz to find out which account is right for you."

## Change the content

The French page is a full copy of the English one, so make the same change in both `index.html` and `fr.html`.

- **Questions and scoring:** `QUESTIONS` and `score()`
- **Result text:** `SUMMARY`, `reasons()` and `noteFor()`
- **Guide facts:** the `#guide` section of the HTML. Update the limits each January. The 2026 figures were checked in November 2026: CELI $7,000 (total $109,000), CELIAPP $8,000 / $40,000, RRSP 18% up to $33,810, Home Buyers' Plan $60,000.

The page says it's general information, not advice. If you give advice for a living, add your name, licence and contact details to the footer.
