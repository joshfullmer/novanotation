# Nova Notation

A compact, handwriting-first notation for recording dice state in Nova. Designed for a
pen-and-paper scoresheet at tournaments, and for machine validation of the transcript.

## Vocabulary

| Term       | Meaning                                                              |
| ---------- | -------------------------------------------------------------------- |
| WE / THEY  | The sheet author and their opponent. Fixed for the whole sheet.      |
| fixer      | A player's unrolled dice. Everyone starts with d4 d6 d8 d10 d12 d20. |
| gigs       | Rolled dice, each showing a value. Dice in gigs can be stolen.       |
| owner      | Whose dice set a die came from. Never changes.                       |
| controller | Whose gigs a die currently sits in. Changes on a steal.              |
| turn       | One player's turn. Turn 1 belongs to whoever went first.             |
| instant    | A move made by the non-active player during the other player's turn. |

## Grammar

```
document := header? turn*
header   := "first:" ("WE" | "THEY")          ; optional, default WE
turn     := prefix? ( entry+ | ".." )         ; one turn per line; ".." = pass
prefix   := number ("|" | ".")?               ; optional, must match line position
entry    := move | "(" move+ ")"              ; parenthesised = instant by the other player
move     := action? die owner? value?
action   := "x" | "+" | "-" | "=" | "~"       ; absent = roll
die      := "A" | "B" | "C" | "D" | "E" | "F" ; d4 d6 d8 d10 d12 d20
owner    := "'"                               ; THEY's die; absent = WE's
value    := 1..20                             ; required except on a steal
comment  := ";" to end of line                ; ignored
```

Whitespace between entries is required on paper for legibility, though the grammar is
prefix-free and the parser tolerates its absence. A blank line mid-game is an error, not a
pass. Comment-only lines are not turns.

## Moves

| Action    | Written | Effect                                                        | Legal when                                                                  |
| --------- | ------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Roll      | `B4`    | Die leaves the actor's fixer, joins their gigs showing 4      | Die is the actor's own and in their fixer. d20 only when it is the last die |
| Steal     | `xB'`   | Die moves from the opponent's gigs to the actor's, value kept | Die is in the opponent's gigs. Optional value must equal the current one    |
| Increment | `+B5`   | Value becomes 5                                               | Die is in someone's gigs; 5 > current; 5 ≤ sides                            |
| Decrement | `-B2`   | Value becomes 2                                               | Die is in someone's gigs; 2 < current; 2 ≥ 1                                |
| Set       | `=B3`   | Value becomes 3                                               | Die is in someone's gigs; 1 ≤ 3 ≤ sides                                     |
| Reroll    | `~B6`   | Value becomes 6                                               | Same as Set; differs only in provenance                                     |

The actor is never written. It is the player whose turn it is, or the other player when the
move is in parentheses. Any player may modify any gig die on their turn, including dice the
opponent controls. Stealing your own die back is a steal.

## Instants

`( … )` wraps moves the non-active player made during the active player's turn, placed where
they resolved:

```
5| C8 -B1 (-A'2)      ; WE rolls, lowers own d6; THEY answers by lowering their own d4
```

Instants may only modify values (`+ - = ~`). They may not roll or steal, because control
cannot change in the instant window. Write moves in **resolution** order, not declaration order:
the validator threads state left to right.

## Turn order and actor

Odd turns belong to the first player, even turns to the second. The `first:` header says who
that is. Without it, WE went first.

```
first: THEY
1| A'3        ; THEY
2| A2         ; WE
```

## Winning

- **Regulation.** A player who starts their own turn controlling 7 or more gigs wins. The win
  is declared at the start of that turn, so it can land on a row never written: a sheet that
  ends after turn 10 with WE holding 8 dice reads "WE wins, start of turn 11".
- **Overtime.** From turn 15 onward, a steal that brings the actor to 7 wins immediately.
- The validator only declares a win at the start of the turn immediately after the last
  written one. If the opponent's intervening turn is missing, the outcome is undecided.
- Any move or pass written after the game has ended is an error.
- 16 turns is a soft cap. Longer games are warned about, not rejected.

Draws, concessions, and time are not dice state. They live in the scoresheet's result box
and notes.

## Worked example

```
first: WE
1| A4 -A1            ; WE: A1
2| A'4               ; THEY: A'4
3| B4 -B2            ; WE: A1 B2
4| B'1               ; THEY: A'4 B'1
5| C8 -B1 (-A'2)     ; WE: A1 B1 C8        THEY: A'2 B'1
6| C'3 xC            ; WE: A1 B1           THEY: A'2 B'1 C'3 C8
7| D6 -D4 xB' xA'    ; WE: A1 B1 D4 B'1 A'2   THEY: C'3 C8
8| D'4               ; THEY: C'3 C8 D'4
9| E12 xC' xD'       ; WE: 8 dice          THEY: C8
10| E'12             ; THEY: C8 E'12
```

WE wins at the start of turn 11.

## Scoresheet

One landscape sheet per best-of-three match, three columns, one game each.

- Sheet header: names, round, table, and a one-line legend:
  `A d4  B d6  C d8  D d10  E d12  F d20  |  ' theirs  x steal  + - = ~ modify  ( ) instant  .. pass`
- Per game: `first: WE / THEY` circle, twenty numbered rows (1–16 regulation, 17–20
  overflow, 15+ shaded as overtime), `result: WE / THEY / draw` circle, a few lines of notes.
- Turn numbers are printed, never written. Odd rows lightly shaded.
- Rows are about 30 characters wide. A busy turn is 15.

## Design notes

- **Why letters for dice.** A digit die next to a digit value (`63`) is unreadable in ink.
  A letter always leads a move, so `B3` cannot be misread, and `B` vs `8` is resolved by
  position.
- **Why the prime is relative to the sheet author, not to who went first.** In a best of three
  the loser chooses who goes first, so an absolute scheme would flip the prime between games
  on the same sheet. Two players' sheets of the same game differ by a consistent prime flip
  plus the `first:` circle; the validator can normalise one to the other.
- **Why `+` and `-` survive although derivable.** They are checksums. A `+` on a die that went
  down is a transcription error caught on the spot.
- **Why no value on steals.** The die keeps its value. An optional value is allowed as a
  checksum and must match. An effect that changes a value on steal is written as a separate
  move: `xB' -B'2`.
