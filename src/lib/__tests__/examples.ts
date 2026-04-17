// Valid: exercises all six actions across a short match sequence.
// Trace:
//   w|4w3  → w.gigs=[4w3]
//   t|4t4  → t.gigs=[4t4]
//   w|6w2  → w.gigs=[4w3,6w2]
//   t|6t4  → t.gigs=[4t4,6t4]
//   w+6w5  → w.gigs=[4w3,6w5]        (+3 via card effect)
//   t$6w5  → w.gigs=[4w3] t.gigs=[4t4,6t4,6w5]
//   w|8w7  → w.gigs=[4w3,8w7]
//   t-6w3  → t.gigs=[4t4,6t4,6w3]   (-2 via card effect)
//   w.8w4  → w.gigs=[4w3,8w4]
//   t@4t3  → t.gigs=[4t3,6t4,6w3]
export const VALID_EXAMPLE = `\
w|4w3
t|4t4
w|6w2
t|6t4
w+6w5
t$6w5
w|8w7
t-6w3
w.8w4
t@4t3`;

// Invalid: seven lines producing six distinct errors.
// Line 0: steal before any die is in gigs
// Line 1: valid (state advances here)
// Line 2: roll value 0 on d6 (below min — d4 already used by line 1)
// Line 3: d20 before others claimed
// Line 4: roll value 7 on a d6 (above max)
// Line 5: increment a die still in fixer
// Line 6: malformed notation
export const INVALID_EXAMPLE = `\
w$6t4
w|4w3
w|6w0
w|20w15
w|6w7
t+4t3
NOT_VALID`;
