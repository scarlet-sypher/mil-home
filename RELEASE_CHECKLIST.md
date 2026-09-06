# MIL-HOME Release Checklist

Manual verification procedure for a real Windows 10/11 machine or VM. Everything here
covers what CI (`.github/workflows/build-installer.yml`) structurally cannot check —
CI proves the installer compiles, installs silently, and that the launcher's
service-start/ready-wait/heartbeat-teardown logic works on a single throwaway runner.
It cannot prove: a real install wizard UI completing, a second machine with its own
pre-existing Node/Postgres, an actual browser window opening, or a human logging in
and clicking through the app. Run this before shipping any build to real users.

No new app code lives behind this file — it is documentation only.

## 0. Prerequisites

- Download `mil-home-setup.exe` from the artifacts of a green `build-installer` run
  (GitHub Actions -> that workflow run -> Artifacts -> `mil-home-setup`).
- **VM A ("clean machine")**: a genuinely blank Windows 10/11 install. No Node, no
  PostgreSQL, nothing under `C:\Program Files\nodejs` or `C:\Program Files\PostgreSQL`.
- **VM B ("pre-existing software")**: Windows 10/11 with its own Node.js already
  installed (ideally a version >= 18.18 so this run also proves the "skip, don't
  reinstall" path — see the note in step 2 if you want to test the "version too old,
  do install" path too) and its own separate PostgreSQL instance already installed and
  running as a Windows service on the default port (5432), completely unrelated to
  MIL-HOME. Before installing MIL-HOME on this VM, note that service's name (whatever
  the standalone PostgreSQL installer assigned, e.g. `postgresql-x64-16`) and create a
  throwaway marker so you can later prove it survived untouched:
  ```
  psql -U postgres -c "CREATE TABLE canary(id int); INSERT INTO canary VALUES (1);"
  ```

## 1. Clean-machine install pass (VM A)

1. Copy `mil-home-setup.exe` to VM A and double-click it (no terminal, no flags).
2. Confirm the install wizard runs to completion with no errors and no prompts you
   didn't expect (it should ask for admin elevation once, via UAC, and nothing else).
3. Once it finishes, with **zero manual terminal use**, confirm:
   - `node --version` on a Command Prompt shows a version (Node got installed) — this
     is the one check where opening a terminal is fine, since it's *verifying* the
     install did its job silently, not doing the job for it.
   - Services (`services.msc`) shows **`mil-home-postgresql`**, status Running.
   - `C:\Program Files\MIL-HOME\` exists and contains `.env`, `launcher\`, and the
     built app files.

**Pass:** wizard completes silently, Node present, `mil-home-postgresql` running, all
without you typing a single install/config command yourself.

## 2. Pre-existing-software pass (VM B)

1. Run `mil-home-setup.exe` on VM B, same as step 1.
2. Confirm the installer **did not reinstall Node** — the pre-existing Node install's
   version/location is unchanged (check its install timestamp, or `node --version`
   still reports the same version from before).
   - *(Optional deeper test: repeat this whole VM B pass on a fresh clone of VM B whose
     pre-existing Node is below 18.18, and confirm the installer* does *silently
     install its own bundled Node in that case, without disturbing anything else.)*
3. Confirm the **pre-existing Postgres service is completely untouched**: still
   running, same service name, same port (5432), and the canary row from step 0 is
   still there (`psql -U postgres -c "SELECT * FROM canary;"`).
4. Confirm MIL-HOME's own service, **`mil-home-postgresql`**, is also running,
   registered as its own distinct service, and — since 5432 was already taken by the
   pre-existing instance and MIL-HOME's own default (5433) may or may not also be free
   on this VM — check `C:\Program Files\MIL-HOME\.env`'s `DATABASE_URL` for whichever
   port `Find-FreePort.ps1` actually resolved to, and confirm nothing else on the
   machine is using that port.

**Pass:** installer skips Node reinstall (adequate version case), never touches the
pre-existing Postgres instance or its data, and MIL-HOME's own instance comes up
cleanly alongside both on its own resolved port.

## 3. First-run flow

1. On either VM, double-click the **MIL-HOME** desktop shortcut.
2. Confirm the default browser actually opens (this is the one visual step CI cannot
   cover — CI has no browser UI session to observe) to the MIL-HOME login page, within
   a few seconds of the double-click.

**Pass:** browser opens on its own, login page renders.

## 4. Admin bootstrap

1. Log in with the bootstrap admin account: `admin@milhome.local` /
   `Bharat#Veer_91`.
2. Confirm you're forced to `/setup` rather than landing on `/home` directly — this
   account has both `mustChangePassword` and `mustChangeEmail` set until setup
   completes.
3. On the "Complete Admin Setup" form: you may keep the pre-filled username/email or
   change them, but you must set a **new password different from the bootstrap one**,
   satisfying all five rules shown on the form (10+ characters, one uppercase, one
   lowercase, one number, one symbol). Click **Complete Setup**.
4. Confirm you land on `/home`.
5. Open the **Audit Log** nav item and confirm an entry with action
   **`ADMIN_SETUP_COMPLETE`** now appears (alongside the earlier `ADMIN_BOOTSTRAP` and
   `LOGIN` entries from server startup and your login).

**Pass:** forced `/setup` redirect, setup form accepts a valid new password, lands on
`/home`, `ADMIN_SETUP_COMPLETE` visible in the Audit Log.

## 5. Ongoing admin option

1. While still logged in as this admin, open the profile menu (top-right user icon).
2. Confirm **"Change Email & Password"** appears above a divider, above **Logout**.
3. Log out, sign up for or log in as a normal (non-admin) user account.
4. Open that account's profile menu and confirm **"Change Email & Password" does not
   appear** — only Logout.

**Pass:** the option is visible for the admin account only.

## 6. Close-and-reopen cycle

1. With MIL-HOME open in the browser (as the now-reconfigured admin), close the
   browser tab (or the whole browser window).
2. Watch Task Manager's Details tab. Confirm a **`node.exe`** process that was present
   right after the tab was open actually exits within **~15-20 seconds** (the launcher
   waits for ~13 seconds of missed heartbeats before killing it).
3. Confirm **`mil-home-postgresql`** in `services.msc` is still Running the entire
   time — Postgres is a steady-state service and is never stopped by this cycle.
4. Double-click the desktop shortcut again. Confirm the app comes back up cleanly and
   the login page accepts the **new** credentials you set in step 4 (the old bootstrap
   password should no longer work).

**Pass:** `node.exe` reliably exits after the tab closes, Postgres never stops, a
fresh launch works and honors the changed credentials.

## 7. Double-click-while-running

1. With MIL-HOME already open and running, double-click the desktop shortcut again.
2. Confirm this opens a **second browser tab** pointed at the same running instance —
   it must not start a second Node process, must not error, and must not show any
   "port already in use" failure.

**Pass:** second double-click is a no-op beyond opening another tab.

## 8. Uninstall pass

1. On VM A: run the uninstaller (Windows Settings -> Apps, or `unins*.exe` directly in
   the install folder). Confirm **`mil-home-postgresql`** is gone from Services,
   `C:\ProgramData\MIL-HOME` no longer exists, and **`C:\Program Files\MIL-HOME` itself
   is gone too** — give it a few seconds first (Inno's uninstaller can't delete its own
   running exe directly, so it finishes removing the folder via a short-lived helper
   process after it exits).
2. On **VM B** — this is the one that actually matters most for this step — run the
   uninstaller there too, then confirm:
   - `mil-home-postgresql`, its data directory, and the install directory are all gone,
     same as VM A.
   - The **pre-existing, unrelated Postgres instance is completely untouched**: still
     running, same service, and the canary row from step 0 is still readable
     (`psql -U postgres -c "SELECT * FROM canary;"`).
3. **If this VM's Node was installed by MIL-HOME itself** (not pre-existing), be aware:
   the uninstaller does not remove Node. This is a known, deliberate gap, not a bug —
   removing a shared runtime another program might since have started depending on
   would be worse than leaving it. Not something this checklist fails on.

**Pass:** uninstall removes the service, its dedicated data, and the entire install
directory (no leftover `.env` or `.runtime` files) on both machines, leaving VM B's
independent Postgres instance exactly as it was.

---

## Result log

Fill in per release candidate:

| Step | VM A | VM B | Notes |
|---|---|---|---|
| 1. Clean-machine install | | n/a | |
| 2. Pre-existing-software install | n/a | | |
| 3. First-run flow | | | |
| 4. Admin bootstrap | | | |
| 5. Ongoing admin option | | | |
| 6. Close-and-reopen cycle | | | |
| 7. Double-click-while-running | | | |
| 8. Uninstall | | | |
