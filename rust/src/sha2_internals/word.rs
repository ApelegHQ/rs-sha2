/* Copyright © 2026 Apeleg Limited. All rights reserved.
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

use ::core::ops::{BitAnd, BitOr, BitXor, Not, Shr};

/// Abstracts over the SHA-2 word types (`u32` and `u64`).
pub trait ShaWord:
    Copy
    + Clone
    + Default
    + Eq
    + 'static
    + BitAnd<Output = Self>
    + BitXor<Output = Self>
    + BitOr<Output = Self>
    + Not<Output = Self>
    + Shr<u32, Output = Self>
{
    // const BYTES: usize;
    const ZERO: Self;

    fn from_be_bytes_at(src: &[u8], word_idx: usize) -> Self;
    fn to_be_bytes_at(self, dst: &mut [u8], word_idx: usize);
    // fn rotate_right(self, n: u32) -> Self;
    fn wrapping_add(self, rhs: Self) -> Self;
}

impl ShaWord for u32 {
    // const BYTES: usize = 4;
    const ZERO: Self = 0;

    #[inline]
    fn from_be_bytes_at(src: &[u8], i: usize) -> Self {
        let j = i * 4;
        u32::from_be_bytes([src[j], src[j + 1], src[j + 2], src[j + 3]])
    }

    #[inline]
    fn to_be_bytes_at(self, dst: &mut [u8], i: usize) {
        let j = i * 4;
        let b = self.to_be_bytes();
        dst[j] = b[0];
        dst[j + 1] = b[1];
        dst[j + 2] = b[2];
        dst[j + 3] = b[3];
    }

    /*
    #[inline]
    fn rotate_right(self, n: u32) -> Self {
        u32::rotate_right(self, n)
    }
    */
    #[inline]
    fn wrapping_add(self, rhs: Self) -> Self {
        u32::wrapping_add(self, rhs)
    }
}

impl ShaWord for u64 {
    // const BYTES: usize = 8;
    const ZERO: Self = 0;

    #[inline]
    fn from_be_bytes_at(src: &[u8], i: usize) -> Self {
        let j = i * 8;
        u64::from_be_bytes([
            src[j],
            src[j + 1],
            src[j + 2],
            src[j + 3],
            src[j + 4],
            src[j + 5],
            src[j + 6],
            src[j + 7],
        ])
    }

    #[inline]
    fn to_be_bytes_at(self, dst: &mut [u8], i: usize) {
        let j = i * 8;
        let b = self.to_be_bytes();
        dst[j] = b[0];
        dst[j + 1] = b[1];
        dst[j + 2] = b[2];
        dst[j + 3] = b[3];
        dst[j + 4] = b[4];
        dst[j + 5] = b[5];
        dst[j + 6] = b[6];
        dst[j + 7] = b[7];
    }

    /*
    #[inline]
    fn rotate_right(self, n: u32) -> Self {
        u64::rotate_right(self, n)
    }
    */
    #[inline]
    fn wrapping_add(self, rhs: Self) -> Self {
        u64::wrapping_add(self, rhs)
    }
}
