# Working rules for Claude Code (diff-tests)

Report conventions are in cc-reports' `CLAUDE.md`. Reports for this
repository go there, never into this repository.

## Git

- Before every git command, run `git rev-parse --show-toplevel`. Stop if the
  path does not end in `diff-tests`.
- Never commit `next-env.d.ts`. `npm run build` rewrites it; run
  `git restore next-env.d.ts` before committing.
- Work on a branch, never directly on `main`.

## GitHub CLI

- `gh` is the single program `~/gh-cli` (not on `PATH`, not a folder).
- The Mac has two sign-ins:
  - the shell's `GH_TOKEN`, which is limited to chosen repositories;
  - the stored sign-in in `~/.config/gh` (macOS keychain).
- Use the stored sign-in: put `env -u GH_TOKEN` before every `gh` command.
  Read-only check:
  `env -u GH_TOKEN ~/gh-cli api repos/adriatic/diff-tests --jq .full_name`
- Open a pull request (after pushing the branch):
  `env -u GH_TOKEN ~/gh-cli pr create --base main --head <branch> --title "..." --body "..."`
- Merge only after Nik confirms:
  `env -u GH_TOKEN ~/gh-cli pr merge <number> --merge`

## Safety

- Never type, print or ask for a token, key or password. Don't run
  `gh auth token`, don't use `--show-token`, and don't echo `GH_TOKEN`.
- Never open key or environment files; refer to them by name only.
- Don't merge until Nik confirms.

## Writing about people

- Use "Nik", or they/them, for Nik. Don't infer pronouns from a name.
