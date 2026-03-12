# bitwise

Visualize bitwise operations on two integers — AND, OR, XOR, NAND, NOR, and left/right shifts — with binary and decimal output side by side.

## Overview

Enter any two integers (A and B) and the tool computes all operations simultaneously. Each result shows both the 32-bit binary representation and the signed decimal value. All arithmetic uses JavaScript's native 32-bit signed integer semantics.

## Operations

| Operation | Expression | Description |
|-----------|-----------|-------------|
| AND | `a & b` | 1 only where both bits are 1 |
| OR | `a \| b` | 1 where either bit is 1 |
| XOR | `a ^ b` | 1 where bits differ |
| NAND | `~(a & b)` | Bitwise NOT of AND |
| NOR | `~(a \| b)` | Bitwise NOT of OR |
| SHL | `a << 1` | Shift A left by 1 (multiply by 2) |
| SHR | `a >> 1` | Shift A right by 1 (signed, divide by 2) |

## Binary representation

The binary display uses unsigned 32-bit representation (`n >>> 0`), grouped into nibbles for readability. Decimal values are signed 32-bit integers, so negative results (e.g. from NAND/NOR) are displayed as negative numbers.

## URL parameters

The tool syncs `?a=<n>&b=<n>` into the URL so you can bookmark or share specific inputs.
