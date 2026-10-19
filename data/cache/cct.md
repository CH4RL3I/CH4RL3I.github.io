# cct — Claude Code tabs

**Keep a dozen Claude Code sessions organised by project, survive closed windows and reboots, and free the memory of the ones you're not using.**

If you run Claude Code in many terminal tabs you know the drill: a tab gets closed by accident and the session is gone from view, a reboot wipes the whole layout, and fifteen idle sessions quietly eat several GB of RAM. `cct` fixes that with three ideas:

1. **Every session lives in its own tmux session.** Closing a tab or the whole terminal ends nothing. `cct` brings it back.
2. **Sessions are grouped by project in one small TOML file.** `cct open work` opens one window with a tab per session, the way you left it.
3. **Idle sessions go to sleep.** After N hours idle (default 3), `cct sleep` stops Claude in that tab to free memory. The tab shows "asleep since 14:05 — ↵ wakes it", and Enter resumes the exact session with `claude --resume`.

```
$ cct ls

Shop
  Checkout rewrite                             running                  3f6c2a1e
  Flaky e2e tests                              asleep since 11:40       8a1d9e3b

Blog
  Launch post                                  waiting for ↵            c2b7e4a9
  SEO audit                                    off                      e91b44d0
```

<!-- TODO demo GIF: cct open → tabs appear → cct sleep → ↵ wakes a session -->

## Install

Needs **Python 3.11+** and **tmux**. `fzf` is optional (nicer picker). One file, standard library only.

```sh
curl -fsSL https://raw.githubusercontent.com/CH4RL3I/cct/main/install.sh | sh
cct init        # creates ~/.config/cct/sessions.toml
```

Or clone the repo and run `./install.sh`, or just copy `cct` anywhere on your `PATH`.

## Quick start

1. Add your projects to `~/.config/cct/sessions.toml` (see [examples/sessions.toml](examples/sessions.toml)):

   ```toml
   [shop]
   title = "Shop"
   dir = "~/code/shop"
   keywords = ["checkout", "stripe"]
   sessions = []
   ```

2. File the sessions you already have: `cct sort` looks at Claude sessions from the last 3 days and puts each one into the project whose folder it ran in, or whose keywords it mentions. It asks about anything unclear.
3. `cct open shop` — one window, one tab per session. Each tab waits for ↵ so a reboot doesn't start twenty Claude processes at once (`--now` skips the wait).
4. Start new work with `cct new shop "Refund flow"`, then `cct save` after the first message to add it to the list.
5. Optional: `cct sleep --install` runs the sleep check every 15 minutes.

## Commands

| Command | What it does |
|---|---|
| `cct` | Pick any session (fzf or a numbered menu) and attach to it here |
| `cct open [project …]` | Open projects. Ghostty on macOS: a window per project, a tab per session. Other terminals: sessions start in tmux and you attach to the first |
| `cct ls` | Every session: running / asleep / waiting for ↵ / off |
| `cct new <project> "Name"` | Start a new Claude session in the project folder |
| `cct save` | Add sessions started with `cct new` to the list (from then on they sleep and resume like the others) |
| `cct sort [--auto]` | File recent sessions into projects (`--auto`: only the unambiguous ones, never asks) |
| `cct title` | Set each session's Claude title to "Project · Name", so `/resume` lists them nicely |
| `cct split <side> <main> [right\|down\|left\|up]` | Show `<side>` as a split pane in `<main>`'s tab (Ghostty) |
| `cct stop <name\|id>` | End the tmux session. The conversation history stays; `cct` resumes it |
| `cct sleep [--hours N] [--dry-run]` | Put idle sessions to sleep. `--dry-run` shows the decision for each one |
| `cct sleep --install` | Schedule `cct sleep` every 15 min (launchd on macOS; prints a crontab line elsewhere) |

## How sleeping decides

A session is only put to sleep when **all** of these hold. Anything else keeps it awake, and `cct sleep --dry-run` tells you which rule did:

- it's an interactive Claude session (not an SDK or background agent),
- it runs inside a tmux session started by `cct`, so the tab has the ↵ loop to come back to,
- Claude reports it as `idle`, and has for at least N hours,
- the tmux session saw no output or input for N hours,
- its tab is not the one in front of you (Ghostty on macOS; if cct can't tell which tab is in front, it keeps them all),
- Claude has no running shell child, i.e. no command from its Bash tool is still running (MCP servers don't count).

That last rule is a heuristic: a background job that replaced its shell with another program (`exec python worker.py`) isn't detected. Use `--dry-run` and a longer `--hours` if you rely on long silent jobs.

Sleeping sends `SIGTERM` to the Claude process only after checking that the pid still belongs to the same Claude process (command and start time). The transcript is already on disk; `claude --resume <id>` continues it.

## Configuration

```toml
[settings]
claude = "claude"            # the command that starts Claude
interactive_shell = false    # true if `claude` is a shell function or alias from your rc file
terminal = "auto"            # auto (Ghostty on macOS if installed, else tmux) | ghostty | tmux
sleep_hours = 3

[project-key]
title = "Shown name"
dir = "~/path/to/project"
keywords = ["words", "that", "identify", "it"]
sessions = [
  ["Session name", "session-uuid"],
  ["Started elsewhere", "session-uuid", "~/other/folder"],   # --resume needs the original folder
]
splits = [["Main session", "Side session", "right"]]
```

- `CCT_CONFIG` points at a different config file.
- State (sleep markers, log) lives in `~/.local/state/cct`.
- Want a wrapper, e.g. one that switches accounts first? Set `claude = "mywrapper"` and `interactive_shell = true` if it's a shell function.

## What cct reads

`cct` never talks to the network. It reads what Claude Code already writes locally:

- `~/.claude/sessions/<pid>.json` — which sessions are running and whether they're idle,
- `~/.claude/projects/*/<session-id>.jsonl` — transcripts, for `cct sort` (folder, title, first messages) and `cct title` (it appends one `custom-title` line).

`CLAUDE_CONFIG_DIR` and extra `~/.claude-*` profiles are picked up too. Since these are Claude Code internals, a future Claude Code release could change them; cct then treats sessions as not running and never puts them to sleep rather than guessing.

## Limitations

- Window and tab layout needs **Ghostty on macOS** (AppleScript). Everywhere else you get the tmux part: sessions survive, `cct` switches between them, sleeping works. PRs for iTerm2, kitty or WezTerm are welcome.
- One tmux session per Claude session, so tmux's own key bindings still apply (`prefix + s` lists them all).
- Tested on macOS with zsh. Linux should work; please open an issue if it doesn't.

## Development

```sh
python3 -m unittest discover -s tests -v
```

The tests cover the pure logic (sleep decisions, project matching, config round-trip, Ghostty script) and need neither tmux nor Claude.

## License

MIT
