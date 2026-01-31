# Troubleshooting

**Built by Praise Masunga (PraiseTechzw)**

---

## Autopilot won’t start

- Ensure you are inside a git repository
- Run `autopilot doctor`
- Remove stale PID if needed: delete `.autopilot.pid`

---

## It won’t commit

Common reasons:
- You are on a blocked branch (`blockBranches`)
- Remote is ahead (pull first)
- `requireChecks` is enabled and a check failed
- No changes detected by git

---

## It won’t push

- Verify `autoPush` is true
- Check your `origin` remote and authentication
- Ensure you have access to the remote

---

## Logs

- `autopilot.log` is created in the repo root
- `autopilot status` shows the last log line

---

**Built by Praise Masunga (PraiseTechzw)**
