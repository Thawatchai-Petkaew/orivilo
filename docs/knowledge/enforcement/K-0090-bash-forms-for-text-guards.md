---
id: K-0090
topic: enforcement
claim: The GNU Bash Reference Manual (Edition 5.3, 18 May 2025), git(1) of git 2.56.0 and the GNU coreutils 9.11 env and nohup pages name the forms that decide which words a bash command writes to and which checkout a git command acts in (control operators and reserved words; assignment, builtin, command, env, exec and nohup prefixes; redirection operators and their target words; quoting and the expansions it stops; cd, pushd and popd targets; git global options), and this entry classes each form as fixed by the command text, holding a visible unknown part, resting on state from before the call, or a named bypass that runs text the reader never sees as a word.
source: "https://www.gnu.org/software/bash/manual/bash.html (Edition 5.3; re-read there: sections 2, 3.1.2.3, 3.1.2.4, 3.1.3, 3.2.1, 3.2.4, 3.4, 3.5.3, 3.5.4, 3.5.6, 3.6, 3.6.6, 3.6.7, 4.1 cd eval exec, 4.2 builtin command); https://tiswww.case.edu/php/chet/bash/bashref.html (the same edition, the maintainer's copy; read there: sections 2, 3.1.1 to 3.1.3, 3.2.1 to 3.2.6, 3.3, 3.5 to 3.5.9, 3.6 to 3.6.10, 3.7.1, 3.7.2, 3.7.4, 4.1, 4.2, 4.3.1, 4.3.2, 5.1, 5.2, 6.1, 6.6, 6.8.1); https://git-scm.com/docs/git (SYNOPSIS, OPTIONS, GIT COMMANDS, ENVIRONMENT VARIABLES); https://man7.org/linux/man-pages/man1/env.1.html; https://man7.org/linux/man-pages/man1/nohup.1.html; https://man7.org/linux/man-pages/man1/timeout.1.html; https://man7.org/linux/man-pages/man1/xargs.1.html"
retrieved: 2026-10-29
confidence: 0.8
applies_to: [ORV-138, ORV-96, ORV-130]
license: link-only
---

## Evidence

The Bash manual is the primary source. Both copies open with the same line: "This is Edition 5.3, last updated 18 May 2025, of The GNU Bash Reference Manual, for `Bash`, Version 5.3." On 2026-10-29 gnu.org answered most requests with HTTP 429, so most sections were read on the maintainer's copy at tiswww.case.edu; the sections listed under the gnu.org URL in `source:` were then read again on gnu.org and matched. Section numbers are this edition's (3.2.1 is Reserved Words here). git(1) is the page for git 2.56.0 (its changelog entry dated 2026-09-28); the man7.org pages are from GNU coreutils 9.11 (footer "April 2026") and GNU findutils (xargs, footer "2024-06-03").

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
| `sudo` | | | out of scope for this entry |

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

### What the sources read do not say

- Which shell runs a Claude Code Bash call (bash, or the user's login shell; this machine's shell is zsh), whether that shell is interactive, and whether `expand_aliases`, `extglob`, `interactive_comments` or `noclobber` is set. The manual describes bash only.
- Whether git also reads `--git-dir`, `--work-tree`, `--namespace` or `--exec-path` with the value as a separate word; the page shows only the `=` forms.
- How the system resolves `..` and symbolic links in a path the shell passes on.
- When the first word after `coproc` is NAME; whether `popd +N` changes directory; what `command -v` and `command -V` do; what a Git namespace does to `HEAD` (gitnamespaces(7)); the `alias.*` rules of git-config(1). None was read.
- Programs that write a file named by an option rather than a redirection (`dd of=`, `curl -o` and the like) are not described by any page read here.

### Claims that did not re-check

- The allow and block outcomes the two reviews report for each form in section 9 (for example "ALLOW | sub | A2 builtin cd") come from the local run records, were not re-run in this task, and appear on no page in `source:`. They carry no confidence here.

## Why it matters for ORIVILO

Spec ORV-138 rules `expand-1` (`write-guard`) and `switch-1` (`worktree-guard`) read bash text, and the PR 137 reviews found forms that neither rule names. This entry lists the whole class from the manual, git(1) and the coreutils pages, so the architect can bound both rules once (L-0045) and name the rest as bypasses; which forms a guard models, marks unknown or names is left to the architect and the owner.
