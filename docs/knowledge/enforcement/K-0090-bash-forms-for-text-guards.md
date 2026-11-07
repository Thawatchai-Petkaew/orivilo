---
id: K-0090
topic: enforcement
claim: The GNU Bash Reference Manual (Edition 5.3, 18 May 2025), git(1) of git 2.56.0 and the GNU coreutils 9.11 env and nohup pages name the forms that decide which words a bash command writes to and which checkout a git command acts in (control operators and reserved words; assignment, builtin, command, env, exec and nohup prefixes; redirection operators and their target words; quoting and the expansions it stops; cd, pushd and popd targets; git global options), and this entry classes each form as fixed by the command text, holding a visible unknown part, resting on state from before the call, or a named bypass that runs text the reader never sees as a word; it also lists, from the zsh 5.9.2 manual, the Bash manual and POSIX.1-2024, where a one-pass reader's comment, quote, here-document and substitution state can part from what non-interactive zsh and bash run, and, from Linux and macOS man pages, the option grammar of programs that run their remaining words as a command.
source: "https://www.gnu.org/software/bash/manual/bash.html (Edition 5.3; re-read there: sections 2, 3.1.2.3, 3.1.2.4, 3.1.3, 3.2.1, 3.2.4, 3.4, 3.5.3, 3.5.4, 3.5.6, 3.6, 3.6.6, 3.6.7, 4.1 cd eval exec, 4.2 builtin command); https://www.gnu.org/software/bash/manual/html_node/Redirections.html (3.6.6, re-read for section 10); https://www.gnu.org/software/bash/manual/html_node/Shell-Arithmetic.html (6.5); https://tiswww.case.edu/php/chet/bash/bashref.html (the same edition, the maintainer's copy; read there: sections 2, 3.1.1 to 3.1.3, 3.2.1 to 3.2.6, 3.3, 3.5 to 3.5.9, 3.6 to 3.6.10, 3.7.1, 3.7.2, 3.7.4, 4.1, 4.2, 4.3.1, 4.3.2, 5.1, 5.2, 6.1, 6.3.1, 6.6, 6.8.1); https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html (POSIX.1-2024 XCU 2.3, 2.6.3, 2.7.4); https://zsh.sourceforge.io/Doc/Release/The-Z-Shell-Manual.html; https://zsh.sourceforge.io/Doc/Release/Shell-Grammar.html; https://zsh.sourceforge.io/Doc/Release/Redirection.html; https://zsh.sourceforge.io/Doc/Release/Options.html; https://zsh.sourceforge.io/Doc/Release/Parameters.html; https://zsh.sourceforge.io/Doc/Release/Expansion.html; https://zsh.sourceforge.io/Doc/Release/Arithmetic-Evaluation.html; https://zsh.sourceforge.io/Doc/Release/Conditional-Expressions.html; https://git-scm.com/docs/git (SYNOPSIS, OPTIONS, GIT COMMANDS, ENVIRONMENT VARIABLES); https://man7.org/linux/man-pages/man1/env.1.html; https://man7.org/linux/man-pages/man1/nohup.1.html; https://man7.org/linux/man-pages/man1/timeout.1.html; https://man7.org/linux/man-pages/man1/xargs.1.html; https://man7.org/linux/man-pages/man1/nice.1.html; https://man7.org/linux/man-pages/man1/time.1.html; https://man7.org/linux/man-pages/man1/stdbuf.1.html; https://man7.org/linux/man-pages/man1/ionice.1.html; https://man7.org/linux/man-pages/man1/setsid.1.html; https://man7.org/linux/man-pages/man1/chrt.1.html; https://man7.org/linux/man-pages/man1/taskset.1.html; https://man7.org/linux/man-pages/man1/flock.1.html; https://man7.org/linux/man-pages/man1/script.1.html; https://man7.org/linux/man-pages/man1/watch.1.html; https://man7.org/linux/man-pages/man1/chroot.1.html; https://man7.org/linux/man-pages/man1/prlimit.1.html; https://www.sudo.ws/docs/man/sudo.man/; https://man.openbsd.org/doas.1; https://manpages.debian.org/unstable/moreutils/chronic.1.en.html; https://manpages.debian.org/unstable/expect/unbuffer.1.en.html; https://www.gnu.org/software/parallel/parallel.html; https://keith.github.io/xcode-man-pages/; https://keith.github.io/xcode-man-pages/caffeinate.8.html; https://keith.github.io/xcode-man-pages/time.1.html; https://keith.github.io/xcode-man-pages/script.1.html; https://keith.github.io/xcode-man-pages/env.1.html; https://keith.github.io/xcode-man-pages/xargs.1.html; https://keith.github.io/xcode-man-pages/nice.1.html; https://keith.github.io/xcode-man-pages/lockf.1.html; https://keith.github.io/xcode-man-pages/timeout.1.html; https://keith.github.io/xcode-man-pages/stdbuf.1.html; https://keith.github.io/xcode-man-pages/xcrun.1.html; https://keith.github.io/xcode-man-pages/arch.1.html; https://keith.github.io/xcode-man-pages/sandbox-exec.1.html; https://keith.github.io/xcode-man-pages/nohup.1.html; https://pnpm.io/cli/exec; https://docs.npmjs.com/cli/v11/commands/npx"
retrieved: 2026-10-29
confidence: 0.8
applies_to: [ORV-138, ORV-96, ORV-130]
license: link-only
---

## Evidence

The Bash manual is the primary source. Both copies open with the same line: "This is Edition 5.3, last updated 18 May 2025, of The GNU Bash Reference Manual, for `Bash`, Version 5.3." On 2026-10-29 gnu.org answered most requests with HTTP 429, so most sections were read on the maintainer's copy at tiswww.case.edu; the sections listed under the gnu.org URL in `source:` were then read again on gnu.org and matched. Section numbers are this edition's (3.2.1 is Reserved Words here). git(1) is the page for git 2.56.0 (its changelog entry dated 2026-09-28); the man7.org pages are from GNU coreutils 9.11 (footer "April 2026") and GNU findutils (xargs, footer "2024-06-03").

Sections 10 and 11 were added on 2026-10-29 for task ORV-138-research-3 from pages fetched in that task. The zsh manual's title page reads "Zsh version 5.9.2, released on July 12, 2026." POSIX is "The Open Group Base Specifications Issue 8 / IEEE Std 1003.1-2024", Shell Command Language chapter. The Linux runner pages come from man7.org (coreutils 9.11, util-linux 2.43.devel, man-pages 6.19, procps-ng, findutils), sudo from sudo.ws, doas from man.openbsd.org (OpenBSD-current), chronic and unbuffer from manpages.debian.org (moreutils 0.70, expect 5.45.4), GNU parallel from gnu.org (20261022), pnpm exec from pnpm.io and npx from docs.npmjs.com (v11). The macOS pages were read on keith.github.io, whose index is titled "Xcode's man pages" with the header "Xcode 27.2 RC 1 (27B48)"; it is not Apple's own site, no Apple-hosted copy was searched, and each page row names the date and OS line the page shows. Whether each program is installed on a given machine was not checked.

Confidence is 0.8: each document is one publisher's, and two copies of one manual are not independent sources. Every page was read through a fetch tool that returns quotes of at most about 120 characters, so a longer sentence below is joined from consecutive pieces it returned, and a sentence that ends in mid-clause was cut there by the tool. No page was opened byte by byte. No license text was read for these pages; quotes are kept short and the entry links to each source.

NL in an example marks a newline inside a one-line example.

### How each form is classed (our own reading, not the sources')

- **M, fixed by the text.** The word a command writes to, or the checkout a git command acts in, is in the command text. A reader finds it by tracking quotes, operators and command position from left to right, with a stack for nested `$( )`, backquotes and `( )`.
- **U, a visible unknown part.** The word holds an expansion (3.5) whose value is not in the text: a parameter, a command substitution's output, the files a pattern matches. A reader can see where the unknown part starts, not what it becomes.
- **S, state from before the call.** The value comes from the shell's state when the call starts (the working directory, `HOME`, `OLDPWD`, `CDPATH`, the directory stack, exported variables, shell options, git config), not from the text.
- **B, a named bypass.** The shell or a program runs text that is never a word of this command: `eval`, `sh -c`, an interpreter, `source`, an alias, a function defined earlier, a variable or substitution at command position, `xargs`, `env -S`, a git alias.

Whether a guard models a form, marks it unknown, or names it as a bypass is not decided here.

### 1. Words, operators and command position (sections 2, 3.1.1, 3.1.3, 3.2)

- Section 2, metacharacter: "A character that, when unquoted, separates words." "A metacharacter is a space, tab, newline, or one of the following characters: ‘|’, ‘&’, ‘;’, ‘(’, ‘)’, ‘<’, or ‘>’."
- Section 2, control operator: "A token that performs a control function. It is a newline or one of the following: ‘||’, ‘&&’, ‘&’, ‘;’, ‘;;’," "‘;&’, ‘;;&’, ‘|’, ‘|&’, ‘(’, or ‘)’."
- 3.1.1, the order of work: "Breaks the input into words and operators, obeying the quoting rules described in Quoting." Then "This step performs alias expansion (see Aliases).", "Parses the tokens into simple and compound commands", "Performs the various shell expansions", "Performs any necessary redirections", "Executes the command (see Executing Commands)."
- 3.2.1: "The following words are recognized as reserved when unquoted and the first word of a command (see below for exceptions):" The list: `if then elif else fi time for in until while do done case esac coproc select function { } [[ ]] !`. "`in` and `do` are recognized as reserved words if they are the third word in a `for` command."
- 3.2.2: "It’s just a sequence of words separated by blanks, terminated by one of the shell’s control operators (see Definitions)."
- 3.2.3: "[time [-p]] [!] command1 [ | or |& command2 ] ..."; "If ‘|&’ is the pipeline operator, command1’s standard error, in addition to its standard output, is connected"; "Each command in a multi-command pipeline, where pipes are created, is executed in its own subshell,".
- 3.2.4: "A list is a sequence of one or more pipelines separated by one of the operators ‘;’, ‘&’, ‘&&’, or ‘||’," "and optionally terminated by one of ‘;’, ‘&’, or a newline." "If a command is terminated by the control operator ‘&’, the shell executes the command asynchronously in a subshell." "A sequence of one or more newlines may appear in a list to delimit commands, equivalent to a semicolon."
- 3.2.5: "Each construct begins with a reserved word or control operator" "and is terminated by a corresponding reserved word or operator." "Any redirections (see Redirections) associated with a compound command apply to all commands" "within that compound command unless explicitly overridden."
- 3.2.5.3: "( list )" and "{ list; }"; "Placing a list of commands between parentheses forces the shell to create a subshell"; "Placing a list of commands between curly braces causes the list to be executed in the current shell environment."; "The braces are reserved words, so they must be separated from the list by blanks or other shell metacharacters."
- 3.2.6: "coproc [NAME] command [redirections]".
- 3.1.3: "a word beginning with ‘#’ introduces a comment." "The comment causes that word and all remaining characters on that line to be ignored." This holds "In a non-interactive shell, or an interactive shell in which the interactive_comments option to the shopt builtin is enabled".
- 3.1.2.1: "If a \newline pair appears, and the backslash itself is not quoted, the \newline is treated as a line continuation" "(that is, it is removed from the input stream and effectively ignored)."

<!-- prettier-ignore -->
| Form | Example | Section | Reader |
| --- | --- | --- | --- |
| `;` | `git status; git switch x` | 2, 3.2.4 | M |
| `&` | `true & git switch x` | 2, 3.2.4 | M |
| `&&`, `\|\|` | `cd x && rm y`, `false \|\| rm y` | 2, 3.2.4 | M |
| `\|`, `\|&` | `pnpm test 2>&1 \| tee log`, `make \|& tee log` | 2, 3.2.3 | M; each side is its own command |
| newline | `git status` NL `git switch x` | 2, 3.2.4 | M |
| `( )` | `(git switch x)` | 2, 3.2.5.3 | M |
| `{ }` | `{ git switch x; }` | 3.2.1, 3.2.5.3 | M; a brace is reserved only as its own word in command position |
| `case`, `in`, `esac`, `;;`, `;&`, `;;&` | `case a in a) git switch x;; esac` | 2, 3.2.1, 3.2.5.2 | M |
| `if`, `then`, `elif`, `else`, `fi` | `if true; then git switch x; fi` | 3.2.1, 3.2.5.2 | M |
| `while`, `until`, `do`, `done` | `while false; do :; done; git switch x` | 3.2.1, 3.2.5.1 | M |
| `for`, `in`, `do`, `done` | `for f in a b; do printf x > "$f"; done` | 3.2.1, 3.2.5.1 | M for the words; the target `"$f"` is U |
| `select`, `function`, `[[ ]]`, `(( ))` | `function f { git switch x; }` | 3.2.1, 3.2.5.2, 3.3 | M for the text; calling `f` later is B (section 8) |
| `coproc` | `coproc git switch x` | 3.2.1, 3.2.6 | M; the synopsis alone does not say when the first word is NAME (rule not read) |
| `!` | `! git switch x` | 3.2.1, 3.2.3 | M |
| `time [-p]` | `time -p git switch x` | 3.2.1, 3.2.3 | M |
| `#` comment | `git status # ; git switch x` | 3.1.3 | M; nothing after the `#` word runs |
| `\` newline | `git \` NL `switch x` | 3.1.2.1 | M |
| compound command with redirect | `for f in a; do echo; done > out` | 3.2.5 | M |

### 2. Simple command prefixes (3.4, 3.7, 4.1, 4.2, coreutils)

- 3.4: "A variable is assigned to using a statement of the form," `name=[value]`.
- 3.7.1: "The words that the parser has marked as variable assignments (those preceding the command name)" are saved; "If any words remain after expansion, the first word is taken to be the name of the command"; "The text after the ‘=’ in each variable assignment undergoes tilde expansion, parameter expansion" (with command substitution, arithmetic expansion and quote removal); "If no command name results, the variable assignments affect the current shell environment."
- 3.7.2: "If the name does not match a function, the shell searches for it in the list of shell builtins." and "Bash searches each element of `$PATH` for a directory containing an executable file by that name."
- 3.7.4: "the variable assignments are part of that command’s environment for as long as it executes."
- 4.2 builtin: "Execute the specified shell builtin shell-builtin, passing it args, and return its exit status."
- 4.2 command: synopsis `command [-pVv] command [arguments ...]`; "The `command` builtin runs command with arguments ignoring any shell function named command." "Only shell builtin commands or commands found by searching the `PATH` are executed." "The -p option means to use a default value for PATH that is guaranteed to find all of the standard utilities."
- 4.1 exec: synopsis `exec [-cl] [-a name] [command [arguments]]`; "If command is supplied, it replaces the shell without creating a new process." "If command is not specified, redirections may be used to affect the current shell environment."
- env(1): "env [OPTION]... [-] [NAME=VALUE]... [COMMAND [ARG]...]"; "Set each NAME to VALUE in the environment and run COMMAND." Options: `-a, --argv0=ARG`, `-i, --ignore-environment`, `-0, --null`, `-u, --unset=NAME`, `-C, --chdir=DIR` ("change working directory to DIR"), `-S, --split-string=S` ("process and split S into separate arguments; used to pass multiple arguments on shebang lines"), `--block-signal[=SIG]`, `--default-signal[=SIG]`, `--ignore-signal[=SIG]`, `--list-signal-handling`, `-v, --debug`. "A mere - implies -i."
- nohup(1): "nohup COMMAND [ARG]..." and "nohup OPTION"; "Run COMMAND, ignoring hangup signals."; "If standard output is a terminal, append output to 'nohup.out' if possible, '$HOME/nohup.out' otherwise."
- timeout(1): "timeout [OPTION]... DURATION COMMAND [ARG]..."; "Start COMMAND, and kill it if still running after DURATION."

<!-- prettier-ignore -->
| Form | Example | Source | Reader |
| --- | --- | --- | --- |
| assignment prefix | `GIT_TRACE=0 git switch x`; `GIT_DIR=/x/.git git switch y` | 3.4, 3.7.1, 3.7.4 | M; `GIT_DIR` and `GIT_WORK_TREE` change the repository git acts on (section 7) |
| assignment with no command | `D=.oriv; printf x > ${D}ilo/a` | 3.7.1 | the value is in the same call's text; `${D}` read alone is U; a value set in an earlier call is S |
| `builtin` | `builtin cd scripts` | 4.2 | M |
| `command [-pVv]` | `command git switch x`; `command cd .claude` | 4.2 | M; it skips a function of that name. `-v` and `-V` were not read |
| `env` with options and `NAME=VALUE` | `env -u X GIT_DIR=/y git switch x` | env(1) | M with the option list: `-u`, `-a` and `-C` take a value; a mere `-` is `-i` |
| `env -C DIR` | `env -C ../wt git switch x` | env(1) | M; COMMAND runs in DIR, so the checkout is DIR |
| `env -S S` | `env -S 'git switch x'` | env(1) | B; env splits the string itself |
| `exec` with a command | `exec git switch x` | 4.1 | M; skip `-c`, `-l`, `-a name` |
| `exec` with no command | `exec > out; echo x` | 4.1 | M; the redirect holds for the rest of the shell |
| `nohup` | `nohup git switch x` | nohup(1) | M; it may also write `nohup.out` (our reading: in the working directory) or `$HOME/nohup.out`, a target not in the text |
| `timeout DURATION` | `timeout 5 git switch x` | timeout(1) | M |
| `sudo` and other runners | `sudo -u x git switch y`; `nice git switch x` | section 11 | see section 11 for each runner's option grammar |

### 3. Redirection operators and their target words (3.6 to 3.6.10)

- 3.6: "The following redirection operators may precede or appear anywhere within a simple command or may follow a command." "Redirections are processed in the order they appear, from left to right." "Each redirection that may be preceded by a file descriptor number may instead be preceded by a word of the" "form {varname}."
- 3.6, the target word: "The word following the redirection operator in the following descriptions, unless otherwise noted, is" "subjected to brace expansion, tilde expansion, parameter and variable expansion, command substitution," "arithmetic expansion, quote removal, filename expansion, and word splitting." "If it expands to more than one word, Bash reports an error." Our reading: a pattern target that matches exactly one file writes that file.
- 3.6.2: "[n]>[|]word"; "If the redirection operator is ‘>|’, or the redirection operator is ‘>’ and the noclobber option to the set builtin is not enabled, Bash attempts the redirection even if the file named by word exists." 4.3.1 `-C`: "Prevent output redirection using ‘>’, ‘>&’, and ‘<>’ from overwriting existing files."
- 3.6.4: "&>word" and ">&word"; "Of the two forms, the first is preferred. This is semantically equivalent to" ">word 2>&1".
- 3.6.8: "It is a redirection error if the digits in word do not specify a file descriptor open for output." "If word evaluates to ‘-’, file descriptor n is closed." "As a special case, if n is omitted, and word does not expand to one or more digits or ‘-’," "this redirects the standard output and standard error as described previously."
- 3.6.10: "opens the file whose name is the expansion of word for both reading and writing on file descriptor n," "or on file descriptor 0 if n is not specified." "If the file does not exist, it is created."
- 3.6, special file names handled by bash: `/dev/fd/fd`, `/dev/stdin`, `/dev/stdout`, `/dev/stderr`, `/dev/tcp/host/port`, `/dev/udp/host/port`.
- 3.5.6: "<(list)" and ">(list)"; "The process list is run asynchronously, and its input or output appears as a filename." "Note that no space may appear between the `<` or `>` and the left parenthesis, otherwise the construct" "would be interpreted as a redirection."

<!-- prettier-ignore -->
| Operator | Example | Section | Writes a file named by its word | Reader |
| --- | --- | --- | --- | --- |
| `[n]>word` | `printf x > a`; `2>err cmd` | 3.6.2 | yes | M for a literal word; U when the word holds an expansion |
| `[n]>\|word` | `printf x >\| a` | 3.6.2 | yes, also under noclobber | as above |
| `[n]>>word` | `echo x >> log` | 3.6.3 | yes, appends | as above |
| `&>word`, `>&word` | `make &> log`; `make >& log` | 3.6.4, 3.6.8 | yes; `>&word` only when word is not digits or `-` | as above |
| `&>>word` | `make &>> log` | 3.6.5 | yes, appends | as above |
| `[n]<>word` | `exec 3<> f` | 3.6.10 | yes, created if missing | as above |
| `{varname}>word` | `exec {fd}> f` | 3.6 | yes | as above |
| `[n]<word` | `wc < a` | 3.6.1 | no | M |
| `[n]<&word`, `[n]>&word` with digits or `-` | `2>&1`; `3>&-` | 3.6.8 | no | M |
| `[n]<&digit-`, `[n]>&digit-` | `3>&1-` | 3.6.9 | no | M |
| `[n]<<word`, `[n]<<-word` | `cat <<'EOF'` | 3.6.6 | no; see the here document rule | M |
| `[n]<<< word` | `grep x <<< "$v"` | 3.6.7 | no | M |
| `>(list)`, `<(list)` | `tee >(cat > f)` | 3.5.6 | the list inside is its own command and may write | M with nesting |
| place in the command | `> a printf x`; `printf > a x` | 3.6 | | M; a redirect can stand before, inside or after the words |

**Here documents (3.6.6).** Format "[n]<<[−]word" (the dash as the fetch tool returned it). "This type of redirection instructs the shell to read input from the current source until it reads a line" "containing only delimiter (with no trailing blanks)." "The shell does not perform parameter and variable expansion, command substitution," "arithmetic expansion, or filename expansion on word." "If any part of word is quoted, the delimiter is the result of quote removal on word, and the lines" "in the here-document are not expanded." "If word is unquoted, delimiter is word itself, and the here-document text is treated similarly" "to a double-quoted string: all lines of the here-document are subjected to parameter expansion, command substitution, and arithmetic expansion,". With `<<-`, leading tab characters are stripped "from input lines" "and the line containing delimiter." Our reading: the body lines are not words of the command; with a quoted delimiter (`<<'EOF'`, `<<"EOF"`, `<<\EOF`, `<<E"O"F`) they are data, and with an unquoted delimiter a `$( )` or backquote in a body line runs a command (M to find, U for its output).

**Here strings (3.6.7).** "The word undergoes tilde expansion, parameter and variable expansion, command substitution," "arithmetic expansion, and quote removal." "Filename expansion and word splitting are not performed."

### 4. Quoting, and where `$` and a backquote open an expansion (3.1.2, 3.5.3 to 3.5.5, 3.5.9)

- 3.1.2.1: "A non-quoted backslash ‘\’ is the Bash escape character." "It preserves the literal value of the next character that follows, removing any special meaning it has," "with the exception of newline."
- 3.1.2.2: "Enclosing characters in single quotes (‘'’) preserves the literal value of each character within the quotes." "A single quote may not occur between single quotes, even when preceded by a backslash."
- 3.1.2.3: "Enclosing characters in double quotes (‘"’) preserves the literal value of all characters within the quotes," "with the exception of ‘$’, ‘`` ` ``’, ‘\’, and, when history expansion is enabled, ‘!’." "The characters ‘$’ and ‘`` ` ``’ retain their special meaning within double quotes (see Shell Expansions)." "The backslash retains its special meaning only when followed by one of the following characters:" "‘$’, ‘`` ` ``’, ‘"’, ‘\’, or newline."
- 3.1.2.4: "Character sequences of the form $'string' are treated as a special kind of single quotes." "The sequence expands to string, with backslash-escaped characters in string replaced as specified by the ANSI C standard"; the `\xHH` entry: "The eight-bit character whose value is the hexadecimal value HH (one or two hex digits)."
- 3.1.2.5: "Prefixing a double-quoted string with a dollar sign (‘$’), such as $"hello, world"," "causes the string to be translated according to the current locale."
- 3.5.3: "The ‘$’ character introduces parameter expansion, command substitution, or arithmetic expansion." "The basic form of parameter expansion is ${parameter}, which substitutes the value of parameter." "The parameter name or symbol to be expanded may be enclosed in braces, which are optional but serve to protect". Indirection: "If the first character of parameter is an exclamation point (!), and parameter is not a nameref," it "introduces a level of indirection."
- 3.5.4: the forms `$(command)` and `` `command` ``. "Bash performs command substitution by executing command in a subshell environment and replacing the" "command substitution with the standard output of the command, with any trailing newlines deleted." "When using the $(command) form, all characters between the parentheses make up the command; none are treated specially." "Command substitutions may be nested." "To nest when using the backquoted form, escape the inner backquotes with backslashes." In the backquoted form "backslash retains its literal meaning except when followed by ‘$’, ‘`` ` ``’, or ‘\’". A third form, written `${c command; }`: "The character c following the open brace must be a space, tab, newline, or ‘|’", and it "executes command in the current execution environment and captures its output, again with trailing newlines removed."
- 3.5.5: "$(( expression ))"; "Arithmetic expansion evaluates an arithmetic expression and substitutes the result."
- 3.5.7: "The shell scans the results of parameter expansion, command substitution, and arithmetic expansion" "that did not occur within double quotes for word splitting."
- 3.5.9: "After the preceding expansions, all unquoted occurrences of the characters ‘\’, ‘'’, and ‘"’" "that did not result from one of the above expansions are removed." Our reading: `"cd"`, `\cd` and `c""d` are each the command name `cd` after quote removal.

<!-- prettier-ignore -->
| Context | `$`, `$(`, `${`, `$((`, backquote | Example | Section |
| --- | --- | --- | --- |
| unquoted | open | `printf x > $D/a` | 3.5.3 |
| inside `"..."` | open | `printf x > "$(printf .oriv)ilo/a"` | 3.1.2.3 |
| inside `'...'` | closed | `echo '$(cat <<"EOF"'` | 3.1.2.2 |
| after an unquoted `\` | closed for the next character | `echo \$HOME` | 3.1.2.1 |
| inside `$'...'` | closed; escapes are decoded | `printf x > $'\x2eorivilo/a'` (our reading: `\x2e` is `.`) | 3.1.2.4 |
| inside `$"..."` | as double quotes, then translated | `$"text"` | 3.1.2.5 |
| inside `$( )` | a new command with its own quotes | `"$(echo 'a"b')"` | 3.5.4 |
| inside backquotes | open; `\` literal except before `$`, backquote, `\` | `` `printf .oriv` `` | 3.5.4 |
| here document body, delimiter quoted | closed | `cat <<'EOF'` NL `$(rm x)` NL `EOF` | 3.6.6 |
| here document body, delimiter unquoted | open | `cat <<EOF` NL `$(rm x)` NL `EOF` | 3.6.6 |
| here document delimiter word | closed | `cat <<$X` | 3.6.6 |
| here string word | open | `cat <<< "$(rm x)"` | 3.6.7 |
| assignment value | open | `D=$(printf .oriv)` | 3.7.1 |
| redirect target word | open, plus every other expansion | `> "${D}ilo/a"` | 3.6 |

Reader: finding where an expansion opens is M; its value is U. At command position (3.7.1, the first word after expansion is the command name) the value is a command the text does not show: B.

### 5. Tilde, brace and pathname expansion (3.5.1, 3.5.2, 3.5.8, 4.3)

- 3.5 order: "The order of expansions is: brace expansion; tilde expansion, parameter and variable expansion, arithmetic expansion," "and command substitution (done in a left-to-right fashion); word splitting; filename expansion; and quote removal." "Only brace expansion, word splitting, and filename expansion can increase the number of words."
- 3.5.1: "Patterns to be brace expanded are formed from an optional preamble, followed by either a series of comma-separated" "strings or a sequence expression between a pair of braces, followed by an optional postscript." "A correctly-formed brace expansion must contain unquoted opening and closing braces, and at least one unquoted comma" "or a valid sequence expression." "Brace expansion is performed before any other expansions, and any characters special to other expansions" (are kept). "To avoid conflicts with parameter expansion, the string ‘${’ is not considered eligible for brace expansion,".
- 3.5.2: "If a word begins with an unquoted tilde character (‘~’), all of the characters up to the first unquoted slash" (form the tilde-prefix). An empty login name gives "the value of the HOME shell variable"; "If the tilde-prefix is ‘~+’, the value of the shell variable PWD replaces the tilde-prefix."; "If the tilde-prefix is ‘~-’, the shell substitutes the value of the shell variable OLDPWD, if it is set."; a number N gives "the corresponding element from the directory stack,". "Bash checks each variable assignment for unquoted tilde-prefixes immediately following a ‘:’ or the first ‘=’," "and performs tilde expansion in these cases."
- 3.5.8: "After word splitting, unless the -f option has been set, Bash scans each word for the characters ‘`*`’, ‘`?`’, and ‘`[`’." "If one of these characters appears, and is not quoted, then the word is regarded as a pattern". 3.5.8.1: "If the extglob shell option is enabled using the shopt builtin," "the shell recognizes several extended pattern matching operators": `?(pattern-list)`, `*(pattern-list)`, `+(pattern-list)`, `@(pattern-list)`, `!(pattern-list)`.
- 4.3.1 `-f`: "Disable filename expansion (globbing)." 4.3.2: `nullglob` "expand to nothing and are removed, rather than expanding to themselves."; `failglob` "result in an expansion error."; `dotglob` "If set, Bash includes filenames beginning with a ‘.’ in the results of filename expansion." "The filenames . and .. must always be matched explicitly, even if `dotglob` is set."
- Where pathname expansion does not run: inside double quotes (3.1.2.3 keeps every other character literal), between `[[` and `]]` ("The words between the [[ and ]] do not undergo word splitting and filename expansion.", 3.2.5.2), on a here string (3.6.7), on a here document delimiter (3.6.6), and on an assignment value (3.7.1 lists no filename expansion for it).

<!-- prettier-ignore -->
| Expansion | Trigger | Stopped by | Example | Reader |
| --- | --- | --- | --- | --- |
| brace | unquoted `{` ... `}` with an unquoted comma or a sequence `{a..b}` | any quoting of the braces or comma; `${` | `printf x > .or{i,}vilo/a` | M; the words it makes are in the text (our reading of 3.5.1) |
| tilde | unquoted `~` at the start of a word, or after `=` or `:` in an assignment | quoting the `~` | `cd ~-`; `X=~/a` | S |
| pathname | unquoted `*`, `?`, `[`; with extglob also `?(` `*(` `+(` `@(` `!(` | quoting; `set -f`; the contexts listed above | `cd .oriv?lo/owner-approvals` | U (the matches depend on files) |

### 6. cd, pushd and popd (4.1, 5.1, 5.2, 6.8.1)

- 4.1 cd synopsis, as two forms: "cd [-L] [-@] [directory]" and "cd -P [-e] [-@] [directory]". "If directory is not supplied, the value of the `HOME` shell variable is used as directory." "If the shell variable `CDPATH` exists, and directory does not begin with a slash, `cd` uses it as a search path:" "A null directory name in CDPATH means the same thing as the current directory." "The -P option means not to follow symbolic links: symbolic links are resolved while cd is traversing directory". "By default, or when the -L option is supplied, symbolic links in directory are resolved after cd processes". "If directory is ‘-’, it is converted to `$OLDPWD` before attempting the directory change."
- 5.1 CDPATH: "A colon-separated list of directories used as a search path for the `cd` builtin command." 5.2: OLDPWD "The previous working directory as set by the `cd` builtin."; PWD "The current working directory as set by the `cd` builtin."
- 6.8.1: "dirs [-clpv] [+N | -N]", "popd [-n] [+N | -N]", "pushd [-n] [+N | -N | dir]". "When no arguments are given, `popd` removes the top directory from the stack and changes to the new top directory." "With no arguments, `pushd` exchanges the top two elements of the directory stack." `pushd +N`: "Rotate the stack so that the Nth directory" "is at the top." `pushd dir`: "Make dir be the top of the stack." `-n`: "Suppress the normal change of directory when rotating or adding directories to the stack, only manipulate the stack." "After the stack has been modified, if the -n option was not supplied, `pushd` uses the `cd` builtin" "to change to the directory at the top of the stack."

<!-- prettier-ignore -->
| Form | Example | Directory it goes to | Reader |
| --- | --- | --- | --- |
| `cd dir`, relative | `cd scripts && tee ovl/a.mjs` | dir against the working directory, unless CDPATH finds it first | M from the text; the starting directory is S |
| `cd /abs` | `cd /repo/.claude` | that path (CDPATH not used) | M |
| `cd` | `cd && rm x` | `HOME` | S |
| `cd -` | `cd - && rm x` | `OLDPWD` | S |
| CDPATH set | `CDPATH=/x; cd y` | the first CDPATH entry holding y | S; M when CDPATH is assigned in the same text |
| `cd ~`, `cd ~+`, `cd ~-`, `cd ~2` | `cd ~-` | `HOME`, `PWD`, `OLDPWD`, a stack entry | S |
| `cd -P dir`, `cd -L dir`, `-e`, `-@` | `cd -P link` | dir; links resolved physically or logically | M for the text; where a link leads is S |
| `cd "$X"`, `cd .or*` | `cd .oriv?lo/owner-approvals` | an expansion | U |
| `pushd dir` | `pushd scripts` | dir | M |
| `pushd -n dir` | `pushd -n scripts` | no change | M |
| `pushd`, `pushd +N`, `pushd -N` | `pushd +1` | a stack entry | S |
| `popd` | `popd` | the new top of the stack | S |
| `popd +N`, `popd -N`, `popd -n` | `popd +1` | removes an entry; whether the directory changes was not read | S |
| a directory left by an earlier call | call 1 `cd .claude`, call 2 `printf x > settings.json` | the working directory the call starts in | S |

### 7. git global options before the subcommand (git(1))

Synopsis, as the fetch tool returned it with escape backslashes removed:

```text
git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>]
    [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]
    [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--no-lazy-fetch]
    [--no-optional-locks] [--no-advice] [--bare] [--git-dir=<path>]
    [--work-tree=<path>] [--namespace=<name>] [--config-env=<name>=<envvar>]
    <command> [<args>]
```

Only `-C <path>` and `-c <name>=<value>` are shown taking a separate word; the others are shown with `=`. The page's example: `git --git-dir=a.git --work-tree=b -C c status`.

<!-- prettier-ignore -->
| Option | Value | Changes the repository or checkout | Quote (git(1)) |
| --- | --- | --- | --- |
| `-C <path>` | next word | yes | "Run as if git was started in `<path>` instead of the current working directory." "When multiple `-C` options are given, each subsequent non-absolute `-C <path>` is interpreted relative to the preceding `-C <path>`." "If `<path>` is present but empty, e.g. `-C ""`, then the current working directory is left unchanged." It also changes how `--git-dir` and `--work-tree` paths are read. |
| `--git-dir=<path>` | `=` | yes | "Set the path to the repository (".git" directory)." "It can be an absolute path or relative path to current working directory." |
| `--work-tree=<path>` | `=` | yes | "Set the path to the working tree." It "can also be controlled by setting the GIT_WORK_TREE environment variable and the core.worktree configuration variable". |
| `--bare` | none | yes | "Treat the repository as a bare repository. If GIT_DIR environment is not set, it is set to the current working directory." |
| `-c <name>=<value>` | next word | not by itself; our reading: `-c core.worktree=<path>` sets the working tree, since -c values "override values from configuration files" and core.worktree controls it | "Pass a configuration parameter to the command." Omitting `=` "sets foo.bar to the boolean true value". |
| `--config-env=<name>=<envvar>` | `=` | as `-c` | "Like `-c <name>=<value>`, give configuration variable `<name>` a value, where `<envvar>` is the name of an environment variable from which to retrieve the value." |
| `--namespace=<path>` | `=` | refs namespace; gitnamespaces(7) not read | "Set the Git namespace." |
| `--exec-path[=<path>]` | `=` | not the repository; it moves where git finds its programs | "Path to wherever your core Git programs are installed." "If no path is given, git will print the current setting and then exit." |
| `-p`, `--paginate`, `-P`, `--no-pager` | none | no | "Pipe all output into less (or if set, $PAGER) if standard output is a terminal."; "Do not pipe Git output into a pager." |
| `--no-replace-objects`, `--no-lazy-fetch`, `--no-optional-locks`, `--no-advice` | none | no repository or path named | "Do not use replacement refs to replace Git objects."; "Do not fetch missing objects from the promisor remote on demand."; "Do not perform optional operations that require locks."; "Disable all advice hints from being printed." |
| `--literal-pathspecs`, `--glob-pathspecs`, `--noglob-pathspecs`, `--icase-pathspecs` | none | no; they change how pathspecs are read | "Treat pathspecs literally (i.e. no globbing, no pathspec magic)." |
| `--attr-source=<tree-ish>` | `=` | no | "Read gitattributes from `<tree-ish>` instead of the worktree." |
| `--list-cmds=<group>` | `=` | no | "List commands by group." |
| `-v`, `--version`, `-h`, `--help`, `--html-path`, `--man-path`, `--info-path` | none | no | "Prints the Git suite version that the git program came from."; "Prints the synopsis and a list of the most commonly used commands."; the three path options print a path "and exit". |

Environment (git(1), ENVIRONMENT VARIABLES), which an assignment prefix or `env` can set (section 2): `GIT_DIR` "specifies a path to use instead of the default .git for the base of the repository"; `GIT_WORK_TREE` "Set the path to the root of the working tree."; `GIT_COMMON_DIR`: "non-worktree files that are normally in `$GIT_DIR` will be taken from this path instead."; `GIT_CEILING_DIRECTORIES` is "a list of directories that Git should not chdir up into while looking for a repository directory"; `GIT_DISCOVERY_ACROSS_FILESYSTEM` lets discovery cross "filesystem boundaries"; `GIT_INDEX_FILE` "specifies an alternate index file."

Aliases (git(1), GIT COMMANDS and PATH): "For defining command aliases, see git-config[1] and look for descriptions of `alias.*`." "To execute `git <foo>`, git finds command `<foo>` (either a core Git program found in `GIT_EXEC_PATH`, or a custom one in a directory on PATH), before trying foo as an alias." So `git co x` may be a configured `checkout` (S, B in effect), and our reading is that `git -c alias.co=checkout co x` puts the alias in the text (M to find, if the reader reads `alias.*` values).

Reader: an option in the text is M; a `GIT_*` variable exported before the call, a config file value and a configured alias are S.

### 8. Named bypasses

<!-- prettier-ignore -->
| Form | Example | Source | What a reader still sees |
| --- | --- | --- | --- |
| `eval` | `eval "git sw""itch x"` | 4.1: "The arguments are concatenated together into a single command, separated by spaces." "Bash then reads and executes this command and returns its exit status as the exit status of eval." | the word `eval` and its arguments |
| `bash -c`, `sh -c` | `sh -c 'git switch x'` | 6.1 (bash): "Read and execute commands from the first non-option argument command_string, then exit." | one quoted word that is a whole command |
| `source`, `.` | `. ./x.sh` | 4.1: the `.` command reads and runs commands "from the filename argument in the current shell context" (paraphrase: the tool returned the sentence garbled); 4.2: source is "A synonym for ." | the file name, not its content |
| alias | `gs x`, with `alias gs='git switch'` set earlier | 6.6: "Aliases allow a string to be substituted for a word that is in a position in the input" "where it can be the first word of a simple command." "Aliases are not expanded when the shell is not interactive, unless the expand_aliases shell option is set"; expand_aliases "is enabled by default for interactive shells." "Aliases are expanded when a function definition is read, not when the function is executed," | a plain word |
| function defined earlier | `f x` | 3.3: "compound-command is executed whenever fname is specified as the name of a simple command."; 3.7.2 looks for a function before builtins and PATH | a plain word; `command f` skips it (4.2) |
| a variable or substitution at command position | `$G switch x`; `$(printf git) switch x`; `$(cat <<"EOF"` NL `git` NL `EOF` NL `) switch x` | 3.7.1 | an expansion where the command name stands (U) |
| interpreter | `node -e '...'` | no page read here describes it | the interpreter name and a quoted program |
| `env -S` | `env -S 'git switch x'` | env(1) | one quoted word |
| `xargs` | `printf a \| xargs touch` | xargs(1): "xargs [option ...] [command [initial-argument ...]]" | the command; its arguments come from input |
| git alias | `git co x` | git(1) | a subcommand word that is not a git command |
| `git --exec-path=<path>` | `git --exec-path=/tmp/g switch x` | git(1) | the option; the program run is another one |

### 9. Forms the PR 137 reviews probed, by class

The forms come from two run records named in the task envelope: task ORV-138-review-1 (findings RV-1 to RV-8) and task ORV-138-security-1 (findings ORV-138-sec-F1 to sec-F4), both on head 38a7f73, recorded 2026-10-28 under `.orivilo/runs/ORV-138/`. That folder is git-ignored, so the records are not in `source:`; the forms are inputs here, and the class column rests on the sections cited. RV-5 (the recorder's spec read) and sec-F3 (acceptance table columns) are not shell forms and have no row. Where a record names a form without its text, the row says so.

<!-- prettier-ignore -->
| Finding | Form probed | Class | Section | Reader |
| --- | --- | --- | --- | --- |
| RV-1 | `echo '$(cat <<"EOF"` NL `' ; cd .oriv?lo/owner-approvals && printf x > 7.json ; echo '` NL `EOF` NL `)'` | single quotes: no substitution and no here document opens inside `'...'`; the `;`, `&&`, `>` and `?` between the quoted parts are live | 3.1.2.2, 2, 3.2.4, 3.6.2, 3.5.8 | M |
| RV-2 | call 1 `cd .claude`, call 2 `printf x > settings.json`; also a cwd of `scripts` with `tee ovl/a.mjs`, and a cwd of `.github` | the working directory carried from an earlier call | 4.1 cd, 5.2 PWD | S |
| RV-3 | `cat > <scratch>/x.json <<'EOF'` NL `{"a": 1}` NL `EOF` | redirect target plus a here document with a quoted delimiter; the body is data | 3.6.2, 3.6.6 | M |
| RV-3 | `printf 'a\n' > <scratch>/y.txt; echo "exit=$?"` | a parameter expansion in a word that no write form writes to | 3.1.2.3, 3.5.3, 3.6.2 | M (the target is literal) |
| RV-3 | "a for loop with a redirect" and "HOME var in a read, redirect to tmp" (text not in the record) | compound command with redirections; `"$HOME"` in a word that is not a target | 3.2.5, 3.2.5.1, 3.5.3 | M |
| RV-4, sec-F2 | `cd <main> && git switch x`; `cd <worktree> && git switch x`; against `git -C <worktree> switch x` | a cd target earlier in the same call sets the checkout | 4.1 cd, 3.2.4, git(1) `-C` | M for a literal path; S or U for the cd forms of section 6 |
| RV-6 | `"cd" scripts && tee ovl/a.mjs`; `\cd scripts` | quote removal on the command name | 3.1.2.1, 3.1.2.3, 3.5.9 | M |
| RV-6 | `builtin cd scripts`; `command cd .claude && printf x > settings.json` | command prefix builtins | 4.2 | M |
| RV-7, sec-F2 | RV-7: a segment that starts with `(` (described); sec-F2: `(git switch feature/x)` | control operator `(`, subshell | 2, 3.2.5.3 | M |
| RV-7, sec-F2 | RV-7: a segment that starts with `then` (described); sec-F2: `if true; then git switch feature/x; fi` | reserved words | 3.2.1, 3.2.5.2 | M |
| RV-7, sec-F2 | `git status & git switch x`; `true & git switch feature/x` | list operator `&` | 2, 3.2.4 | M |
| RV-7, sec-F2 | `git --no-pager checkout x` | git global option before the subcommand | git(1) OPTIONS | M |
| RV-7 | `git -C <worktree> add checkout` | `-C` takes one word; `checkout` is an argument of `add`, not the subcommand | git(1) `-C`, 3.2.2 | M |
| RV-8 | `printf x > scripts/x/../ovl/a.mjs` | a `..` segment: no expansion of 3.5 applies (no leading `~`, no `*?[`, no `$`, no braces), so the word reaches the program as written | 3.5, 3.5.9 | M for the word; how `..` resolves through links is outside the pages read (S) |
| sec-F1 | `printf x > "$(cat <<"EOF"` NL `.oriv` NL `EOF` NL `)ilo/owner-approvals/7.json"` | command substitution inside a double-quoted redirect word; the here document belongs to the inner command | 3.1.2.3, 3.5.4, 3.6, 3.6.6 | U: the output is not text the shell shows (that `cat` copies its input is the program's behaviour, not the shell's) |
| sec-F1 | `$(cat <<"EOF"` ... `EOF` `)` at command position | the command name comes from a substitution | 3.7.1 | B |
| sec-F2 | `env git switch`; `command git switch` | `env` and `command` prefixes | env(1), 4.2 | M |
| sec-F2 | `GIT_TRACE=0 git switch feature/x` | assignment prefix | 3.4, 3.7.1 | M |
| sec-F4 | `pnpm test > /tmp/t.log 2>&1; echo "exit=$?"` | `2>&1` duplicates a descriptor and names no file; `$?` sits in a word no write form writes to | 3.6.8, 3.5.3 | M |
| sec-F4 | a `>` inside a quoted `node -e` program, with a `$(` elsewhere in the call (described, text not in the record) | a `>` inside single quotes is not an operator | 2, 3.1.2.2 | M |

### 10. Where a one-pass reader's comment, quote, here-document or substitution state can part from the shell

A reader that walks the text once keeps a state: inside a comment or not, inside which quote, which here-documents wait for a body, how deep in `$( )`, backquotes or `(( ))`. Each row below is a place where the pages read give the shell a rule the reader must copy to stay in step, or give none. The Reader column is our own reading. **model**: the zsh and Bash manuals (or POSIX, where both are silent) state one rule a reader can copy. **unknown**: the pages leave the case unspecified, both manuals are silent, or the two manuals read differently, so a reader that must match both shells cannot know what runs. **B** and **S** are as in the class list above. Which rows a guard models, marks unknown or blocks is not decided here. Shell sections: zsh 6.x is the Shell Grammar chapter; Bash numbers are Edition 5.3's; POSIX numbers are XCU chapter 2.

Whether the shell is interactive decides the comment rule:

- Bash 6.3.1 describes an interactive shell as one started "without specifying the -c option, whose input and error output are both connected to terminals" (the part of the definition the tool returned). Our reading: `bash -c` is not interactive.
- zsh option INTERACTIVE: "This option is set upon initialisation if the standard input is a tty and commands are being read from standard input." Our reading: `zsh -c` takes its commands from an argument, so it is not interactive.
- zsh option legend: "In the following list, options set by default in all emulations are marked `<D>`" and "those set by default only in csh, ksh, sh, or zsh emulations are marked `<C>`, `<K>`, `<S>`, `<Z>` as appropriate." INTERACTIVE_COMMENTS (`-k`) is marked `<K>` `<S>`: "Allow comments even in interactive shells." Our reading: it is off in zsh's own mode, and it matters only to an interactive shell.

Comments:

- zsh 6.7: "In non-interactive shells, or in interactive shells with the INTERACTIVE_COMMENTS option set," "a word beginning with the third character of the histchars parameter" "causes that word and all the following characters up to a newline to be ignored." Parameters, histchars: "The third character is the comment character (default ‘#’)."
- Bash 3.1.3: "In a non-interactive shell, or an interactive shell in which the interactive_comments option" "to the shopt builtin is enabled (see The Shopt Builtin), a word beginning with ‘#’ introduces a comment." "A word begins at the beginning of a line, after unquoted whitespace, or after an operator." "An interactive shell without the interactive_comments option enabled does not allow comments." "The interactive_comments option is enabled by default in interactive shells."
- POSIX 2.3, in the rule that begins "If the current character is a '#'": "it and all subsequent characters up to, but excluding, the next `<newline>` shall be discarded as a comment".

Here documents inside substitutions, and the backquote search (POSIX, as returned in consecutive pieces):

```text
2.3:   For "$(" and '`' only, if instances of io_here tokens are found nested within the substitution, they shall be parsed
       according to the rules of 2.7.4 Here-Document; if the terminating ')' or '`' of the substitution occurs
       before the NEWLINE token marking the start of the here-document, the behavior is unspecified.
2.3:   The characters found from the beginning of the substitution to its end, allowing for any recursion necessary
       to recognize embedded constructs, shall be included unmodified in the result token,
2.7.4: The here-document shall be treated as a single word that begins after the next NEWLINE token and continues until
       there is a line containing only the delimiter and a <newline>, with no <blank> characters in between.
       Then the next here-document starts, if there is one.
2.7.4: For the purposes of locating this terminating line, the end of a command_string operand (see sh) shall be
       treated as a <newline> character, and the end of the commands string in $(commands) and `commands`
       may be treated as a <newline>.
2.7.4: If the end of input is reached without finding the terminating line, the shell should, but need not,
       treat this as a redirection error.
2.7.4: If more than one "<<" or "<<-" operator is specified on a line, the here-document associated with the first operator
       shall be supplied first by the application and shall be read first by the shell.
2.7.4: If any part of word is quoted, not counting double-quotes outside a command substitution
       if the here-document is inside one, the delimiter shall be formed by performing quote removal on word,
       and the here-document lines shall not be expanded.
2.7.4: If the redirection operator is "<<-", all leading <tab> characters shall be stripped from input lines
       after <backslash><newline> line continuation (when it applies) has been performed,
       and from the line containing the trailing delimiter.
2.6.3: The search for the matching backquote shall be satisfied by the first unquoted non-escaped backquote;
       during this search, if a non-escaped backquote is encountered within a shell comment, a here-document,
       an embedded command substitution of the $(commands) form, or a quoted string, undefined results occur.
       A quoted string that begins, but does not end, within the "`...`" sequence produces undefined results.
2.6.3: A conforming application shall ensure that it separates the "$(" and '(' into two tokens
2.6.3: Arithmetic expansion has precedence;
       the shell shall only parse the expansion as a command substitution if it determines that it cannot parse
```

The last 2.6.3 sentence goes on past where the tool cut it. Its example of the two tokens is `$( (commands) )`.

Here documents in the two manuals:

- Bash 3.6.6, read on both copies: "If the delimiter is not quoted, the `\<newline>` sequence is treated as a line continuation:" "the two lines are joined and the backslash-newline is removed." "This happens while reading the here-document, before the check for the ending delimiter," "so joined lines can form the end delimiter." The same section's paragraph on an unquoted word also says "the character sequence \newline is treated literally," on both copies; the two sentences stand as the manual has them.
- zsh, Redirection, `<<[-] word`: "The shell input is read up to a line that is the same as word, or to an end-of-file." "No parameter expansion, command substitution or filename generation is performed on word." "If any character of word is quoted with single or double quotes or a ‘\’," "no interpretation is placed upon the characters of the document." "Otherwise, parameter and command substitution occurs, ‘\’ followed by a newline is removed," "Note that word itself does not undergo shell expansion." "Backquotes in word do not have their usual effect;" "instead they behave similarly to double quotes, except that the backquotes themselves are passed through unchanged." "Quotes in the form $'...' have their standard effect of expanding backslashed references to special characters." "If <<- is used, then all leading tabs are stripped from word and from the document." The page does not say where the body is read (the next line, several here-documents, inside a substitution).
- Bash 3.5.4: "The first backquote not preceded by a backslash terminates the command substitution."

Arithmetic and `[[ ]]`:

- Bash 3.2.5.2, `(( expression ))`: "The arithmetic expression is evaluated according to the rules described below". Bash 6.5 lists `<< >>`: "left and right bitwise shifts".
- zsh, Arithmetic Evaluation: "More precisely, ((...)) is equivalent to let "..."." It lists `<< >>`: "bitwise shift left, right."
- Bash 3.2.5.2: "When used with [[, the ‘<’ and ‘>’ operators sort lexicographically using the current locale." zsh, Conditional Expressions: `string1 > string2` is "true if string1 comes after string2 based on ASCII value of their characters." and "Filename generation is not performed on any form of argument to conditions."

#### 10a. Comments

<!-- prettier-ignore -->
| Row | Form | Example | Sources | Reader |
| --- | --- | --- | --- | --- |
| C1 | `#` at the start of a word | `echo a # it's` NL `git switch x` | zsh 6.7; Bash 3.1.3; POSIX 2.3 | model: the comment ends at the newline and the next line is live; a `'`, `"`, `$(`, backquote or `<<` inside it opens nothing (our reading of "ignored" and "discarded") |
| C2 | `#` right after an operator | `true;# it's` NL `git switch x` | Bash 3.1.3: a word begins "after an operator"; zsh 6.7 says "a word beginning with" and the pages read do not say where a word begins | model for bash; the same for zsh is our reading |
| C3 | `#` inside a word, or quoted | `echo a#b; git switch x`; `echo $# ${#x} '#'; git switch x` | zsh 6.7, Bash 3.1.3: only a word that begins with the comment character | model |
| C4 | `\` at the end of a comment | `# note \` NL `git switch x` | POSIX 2.3: characters "up to, but excluding, the next `<newline>`" are discarded; neither manual says more | model, our reading: the backslash goes with the comment and the next line is live |
| C5 | a comment inside `$( )` | `x=$(echo a # )` NL `)`; `git switch x` | Bash 3.5.4: "all characters between the parentheses make up the command"; POSIX 2.3: nested constructs are processed recursively | model, our reading: the `)` inside the comment does not close the substitution |
| C6 | a backquote inside a comment inside backquotes | `` x=`echo a # ` `` NL `` echo b` `` | POSIX 2.6.3: "undefined results occur"; Bash 3.5.4: the first backquote not preceded by a backslash ends it; zsh: not stated | unknown |
| C7 | another comment character in zsh | `histchars='!^%'` NL `echo % it's` NL `git switch x` | zsh histchars: the third character "is the comment character" | unknown when the call sets `histchars`; S otherwise. When a value set on one line takes effect for the next is not stated |
| C8 | an interactive shell | `echo a # it's` | Bash 3.1.3 and zsh 6.7: an interactive shell reads comments only with the option set | S: how the call's shell is started is not on these pages |

#### 10b. Quotes

<!-- prettier-ignore -->
| Row | Form | Example | Sources | Reader |
| --- | --- | --- | --- | --- |
| Q1 | `\'` inside `$'...'` | `echo $'it\'s'; git switch x` | zsh 6.9: "A literal ‘'’ character can be included in the string by using the ‘`\'`’ escape."; Bash 3.1.2.4 lists `\'` as "single quote" | model: `\'` does not end `$'...'`, while inside `'...'` "A single quote may not occur between single quotes" (section 4) |
| Q2 | `''` inside single quotes, zsh | `echo 'it''s'; git switch x` | zsh option RC_QUOTES (no default marker): "Allow the character sequence ‘''’ to signify a single quote within singly quoted strings." | model: where the quotes open and close is the same with the option set or not; only the value differs (our reading) |
| Q3 | `$"..."` | `echo $"a b"` | Bash 3.1.2.5: the string is translated by locale; the zsh Quoting section (6.9) names no `$"..."` form | model for where the quote ends (our reading: the `"` opens a double quote in both); the value can differ between the shells |
| Q4 | `\` newline | `git sw\` NL `itch x` | Bash 3.1.2.1, line continuation; zsh 6.9: "‘\’ followed by a newline is ignored." | model, outside single quotes and comments |
| Q5 | a newline inside quotes, zsh CSH_JUNKIE_QUOTES | `echo "a` NL `b"` | zsh option CSH_JUNKIE_QUOTES (`<C>`): "These require that embedded newlines be preceded by a backslash; unescaped newlines will cause an error message." | S: off in zsh's own mode |

#### 10c. Here documents

<!-- prettier-ignore -->
| Row | Form | Example | Sources | Reader |
| --- | --- | --- | --- | --- |
| H1 | the body starts after the next NEWLINE token | `cat <<'EOF'; git status` NL `body` NL `EOF` | POSIX 2.7.4; Bash 3.6.6 | model |
| H2 | several here-documents on one line | `cat <<A; cat <<B` NL `a` NL `A` NL `b` NL `B` | POSIX 2.7.4: the first operator's document "shall be read first by the shell"; the Bash and zsh pages read do not say | model per POSIX |
| H3 | a newline inside a substitution before the body | `cat <<'EOF' $(` NL `printf x > 7.json` NL `)` NL `body` NL `EOF` | POSIX 2.3: the substitution's characters are "included unmodified in the result token"; the zsh and Bash pages are silent | model per POSIX, our reading: a newline inside the substitution is not the NEWLINE token, so the lines inside it run as the substitution's command and the body starts after the line where `)` closes |
| H4 | a here-document in `$( )` that closes on its own line | `x=$(cat <<'EOF')` NL `git switch x` NL `EOF` | POSIX 2.3: "the behavior is unspecified"; 2.7.4: the end of the commands string "may be treated as a `<newline>`"; the Bash and zsh pages are silent | unknown |
| H5 | the same in backquotes | `` x=`cat <<'EOF'` `` NL `git switch x` NL `EOF` | POSIX 2.3 as H4; POSIX 2.6.3: a backquote met within "a here-document" during the search gives undefined results | unknown |
| H6 | a here-document in a function body, `{ }`, `if` or a case arm | `f() { cat <<'EOF'; }` NL `body` NL `EOF` NL `git switch x` | no special rule on the pages read; H1 holds | model |
| H7 | a quoted delimiter | `<<'EOF'`, `<<"EOF"`, `<<\EOF`, `<<E"O"F` | Bash 3.6.6: "If any part of word is quoted, the delimiter is the result of quote removal on word"; zsh: quoted "with single or double quotes or a ‘\’"; POSIX 2.7.4 | model |
| H8 | a `$'...'` delimiter | `cat <<$'EOF'` NL `git switch x` NL `EOF` | zsh: "Quotes in the form $'...' have their standard effect of expanding backslashed references to special characters."; Bash: quote removal (3.6.6), and 3.1.2.4: "The expanded result is single-quoted, as if the dollar sign had not been present." Bash 3.6.6 does not say whether quote removal decodes an escape | model for a delimiter of plain characters (our reading: both shells end at `EOF` and do not expand the body); unknown when a backslash is inside, such as `<<$'E\x4fF'` |
| H9 | a `$"..."` delimiter | `cat <<$"EOF"` | Bash: a quoted word, so quote removal; whether it is translated is not stated. zsh names no `$"` form; our reading: its delimiter is `$EOF` | unknown: the two manuals read differently |
| H10 | an expansion in the delimiter word | `cat <<$X`; `cat <<$(echo E)` | Bash 3.6.6: no expansion on word, and "If word is unquoted, delimiter is word itself"; zsh: "Note that word itself does not undergo shell expansion." | model: the delimiter is the literal text, and the body is expanded |
| H11 | backquotes in the delimiter word | `` cat <<`EOF` `` | zsh: backquotes "behave similarly to double quotes, except that the backquotes themselves are passed through unchanged"; Bash: not stated | unknown |
| H12 | `\` newline inside the delimiter word | `cat <<E\` NL `OF` | Bash 3.1.2.1 removes the `\`newline from the input; zsh 6.9 ignores it; whether the word then counts as quoted is not stated | unknown |
| H13 | `\` newline in an unquoted body | `cat <<EOF` NL `EO\` NL `F` NL `git switch x` | Bash 3.6.6: the lines join "before the check for the ending delimiter, so joined lines can form the end delimiter" (the same section also says `\newline` "is treated literally"); zsh: "‘\’ followed by a newline is removed", with no order against the delimiter check | model for bash (join, then check, so `git switch x` is live); unknown for zsh |
| H14 | `<<-` | `cat <<-EOF` NL TAB `body` NL TAB `EOF` | Bash 3.6.6, zsh, POSIX 2.7.4: leading tabs are stripped from the body and the delimiter line | model: tabs only; a line indented with spaces does not end it |
| H15 | a delimiter line with blanks | `EOF` followed by a space | Bash: "a line containing only delimiter (with no trailing blanks)"; zsh: "a line that is the same as word"; POSIX: "with no `<blank>` characters in between" | model |
| H16 | no delimiter line | `cat <<'EOF'` NL `git switch x` | zsh: read "up to a line that is the same as word, or to an end-of-file"; POSIX: the shell "should, but need not," treat this as an error | model for zsh (the rest of the text is body); whether bash runs the command is not stated |
| H17 | `<<` inside `(( ))` or `$(( ))` | `(( n = 1 << 2 ))` NL `git switch x` | Bash 6.5 and zsh Arithmetic Evaluation: `<<` is a shift | model once the reader knows it is in arithmetic; S3 and S4 show where that is unclear |
| H18 | a here string `<<<` | `cat <<< EOF` NL `git switch x` | Bash 3.6.7; zsh: "Perform shell expansion on word and pass the result to standard input." | model: no body, the next line is live |
| H19 | `<`, `>` inside `[[ ]]` | `[[ a > b ]]` | Bash 3.2.5.2: they "sort lexicographically"; zsh: a string comparison | model: no file is written (a reader that takes `>` as a redirect there reports a write that does not happen) |
| H20 | zsh `<<(list)` | `cat <<(git switch x)` | zsh Expansion: `<<(list)` "is not a special syntax; it is equivalent to" `< <(list)` | model: a process substitution, not a here-document; the list runs |

#### 10d. Substitutions and arithmetic

<!-- prettier-ignore -->
| Row | Form | Example | Sources | Reader |
| --- | --- | --- | --- | --- |
| S1 | the end of a backquote substitution | `` echo `echo a`; git switch x `` | Bash 3.5.4; POSIX 2.6.3: "the first unquoted non-escaped backquote" | model |
| S2 | a quote that begins inside backquotes and ends outside | `` echo `echo "a` b" `` | POSIX 2.6.3: such a string "produces undefined results" | unknown |
| S3 | `$((` that is not arithmetic | `echo $((cd x; git switch y) )` | POSIX 2.6.3: the application must separate `$(` and `(`; "Arithmetic expansion has precedence" | unknown unless the reader parses arithmetic as the shell does |
| S4 | `((` at the start of a command | `((git switch x) )` | the pages read give no rule for `((` against `( (` at command position | unknown |
| S5 | a case pattern `)` inside `$( )` | `x=$(case a in a) git switch x;; esac)` | Bash 3.2.5.2 case syntax, `case word in [ [(] pattern [\| pattern]...) command-list ;;]... esac`; Bash 3.5.4: the characters between the parentheses make up the command | model with a reader that knows `case`; a parenthesis count closes the substitution at `a)` |
| S6 | Bash 5.3 `${ command; }` and `${\| command; }` | `echo ${ git switch x; }` | Bash 3.5.4: "The character c following the open brace must be a space, tab, newline, or ‘\|’"; the zsh Expansion page read names no such form | model for bash (the command runs); how zsh reads it is not stated |
| S7 | zsh `$[exp]` | `echo $[1<<2]` | zsh Expansion: `$[exp]` or `$((exp))` is replaced by the value of the expression (the tool's paraphrase) | model |
| S8 | zsh `=(list)` | `cat =(git switch x)` | zsh Expansion: "the last form must occur at the start of a command argument"; the forms "are only expanded when first parsing command or assignment arguments" | model for zsh: the list runs |
| S9 | zsh `=word` at command position | `=git switch x` | zsh option EQUALS (`<Z>`): "Perform = filename expansion."; Expansion: "If a command exists by that name, the word is replaced by the full pathname of the command." | model, our reading: the command is `git` |
| S10 | zsh glob qualifiers `e` and `+` | `print *(e:'git switch x':)`; `print *(+f)` | zsh Expansion: "The string will be executed as shell code."; "the first character after the ‘e’ will be used as a separator"; "The form +cmd has the same effect, but no delimiters appear around cmd." | B |
| S11 | zsh `(` and `\|` inside a word | `ls a(b\|c)` | zsh Filename Generation: a word with an unquoted `(` is taken as a pattern unless GLOB is unset (the tool's paraphrase); SH_GLOB (`<K>` `<S>`) changes this for substitution results; what ends a command inside such a group is not stated | unknown |

#### 10e. zsh forms and options that bash lacks

<!-- prettier-ignore -->
| Row | Form | Example | Sources | Reader |
| --- | --- | --- | --- | --- |
| Z1 | aliases in a non-interactive shell | `alias s='git switch'` NL `s x` | zsh option ALIASES (`<D>`, set in every emulation): "Expand aliases."; Bash 4.3.2: expand_aliases is "enabled by default for interactive shells" | B for zsh, where an alias can apply in a `-c` call; when a definition on one line takes effect for a later line is not stated |
| Z2 | reserved words zsh adds | `repeat 1 git switch x`; `foreach f (a) git switch x; end`; `nocorrect git switch x` | zsh 6.5: "do done esac then elif else fi for case if while function repeat time until select coproc nocorrect" "foreach end ! [[ { } declare export float integer local readonly typeset" | model with zsh's list; with bash's list alone, `repeat`, `foreach` or `nocorrect` reads as the command name |
| Z3 | short forms | `for f (a) git switch x`; `if [[ -n a ]] { git switch x }` | zsh 6.4; option SHORT_LOOPS (`<C>` `<Z>`): "Allow the short forms of for, repeat, select, if, and function constructs." | model with zsh's grammar |
| Z4 | `}` in any position | `{ git switch x }` | zsh 6.5: "‘}’ is recognized in any position if neither the IGNORE_BRACES option nor the" "IGNORE_CLOSE_BRACES option is set." | model per shell; bash needs a `;` or a newline before `}` (section 1) |
| Z5 | `always` | `{ : } always { git switch x }` | zsh 6.3: "Regardless of errors, or break or continue commands encountered within try-list, execute always-list." | model |
| Z6 | several output redirections | `printf x > a > b` | zsh: with MULTIOS (`<Z>`) `date >foo >bar` "writes the date to two files"; with it unset, `echo Hello > bar > baz` "will truncate ‘bar’, and write ‘Hello’ into ‘baz’." | model: every target is opened for writing either way |
| Z7 | a redirection with no command | `> 7.json` | zsh: "The default for NULLCMD is ‘cat’ and for READNULLCMD is ‘more’." | model: the target is in the text |
| Z8 | zsh write operators | `printf x >! 7.json`; `>>!`, `>>\|`, `&>\|`, `&>!` | zsh: `>\|` and `>!` are "Same as >, except that the file is truncated to zero length if it exists, regardless of CLOBBER." | model for zsh; section 3 lists the bash operators |

### 11. Programs that run their remaining words as a command (runners)

A runner is a shell word or a program that takes its own options, sometimes a fixed positional word (a duration, a mask, a priority, a lock file, a file to record into), and then runs the rest of the words as a command. A reader reaches that command by skipping the runner with its grammar. Each row gives, from its page, the options that take a value (the next word, or attached after `=` where the page shows only that form), the options that take none, the positional words before the command, and what else the runner does with the words or with files. Reader, our reading: **M** when the grammar on the page lets a reader find the command word; **B** when the words go to a shell as one string or are run again by a shell; **U** where the page leaves the grammar open. A file a runner writes, named by its option or argument, is noted as a write target. Section 2's rows for `env`, `nohup`, `timeout`, `exec`, `command` and `builtin` stand; the rows below add their option grammar.

#### 11a. Shell words

<!-- prettier-ignore -->
| Word | Source | Grammar | Reader |
| --- | --- | --- | --- |
| `time` | Bash 3.2.3: "If the reserved word time precedes the pipeline, Bash prints timing statistics for the pipeline once it finishes."; "The -p option changes the output format to that specified by POSIX."; "When the shell is in POSIX mode (see Bash and POSIX), it does not recognize time as a reserved word if the next token begins with a ‘-’." zsh 6.5 lists `time` as a reserved word | `time [-p]` in bash; zsh's grammar for it was not read | M |
| `repeat` | zsh 6.3: "word is expanded and treated as an arithmetic expression, which must evaluate to a number n." "list is then executed n times." | one word, then the list (10e Z2, Z3) | M |
| `-` | zsh 6.2: "The command is executed with a ‘-’ prepended to its argv[0] string." | `- command` | M |
| `builtin` | zsh 6.2: "The command word is taken to be the name of a builtin command, rather than a shell function or external command." | no options | M |
| `command [-pvV]` | zsh 6.2: "The -p flag causes a default path to be searched instead of that in $path."; "With the -v flag, command is similar to whence and with -V, it is equivalent to whence -v." | no option takes a value; with `-v` or `-V` the command is looked up, not run (our reading of "similar to whence") | M |
| `exec [-cl] [-a argv0]` | zsh 6.2: "The -c option clears the environment."; "The -a option is used to specify explicitly the argv[0] string" | `-a` takes a value | M |
| `nocorrect` | zsh 6.2: "This must appear before any other precommand modifier, as it is interpreted immediately, before any parsing is done." "It has no effect in non-interactive shells." | no options | M |
| `noglob` | zsh 6.2: "Filename generation (globbing) is not performed on any of the words." | no options | M; the words after it are not patterns (our reading) |

#### 11b. Programs

<!-- prettier-ignore -->
| Program, page | Synopsis | Options with a value | Options with no value | Words before the command | Also, from the page | Reader |
| --- | --- | --- | --- | --- | --- | --- |
| nice, coreutils 9.11 | `nice [OPTION] [COMMAND [ARG]...]` | `-n N`, `--adjustment=N` | `--help`, `--version` | none | "Run COMMAND with an adjusted niceness, which affects process scheduling." | M |
| nice, macOS ("February 24, 2011", "Mac OS X 12") | `nice [-n increment] utility [argument ...]` | `-n increment` | none | none | "The traditional -increment option has been deprecated but is still supported."; "Some shells may provide a builtin nice command which is similar or identical to this utility." | M, with a `-` and digits as one option word |
| time, man-pages 6.19 (GNU time) | `time [option ...] command [argument ...]` | `-f`, `--format=format`, `-o`, `--output=file` | `-p`, `--portability`, `-a`, `--append`, `-v`, `-q`, `--help`, `-V`, `--` | none | `-o`: "Do not send the results to stderr, but overwrite the specified file."; the page notes bash has a built-in time, so the program may need its path, such as /usr/bin/time (the tool's paraphrase) | M; the `-o` value is a write target |
| time, macOS ("January 15, 2021", "Mac OS X 12") | `time [-al] [-h \| -p] [-o file] utility [argument ...]` | `-o file` | `-a`, `-h`, `-l`, `-p` | none | `-o`: "Write the output to file instead of stderr. If file exists and the -a flag is not specified, the file will be overwritten." | M; the `-o` value is a write target |
| stdbuf, coreutils 9.11 | `stdbuf OPTION... COMMAND` | `-i`, `--input=MODE`, `-o`, `--output=MODE`, `-e`, `--error=MODE` | `--help`, `--version` | none | "Run COMMAND, with modified buffering operations for its standard streams."; whether a value may be attached, as in `-o0`, is not on the page | M |
| stdbuf, macOS ("June 29, 2023", "Mac OS X 13") | `stdbuf [-e bufdef] [-i bufdef] [-o bufdef] [command [...]]` | `-e`, `-i`, `-o` | none | none | | M |
| caffeinate, macOS ("November 9, 2012", "Darwin") | `caffeinate [-disu] [-t timeout] [-w pid] [utility arguments...]` | `-t timeout`, `-w pid` | `-d`, `-i`, `-m`, `-s`, `-u` (the page lists `-m`; the synopsis does not) | none | "If a utility is specified, caffeinate creates the assertions on the utility's behalf" | M |
| ionice, util-linux 2.43.devel | `ionice [-c class] [-n level] [-t] command [argument] ...`; or `-p PID`, `-P PGID`, `-u UID` in place of a command | `-c`, `--class`, `-n`, `--classdata`, `-p`, `--pid`, `-P`, `--pgid`, `-u`, `--uid` | `-t`, `--ignore` | none | "When command is given, ionice will run this command with the given arguments." | M |
| setsid, util-linux 2.43.devel | `setsid [options] program [arguments]` | none | `-c`, `-f`, `-w`, `-h`, `-V` | none | "setsid runs a program in a new session." | M |
| chrt, util-linux 2.43.devel | `chrt [options] [priority] command [argument...]`; `chrt --pid [options] [priority] PID[:inode]` | `-T`, `-P`, `-D` (nanoseconds), `-U`, `-X` | `-o`, `-f`, `-r`, `-b`, `-i`, `-d`, `-e`, `-G`, `-O`, `-R`, `-a`, `-m`, `-p`, `-v`, `-h`, `-V` | an optional priority | the page does not say how the optional priority is told from the command | U for the first word after the options; M if a word of digits is taken as the priority (our reading) |
| taskset, util-linux 2.43.devel | `taskset [options] mask command [argument...]`; `taskset [options] -p [mask] pid` | none shown with a placeholder | `-a`, `-c` (the mask is then a CPU list: "taskset --cpu-list cpu-list command"), `-p`, `-h`, `-V` | one mask or CPU list | `-p` acts on a PID and runs no command | M |
| flock, util-linux 2.43.devel | `flock [options] file\|directory command [arguments]`; `flock [options] file\|directory -c command`; `flock [options] number` | `-c`, `--command`, `-E`, `--conflict-exit-code`, `-w`, `--wait`, `--timeout`, `--start`, `--length` | `-F`, `-n`, `--nb`, `--nonblocking`, `-o`, `-s`, `-u`, `-e`, `-x`, `--exclusive`, `--verbose`, `--fcntl`, `-h`, `-V` | one file or directory | the lock file "is created (assuming appropriate permissions) if it does not already exist."; `-c`: "Pass a single command, without arguments, to the shell with -c." | M, and the file word is a write target; B with `-c` |
| lockf, macOS ("November 25, 2023", "Mac OS X 14") | `lockf [-knsw] [-t seconds] file command [arguments]`; `lockf [-s] [-t seconds] fd` | `-t seconds` | `-k`, `-n`, `-s`, `-w` | one file | it "acquires an exclusive lock on a file, creating it if necessary." | M, and the file word is a write target |
| sudo, sudo.ws (no version on the page) | `sudo [-ABbEHnPS] [-a type] [-C num] [-c class] [-D directory] [-g group] [-h host] [-p prompt] [-R directory]` `[-r role] [-t type] [-T timeout] [-u user] [VAR=value] [-i \| -s] [command [arg ...]]`; also `sudoedit ... file ...` | `-a`, `-C`, `-c`, `-D`, `-g`, `-h host`, `-p`, `-R`, `-r`, `-t`, `-T`, `-U`, `-u`, `--preserve-env=list` | `-A`, `-B`, `-b`, `-E`, `-e`, `-H`, `-i`, `-K`, `-k`, `-l`, `-N`, `-n`, `-P`, `-S`, `-s`, `-V`, `-v`, `--` | `VAR=value` words: "Environment variables to be set for the command may also be passed as options to sudo in the form VAR=value" | `-D`: "Run the command in the specified directory instead of the current working directory."; `-R`: "Change to the specified root directory (see chroot(8)) before running the command."; with `-s` or `-i`: "If a command is specified, it is passed to the shell as a simple command using the -c option."; `-e` and sudoedit edit the files named as arguments | M with the lists; the page lists `-h` both as help and as `-h host`, so a bare `-h` is U; `-D` sets the checkout as `env -C` does (section 2); `-e` arguments are write targets; B with `-s` or `-i` (our reading: the words are run again by a shell) |
| doas, OpenBSD-current ("December 22, 2022") | `doas [-Lns] [-a style] [-C config] [-u user] command [arg ...]` | `-a`, `-C`, `-u` | `-L`, `-n`, `-s` | none | `-C`: "Parse and check the configuration file config, then exit."; `-s`: "Execute the shell from SHELL or /etc/passwd." | M |
| chronic, moreutils 0.70 | `chronic [-ev] COMMAND...` | none | `-e`, `-v` | none | "chronic runs a command, and arranges for its standard out and standard error to only be displayed if the command fails" | M |
| unbuffer, expect 5.45.4 | `unbuffer program [ args ]` | none | `-p`: "To use unbuffer in a pipeline, use the -p flag." | none | | M |
| script, util-linux 2.43.devel | `script [options] [file] [-- command [argument...]]` | `-c`, `--command`, `-E`, `--echo`, `-B`, `--log-io`, `-I`, `--log-in`, `-O`, `--log-out`, `-T`, `--log-timing`, `-m`, `--logging-format`, `-o`, `--output-limit`; `-t[file]`, `--timing[=file]` take an attached value only | `-a`, `-e`, `-f`, `--force`, `-q`, `-h`, `-V` | an optional file | "If no filename is given, the dialogue is saved in the file typescript."; `-c`: "Run the command rather than an interactive shell." (whether through a shell is not on the page) | M after `--`; the file word, `typescript`, and the `-B`, `-I`, `-O`, `-T` values are write targets; U with `-c` |
| script, macOS ("December 4, 2013", "Mac OS X 12") | `script [-aeFkqr] [-t time] [file [command ...]]`; `script -p [-deq] [-T fmt] [file]` | `-t time`, `-T fmt` | `-a`, `-d`, `-e`, `-F`, `-k`, `-p`, `-q`, `-r` | one file, which must come before a command | "If the argument command is given, script will run the specified command with an optional argument vector" "instead of an interactive shell."; "If no file name is given, the typescript is saved in the file typescript." | M; the file word is a write target |
| watch, procps-ng | `watch [option ...] command` | `-n`, `--interval`, `-q`, `--equexit`, `-s`, `--shotsdir`; `-d[=permanent]` attached only | `-b`, `-c`, `-C`, `-e`, `-f`, `-g`, `-p`, `-r`, `-t`, `-w`, `-x`, `-h`, `-v` | none | "The command is passed to the shell, which allows you to make the pipeline."; `-x`: "Pass command to an exec(3) call instead of sh -c." | B without `-x` (how several words are joined for `sh -c` is not on the page); M with `-x` |
| nohup, coreutils 9.11; macOS ("July 19, 2001", "Mac OS X 12") | `nohup COMMAND [ARG]...` and `nohup OPTION`; macOS `nohup [--] utility [arguments]` | none | `--help`, `--version` (each alone); `--` on macOS | none | macOS: "If the standard output is a terminal, the standard output is appended to the file nohup.out in the current directory."; else it uses "the directory named by HOME" | M; `nohup.out` is a write target not in the text (section 2) |
| timeout, coreutils 9.11 | `timeout [OPTION]... DURATION COMMAND [ARG]...` | `-k`, `--kill-after=DURATION`, `-s`, `--signal=SIGNAL` | `-f`, `--foreground`, `-p`, `--preserve-status`, `-v`, `--verbose`, `--help`, `--version` | one DURATION | "Start COMMAND, and kill it if still running after DURATION." | M |
| timeout, macOS ("April 11, 2026", "macOS 26") | `timeout [-f \| --foreground] [-k time \| --kill-after time] [-p \| --preserve-status]` `[-s signal \| --signal signal] [-v \| --verbose] duration command [arg ...]` | `-k`, `--kill-after`, `-s`, `--signal` | `-f`, `--foreground`, `-p`, `--preserve-status`, `-v`, `--verbose` | one duration | "Timeout starts the command with its arg list." | M |
| env, coreutils 9.11 | `env [OPTION]... [-] [NAME=VALUE]... [COMMAND [ARG]...]` | `-a`, `--argv0`, `-u`, `--unset`, `-C`, `--chdir`, `-S`, `--split-string`; `--block-signal[=SIG]`, `--default-signal[=SIG]`, `--ignore-signal[=SIG]` attached only | `-i`, `-0`, `-v`, `--debug`, `--list-signal-handling`; "A mere - implies -i" | `NAME=VALUE` words | `-S`: "process and split S into separate arguments; used to pass multiple arguments on shebang lines" | M; `-C` sets the directory (section 2); B with `-S` |
| env, macOS ("April 17, 2008", "Mac OS X 12") | `env [-iv] [-C altwd] [-P altpath] [-S string] [-u name] [name=value ...] utility [argument ...]` | `-C altwd`, `-P altpath`, `-S string`, `-u name` | `-0`, `-i`, `-v` | `name=value` words | `-C`: "Change to the specified alternate working directory before executing the specified utility program."; `-P`: "Search the set of directories as specified by altpath to locate the specified utility program" | M; B with `-S`; with `-P` which program runs depends on those directories (S) |
| xargs, findutils ("2024-06-03") | `xargs [option ...] [command] [initial-argument ...]` | next word: `-a`, `-d`, `-E`, `-I`, `-L`, `-n`, `-P`, `-s`; after `=`: `--arg-file=`, `--delimiter=`, `--max-args=`, `--max-procs=`, `--max-chars=`, `--process-slot-var=`; attached only: `-e[eof-str]`, `-i[replace-str]`, `-l[max-lines]`, `--eof[=eof-str]`, `--replace[=replace-str]`, `--max-lines[=max-lines]` | `-0`, `--null`, `-o`, `-p`, `-r`, `-t`, `-x`, `--show-limits` | none | the command is run "(default is echo)" | M for the command; its other arguments come from input (U); section 8 |
| xargs, macOS ("August 4, 2015", "Mac OS X 12") | `xargs [-0oprt] [-E eofstr] [-I replstr [-R replacements] [-S replsize]] [-J replstr] [-L number] [-n number [-x]]` `[-P maxprocs] [-s size] [utility [argument ...]]` | `-E`, `-I`, `-J`, `-L`, `-n`, `-P`, `-R`, `-S`, `-s` | `-0`, `-o`, `-p`, `-r`, `-t`, `-x` | none | "If utility is omitted, echo(1) is used." | as the row above |
| parallel, GNU 20261022 | `parallel [options] [command [arguments]] ( ::: arguments \| :::+ arguments \| :::: argfile(s) \| ::::+ argfile(s) ) ...`, and `--semaphore`, `--shebang` forms | many; the option list was read only in part | | | "The command must be an executable, a script, a composed command, an alias, or a function."; "If command is not given GNU parallel will behave similar to cat \| sh." | U: the option list was not read in full, and input lines can become commands |
| chroot, coreutils 9.11 | `chroot [OPTION]... NEWROOT [COMMAND [ARG]...]` | `--groups=G_LIST`, `--userspec=USER:GROUP` | `--skip-chdir`, `--help`, `--version` | one NEWROOT | "Run COMMAND with root directory set to NEWROOT."; with no command it runs the user's shell with `-i` (default `/bin/sh -i`) | M; paths in the command are read under NEWROOT (our reading) |
| prlimit, util-linux 2.43.devel | `prlimit [options] [--resource[=limits]] command [argument...]` | `-o`, `--output`, `-p`, `--pid`; the resource options `-c`, `-d`, `-e`, `-f`, `-i`, `-l`, `-m`, `-n`, `-q`, `-r`, `-s`, `-t`, `-u`, `-v`, `-x`, `-y` and their long forms take `[=limits]` | `--noheadings`, `--raw`, `--verbose`, `-h`, `-V` | none | "When command is given, prlimit will run this command with the given arguments." | M for the long forms with `=`; U for a short resource option followed by a word, since how its optional value attaches is not on the page |
| arch, macOS ("February 15, 2021", "Mac OS X 12") | `arch [-32] [-64] [[-arch_name \| -arch arch_name]...] [-c] [-d envname]... [-e envname=value]... [-h] prog [args ...]` | `-arch`, `-d`, `-e` | `-32`, `-64`, `-c`, `-h`, and `-` before an architecture name (the page names i386, x86_64, x86_64h, arm64, arm64e) | none | `-e`: "Assigns the given value to the named environment variable in the environment that will be passed to the command to be run." | M; `-e GIT_DIR=...` acts as an assignment prefix does in section 2 (our reading) |
| xcrun, macOS ("July 9, 2015") | `xcrun [--sdk <SDK name>] <tool name> ... tool arguments ...`; `xcrun [--sdk <SDK name>] --find <tool name>` | `--sdk`, `--toolchain` | `-v`, `-n`, `-k`, `-l`, `-f`, `-r`, `--show-sdk-path` and the other `--show-` options | none | its `xcrun git status` example "Locates the git command and then executes it with a single argument" | M; which program it finds is S |
| sandbox-exec, macOS ("March 9, 2017") | `sandbox-exec [-f profile-file] [-n profile-name] [-p profile-string] [-D key=value ...] command [arguments ...]` | `-f`, `-n`, `-p`, `-D` | none | none | "The sandbox-exec command is DEPRECATED." | M |
| pnpm exec, pnpm.io | no synopsis line; "Execute a shell command in scope of a project." | `--resume-from <package_name>`, `--filter <package_selector>` | `-r`, `--recursive`, `--parallel`, `--no-reporter-hide-prefix`, `--report-summary`, `-c`, `--shell-mode` | none | "node_modules/.bin is added to the PATH"; `-c`: "Runs the command inside a shell. Uses /bin/sh on UNIX and cmd.exe on Windows." | M; B with `-c`; which program runs is S; pnpm's own options before `exec` were not read |
| npx, npm v11 | `npx -- <pkg>[@<version>] [args...]`; `npx --package=<pkg>[@<version>] -- <cmd> [args...]`; `npx -c '<cmd> [args...]'` | `--package=`, `-p`, `-c`, `--call` | `--yes`, `-y`, `--no` | none | all flags and options "must be set prior to any positional arguments" (emphasis dropped); the package may be "fetched remotely" | M for the `--` forms; B with `-c`; which program runs is S |

Programs not read in this task, so no grammar is recorded for them: `find -exec`, `strace`, `ltrace`, `valgrind`, `gdb --args`, `nsenter`, `unshare`, `runuser`, `su -c`, `systemd-run`, `firejail`, `bwrap`, `fakeroot`, `faketime`, `eatmydata`, `ssh`, `docker exec`, `kubectl exec`, `direnv exec`, `mise exec`, `asdf exec`, `uv run`, `poetry run`, `bundle exec`, macOS `taskpolicy`, `ktrace` and `dtruss`, and `busybox`. The keith.github.io index lists `ktrace.1` and `dtruss.1m`; they were not opened.

### Findings of the second PR 137 reviews, by row

The forms come from two run records named in the task envelope: task ORV-138-security-2 (findings ORV-138-sec-F5 to sec-F7) and task ORV-138-review-2 (findings RV2-1 to RV2-6), both on head ad941b2, recorded 2026-10-28 and 2026-10-29 under `.orivilo/runs/ORV-138/`. That folder is git-ignored, so the records are not in `source:`; as in section 9, the forms are inputs and the Reader column rests on the rows cited. sec-F7 (parse time), RV2-3 (the ORV-93 text rule reading a here-document body), RV2-5 (which records root switch-1 reads) and RV2-6 (a CI timing bound) are not shell forms and have no row.

<!-- prettier-ignore -->
| Finding | Form probed | Rows | Reader per the rows |
| --- | --- | --- | --- |
| sec-F5 (1), RV2-1 | a `#` comment holding `'` or `"`, then a live line: `git status # don't` NL `git switch x`; `# switch back, it's done` NL `git switch x`; `true # it's done` NL the row 27 form; `# the "owner` NL the row 27 form | C1, C2 | model |
| sec-F5 (2), RV2-2 (1) | a here-document opened inside backquotes with no newline inside them | H5 | unknown |
| RV2-2 (1) | a here-document opened in a `$( )` that closes on its line | H4 | unknown |
| sec-F5 (3) | a here-document pending across a `$(` newline | H3 | model per POSIX 2.3 |
| sec-F5 (4) | the delimiter written `$'EOF'` | H8 | model for plain characters; unknown with a backslash inside |
| RV2-2 (2) | `(( n = 1 << 2 ))`, then a live line | H17; S3 and S4 where the opener is unclear | model inside arithmetic |
| sec-F6 | `nice cp /tmp/a 7.json`, `stdbuf -o0 tee 7.json`, `/usr/bin/time cp /tmp/a 7.json`, and each before `git switch x` | 11b nice, stdbuf, time | M; time's `-o` value is also a write target |
| RV2-4 | `nice`, `caffeinate -i`, `/usr/bin/time`, and by the record's reading `sudo`, `stdbuf`, `flock` | 11b | M; flock and lockf also write their lock file; sudo `-s` or `-i` and flock `-c` pass the words to a shell (B) |

The sec-F6 record also names `ionice`, `setsid` and `chronic` as runners to survey; their rows are in 11b.

### What the sources read do not say

- Which shell runs a Claude Code Bash call (bash, or the user's login shell; this machine's shell is zsh), whether that shell is interactive, and whether `expand_aliases`, `extglob`, `interactive_comments` or `noclobber` is set. The manuals describe bash and zsh; neither says which one runs the call. The run records name zsh 5.9; the zsh manual read is 5.9.2, and what changed between the two was not read.
- What zsh and bash do with a here-document whose `$( )` or backquotes close on its opening line (POSIX leaves it unspecified); where zsh reads the bodies of several here-documents on one line; how zsh parses a comment or a case pattern inside `$( )`; and how zsh 5.9.2 reads Bash's `${ command; }`.
- When an alias, a `histchars` value or an option set on one line of a call takes effect for the next line of the same call.
- The default of zsh's BARE_GLOB_QUAL option, and whether a short option of a runner accepts an attached value (`stdbuf -o0`, `prlimit -n5`) where its page does not show that form.
- Whether git also reads `--git-dir`, `--work-tree`, `--namespace` or `--exec-path` with the value as a separate word; the page shows only the `=` forms.
- How the system resolves `..` and symbolic links in a path the shell passes on.
- When the first word after `coproc` is NAME; whether `popd +N` changes directory; what Bash's `command -v` and `command -V` do (zsh's are in 11a); what a Git namespace does to `HEAD` (gitnamespaces(7)); the `alias.*` rules of git-config(1). None was read.
- Programs that write a file named by an option rather than a redirection (`dd of=`, `curl -o` and the like) are not described by any page read here, apart from the runners in 11b whose rows name a write target (time `-o`, script, flock, lockf, sudo `-e`).

### Claims that did not re-check

- The allow and block outcomes the two reviews report for each form in section 9 (for example "ALLOW | sub | A2 builtin cd") come from the local run records, were not re-run in this task, and appear on no page in `source:`. They carry no confidence here.
- The shell outcomes the second reviews report for the forms in sections 10 and 11 (for example "wrote zsh: true | wrote bash: true" for the H5 and H8 forms, and that zsh and bash both print the line after a `$( )` closed on its line, the H4 form) come from the local run records of ORV-138-security-2 and ORV-138-review-2, were not re-run in this task (this role has no shell), and appear on no page in `source:`. Pages searched for them: zsh Redirection, Bash 3.6.6 on both copies, and POSIX 2.3 and 2.7.4; for H4 and H5 the manuals are silent and POSIX says "the behavior is unspecified". They carry no confidence here.

## Why it matters for ORIVILO

Spec ORV-138 rules `expand-1` (`write-guard`) and `switch-1` (`worktree-guard`) read bash text, and the PR 137 reviews found forms that neither rule names. This entry lists the whole class from the manual, git(1) and the coreutils pages, so the architect can bound both rules once (L-0045) and name the rest as bypasses; which forms a guard models, marks unknown or names is left to the architect and the owner. Sections 10 and 11 add the two classes the second reviews found: places where the shared reader's state parts from what zsh and bash run, and programs that run their remaining words as a command.
