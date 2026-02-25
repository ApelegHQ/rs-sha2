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
use {
    super::{engine::ShaEngine, family::ShaFamily, variant::ShaVariant},
    ::core::marker::PhantomData,
};

/// Incremental SHA-2 hasher, generic over any [`ShaVariant`].
///
/// `BLOCK` = block size in bytes, `DIGEST` = output length in bytes.
/// Use the type aliases in `lib.rs` instead of spelling these out.
#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
pub struct ShaHasher<V: ShaVariant, const BLOCK: usize, const DIGEST: usize> {
    pub(super) engine: ShaEngine<V::Family>,
    pub(super) buffer: [u8; BLOCK],
    pub(super) buffer_len: usize,
    pub(super) total_len: u128,
    pub(crate) _variant: PhantomData<V>,
}

#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
impl<V: ShaVariant, const B: usize, const D: usize> Default for ShaHasher<V, B, D> {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
impl<V: ShaVariant, const B: usize, const D: usize> ShaHasher<V, B, D> {
    /// Create a new hasher initialised with the variant's IV.
    pub fn new() -> Self {
        Self {
            engine: ShaEngine::new(V::IV),
            buffer: [0u8; B],
            buffer_len: 0,
            total_len: 0,
            _variant: PhantomData,
        }
    }

    /// Reset to initial state so the hasher can be reused.
    pub fn reset(&mut self) {
        self.engine = ShaEngine::new(V::IV);
        self.buffer_len = 0;
        self.total_len = 0;
    }

    /// Feed data into the hasher.  May be called repeatedly.
    pub fn update(&mut self, data: &[u8]) {
        self.total_len += data.len() as u128;
        let mut offset = 0;

        if self.buffer_len > 0 {
            let needed = B - self.buffer_len;
            if data.len() >= needed {
                self.buffer[self.buffer_len..B].copy_from_slice(&data[..needed]);
                self.engine.compress(&self.buffer);
                self.buffer_len = 0;
                offset = needed;
            } else {
                self.buffer[self.buffer_len..self.buffer_len + data.len()].copy_from_slice(data);
                self.buffer_len += data.len();
                return;
            }
        }

        while offset + B <= data.len() {
            self.engine.compress(&data[offset..offset + B]);
            offset += B;
        }

        let remaining = data.len() - offset;
        if remaining > 0 {
            self.buffer[..remaining].copy_from_slice(&data[offset..]);
            self.buffer_len = remaining;
        }
    }

    /// Finalize and return the digest.
    pub fn finalize(&mut self) -> [u8; D] {
        type F<V> = <V as ShaVariant>::Family;
        let pad_threshold = B - <F<V> as ShaFamily>::LEN_BYTES;

        // 0x80 sentinel
        self.buffer[self.buffer_len] = 0x80;
        self.buffer_len += 1;

        // If no room for the length field, flush an extra block.
        if self.buffer_len > pad_threshold {
            let mut i = self.buffer_len;
            while i < B {
                self.buffer[i] = 0;
                i += 1;
            }
            self.engine.compress(&self.buffer);
            self.buffer_len = 0;
        }

        // Zero-fill up to the length field.
        let mut i = self.buffer_len;
        while i < pad_threshold {
            self.buffer[i] = 0;
            i += 1;
        }

        // Append bit-length in big-endian.
        <F<V>>::encode_bit_len(self.total_len, &mut self.buffer[pad_threshold..]);
        self.engine.compress(&self.buffer);

        // Export state and truncate to DIGEST bytes.
        // 64 bytes is the largest possible state (8 × u64).
        let mut full = [0u8; 64];
        self.engine
            .export(&mut full[..<F<V> as ShaFamily>::STATE_BYTES]);

        let mut out = [0u8; D];
        out.copy_from_slice(&full[..D]);
        out
    }

    /// One-shot convenience.
    #[cfg(feature = "sync")]
    pub fn digest(data: &[u8]) -> [u8; D] {
        let mut h = Self::new();
        h.update(data);
        h.finalize()
    }
}
