# Assumptions

The brief leaves some gaps. Each row below is a gap, the assumption made, and why. Rows 1-14 were decided up front. Rows 15-18 are extra gaps found while building. Rows 19-25 record later changes the owner asked for, which replace some of the original decisions.

| # | Gap | Assumption | Reason |
| --- | --- | --- | --- |
| 1 | Who can see a task? | Tasks are private to the user who created them. | A personal task list; simplest safe default. |
| 2 | Which fields does a task have? | Title, optional description, status, created and updated time. No due date or priority. | Keeps scope small, as the brief asks. |
| 3 | What is the first status? | New tasks start as Planned. | Natural starting point. |
| 4 | Are status changes restricted? | Any status can change to any other status. | Simplest rule; avoids a workflow engine. |
| 5 | Can tasks be deleted? | Yes. **Changed:** instead of a confirmation step there is an Undo for 5 seconds (row 23). | Lets people remove mistakes. |
| 6 | Can a title be edited? | No. Listed as a known limitation. | Out of scope; delete and re-add instead. |
| 7 | Can users sign out? | Yes. | Needed on shared computers. |
| 8 | Login method? | **Changed:** Google or email and password (see rows 19-21). It was Google only at first. | The owner asked for email and password accounts alongside Google. |
| 9 | List order and filters? | Newest first, with status tabs and counts. | Matches the brief. |
| 10 | Session length? | 7 days or until sign-out. | Balance of convenience and safety. |
| 11 | Loading, empty and error states? | Shown explicitly. | People should never see a blank or frozen screen. |
| 12 | Pagination? | None; intended for up to a few hundred tasks per user. | Out of scope; counts are computed in the browser. |
| 13 | Devices? | Works on phone and desktop browsers (down to 360px). | Brief requirement. |
| 14 | Account deletion or data export? | Not provided. | Out of scope. |
| 15 | How is deletion confirmed? | *Replaced by row 23.* It first used an inline "Delete permanently? Yes / Cancel" instead of a browser pop-up. | Accessible and testable. *(added)* |
| 16 | What status code for a non-JSON write request? | 415 Unsupported Media Type, in the same JSON error shape. | It is the correct code for the wrong content type and part of the CSRF protection. *(added)* |
| 17 | Are leading and trailing spaces kept in descriptions? | Both title and description are trimmed; the length limits apply after trimming. | Consistent handling and no accidental blank entries. *(added)* |
| 18 | What if a person's Google email or name changes? | They are matched by Google's permanent `sub`; email, name and picture are refreshed at each sign-in. | The brief says to identify users by `sub`, not email. *(added)* |
| 19 | What are the password rules? | 8 to 128 characters, never trimmed, no composition rules, and not equal to the email. Names are 1 to 80 characters. | Length is what matters most for strength; trimming would silently change what people typed. *(owner request)* |
| 20 | What happens when Google and a password account share an email? | They are linked by email, and the password is removed. | Nobody verified the email when the password was set, so anyone could have registered someone else's email first. Google proves ownership. *(owner request)* |
| 21 | How are repeated wrong passwords handled? | After 5 failures for one email in 15 minutes the server answers 429, even for the right password, until the oldest failures age out. The counter is in memory, per process. | Simple protection against guessing without new infrastructure. The side effect is that someone can lock a victim's password login for a while; a shared store would be the production answer. *(owner request)* |
| 22 | Is there email verification or password reset? | No. A forgotten password cannot be recovered. | Needs an email service, which is out of scope. *(owner request)* |
| 23 | How does delete work now? | The task disappears at once and an Undo message shows for 5 seconds. The real delete is sent when the time is up, or when the person signs out. Closing the tab inside the 5 seconds keeps the task. | Faster than a confirmation and still protects against mistakes. *(owner request)* |
| 24 | What else was added to the interface? | Board and list views, drag and drop between columns (with keyboard and screen reader support), search, keyboard shortcuts (N and /), a collapsible sidebar and a progress ring. | The owner asked for a redesigned, more interactive task manager. These were not in the original brief. *(owner request)* |
| 25 | Is a title still not editable? | Yes. The API only allows changing the status, so the interface has no edit form. | Kept as a known limitation. |
