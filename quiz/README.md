# Lead quiz: CELI, CELIAPP or RRSP?

A 1-minute quiz that collects leads. Visitors answer 6 questions, enter their name and email to see their result, and then get the full 2026 guide with your CELI and CELIAPP videos.

**Flow:** landing → 6 questions → lead form → personalized result → full guide (CELI, CELIAPP, RRSP, comparison table, videos)

**Each lead includes:** date, first name, email, phone (optional), province, whether they want a call, their result, their 6 answers, and the traffic source (`?utm_source=` / `?utm_campaign=` in the link).

## Connect it to a Google Sheet (free, about 5 minutes)

1. Create a new Google Sheet.
2. Open **Extensions → Apps Script**, delete what's there, and paste in `google-apps-script.gs`. To get an email for every new lead, put your address in `NOTIFY_EMAIL`.
3. Click **Deploy → New deployment**, pick the type **Web app**, set **Who has access** to **Anyone**, and click **Deploy**. Allow the permissions.
4. Copy the web app URL (it ends in `/exec`).
5. In `quiz/index.html`, paste the URL into `LEAD_ENDPOINT` near the top of the script:
   ```js
   LEAD_ENDPOINT: "https://script.google.com/macros/s/XXXX/exec",
   ```
6. Commit and push. Each new lead now shows up as a row in your Sheet.

Until a URL is set, leads are saved only in the visitor's browser. That's good for testing: open `quiz/#admin` to see them and copy them as CSV.

## Put it online

With GitHub Pages turned on for the repo, the quiz is at `https://<your-user>.github.io/<repo>/quiz/`.

Share it with tracking, for example:
- Facebook: `.../quiz/?utm_source=facebook&utm_campaign=celi-video`
- TikTok: `.../quiz/?utm_source=tiktok`

Put the link in your video captions and bio. End your videos with something like "Take the free 1-minute quiz to find out which account is right for you."

## Change the content

- **Questions and scoring:** `QUESTIONS` and `score()` in `index.html`
- **Result text:** `SUMMARY`, `reasons()` and `noteFor()`
- **Guide facts:** the `#guide` section of the HTML. Update the limits each January.

The page says it's general information, not advice. If you give advice for a living, add your name, licence and contact details to the footer.
