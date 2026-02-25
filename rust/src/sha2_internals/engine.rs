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

#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
use super::{family::ShaFamily, word::ShaWord};

/// Eight-word chaining state shared by every SHA-2 variant in a family.
#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
pub struct ShaEngine<F: ShaFamily> {
    pub(crate) words: [F::Word; 8],
}

#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
impl<F: ShaFamily> ShaEngine<F> {
    pub fn new(iv: [F::Word; 8]) -> Self {
        Self { words: iv }
    }

    #[inline]
    pub fn compress(&mut self, block: &[u8]) {
        F::compress(&mut self.words, block);
    }

    /// Serialize the eight state words as big-endian bytes.
    pub fn export(&self, out: &mut [u8]) {
        for (i, &w) in self.words.iter().enumerate() {
            w.to_be_bytes_at(out, i);
        }
    }

    /// Deserialize eight big-endian words from `src`.
    #[cfg(feature = "deserialize")]
    pub fn import(src: &[u8]) -> [F::Word; 8] {
        let mut words = [F::Word::ZERO; 8];
        let mut i = 0;
        while i < 8 {
            words[i] = F::Word::from_be_bytes_at(src, i);
            i += 1;
        }
        words
    }
}
