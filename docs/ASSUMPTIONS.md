# Assumptions

The brief leaves some gaps. Each row below is a gap, the assumption made, and why. Rows 1-14 were decided up front. Rows 15-18 are extra gaps found while building.

| # | Gap | Assumption | Reason |
| --- | --- | --- | --- |
| 1 | Who can see a task? | Tasks are private to the user who created them. | A personal task list; simplest safe default. |
| 2 | Which fields does a task have? | Title, optional description, status, created and updated time. No due date or priority. | Keeps scope small, as the brief asks. |
| 3 | What is the first status? | New tasks start as Planned. | Natural starting point. |
| 4 | Are status changes restricted? | Any status can change to any other status. | Simplest rule; avoids a workflow engine. |
| 5 | Can tasks be deleted? | Yes, after a confirmation step. | Lets people remove mistakes. |
| 6 | Can a title be edited? | No. Listed as a known limitation. | Out of scope; delete and re-add instead. |
| 7 | Can users sign out? | Yes. | Needed on shared computers. |
| 8 | Login method? | Google only. | Brief requires it; no passwords to store. |
| 9 | List order and filters? | Newest first, with status tabs and counts. | Matches the brief. |
| 10 | Session length? | 7 days or until sign-out. | Balance of convenience and safety. |
| 11 | Loading, empty and error states? | Shown explicitly. | People should never see a blank or frozen screen. |
| 12 | Pagination? | None; intended for up to a few hundred tasks per user. | Out of scope; counts are computed in the browser. |
| 13 | Devices? | Works on phone and desktop browsers (down to 360px). | Brief requirement. |
| 14 | Account deletion or data export? | Not provided. | Out of scope. |
| 15 | How is deletion confirmed? | An inline "Delete permanently? Yes, delete / Cancel" on the task instead of a browser pop-up. | Accessible, styleable and testable. *(added)* |
| 16 | What status code for a non-JSON write request? | 415 Unsupported Media Type, in the same JSON error shape. | It is the correct code for the wrong content type and part of the CSRF protection. *(added)* |
| 17 | Are leading and trailing spaces kept in descriptions? | Both title and description are trimmed; the length limits apply after trimming. | Consistent handling and no accidental blank entries. *(added)* |
| 18 | What if a person's Google email or name changes? | They are matched by Google's permanent `sub`; email, name and picture are refreshed at each sign-in. | The brief says to identify users by `sub`, not email. *(added)* |
