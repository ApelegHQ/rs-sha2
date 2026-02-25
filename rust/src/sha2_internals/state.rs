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

#[cfg(all(
    any(feature = "deserialize", feature = "serialize",),
    any(
        feature = "sha224",
        feature = "sha256",
        feature = "sha384",
        feature = "sha512",
        feature = "sha512_256"
    )
))]
use {
    super::{engine::ShaEngine, family::ShaFamily, hasher::ShaHasher, variant::ShaVariant},
    ::core::marker::PhantomData,
};

/// Serialised hasher checkpoint.
///
/// `SERIAL` = `STATE_BYTES + BLOCK + 1 + LEN_BYTES`
/// (105 for 32-bit families, 209 for 64-bit families).
///
/// Layout (all big-endian):
///   `[0            .. STATE_BYTES]`           8 chaining-state words
///   `[STATE_BYTES  .. STATE_BYTES + BLOCK]`   block buffer
///   `[STATE_BYTES + BLOCK]`                   buffer_len  (`u8`)
///   `[STATE_BYTES + BLOCK + 1 .. SERIAL]`     total_len
#[cfg(all(
    any(feature = "deserialize", feature = "serialize",),
    any(
        feature = "sha224",
        feature = "sha256",
        feature = "sha384",
        feature = "sha512",
        feature = "sha512_256"
    )
))]
pub struct ShaState<V: ShaVariant, const BLOCK: usize, const SERIAL: usize> {
    pub(super) inner: [u8; SERIAL],
    _variant: PhantomData<V>,
}

// ---- accessors ------------------------------------------------------------

#[cfg(all(
    any(feature = "deserialize", feature = "serialize",),
    any(
        feature = "sha224",
        feature = "sha256",
        feature = "sha384",
        feature = "sha512",
        feature = "sha512_256"
    )
))]
impl<V: ShaVariant, const B: usize, const S: usize> ShaState<V, B, S> {
    pub const RAW_SIZE: usize = S;

    /// Byte offset where the buffer region begins.
    #[inline]
    fn sb() -> usize {
        <V::Family as ShaFamily>::STATE_BYTES
    }

    pub fn state(&self) -> [<V::Family as ShaFamily>::Word; 8] {
        ShaEngine::<V::Family>::import(&self.inner[..Self::sb()])
    }

    pub fn buffer(&self) -> [u8; B] {
        let sb = Self::sb();
        let mut buf = [0u8; B];
        buf.copy_from_slice(&self.inner[sb..sb + B]);
        buf
    }

    pub fn buffer_len(&self) -> Option<usize> {
        let bl = self.inner[Self::sb() + B];
        if bl as usize >= B {
            return None;
        }
        Some(bl as usize)
    }

    pub fn total_len(&self) -> u128 {
        let off = Self::sb() + B + 1;
        <V::Family>::read_len(&self.inner[off..])
    }

    #[cfg(feature = "serialize")]
    pub fn raw(&self) -> &[u8; S] {
        &self.inner
    }

    #[cfg(test)]
    pub fn set_buffer_len(&mut self, len: u8) {
        self.inner[Self::sb() + B] = len;
    }
}

// ---- From<&ShaHasher> → ShaState -----------------------------------------

#[cfg(all(
    feature = "serialize",
    any(
        feature = "sha224",
        feature = "sha256",
        feature = "sha384",
        feature = "sha512",
        feature = "sha512_256"
    )
))]
impl<V: ShaVariant, const B: usize, const D: usize, const S: usize> From<&ShaHasher<V, B, D>>
    for ShaState<V, B, S>
{
    fn from(h: &ShaHasher<V, B, D>) -> Self {
        let sb = <V::Family as ShaFamily>::STATE_BYTES;
        let mut inner = [0u8; S];

        h.engine.export(&mut inner[..sb]);
        inner[sb..sb + B].copy_from_slice(&h.buffer);
        inner[sb + B] = h.buffer_len as u8;
        <V::Family>::write_len(h.total_len, &mut inner[sb + B + 1..]);

        ShaState {
            inner,
            _variant: PhantomData,
        }
    }
}

#[cfg(all(
    feature = "serialize",
    any(
        feature = "sha224",
        feature = "sha256",
        feature = "sha384",
        feature = "sha512",
        feature = "sha512_256"
    )
))]
impl<V: ShaVariant, const B: usize, const D: usize, const S: usize> From<ShaHasher<V, B, D>>
    for ShaState<V, B, S>
{
    fn from(h: ShaHasher<V, B, D>) -> Self {
        Self::from(&h)
    }
}

// ---- TryFrom<&ShaState> → ShaHasher --------------------------------------

#[cfg(all(
    feature = "deserialize",
    any(
        feature = "sha224",
        feature = "sha256",
        feature = "sha384",
        feature = "sha512",
        feature = "sha512_256"
    )
))]
impl<V: ShaVariant, const B: usize, const D: usize, const S: usize> TryFrom<&ShaState<V, B, S>>
    for ShaHasher<V, B, D>
{
    type Error = &'static str;

    fn try_from(s: &ShaState<V, B, S>) -> Result<Self, Self::Error> {
        let buffer_len = s.buffer_len().ok_or("invalid buffer_len")?;
        Ok(ShaHasher {
            engine: ShaEngine::new(s.state()),
            buffer: s.buffer(),
            buffer_len,
            total_len: s.total_len(),
            _variant: PhantomData,
        })
    }
}

#[cfg(all(
    feature = "deserialize",
    any(
        feature = "sha224",
        feature = "sha256",
        feature = "sha384",
        feature = "sha512",
        feature = "sha512_256"
    )
))]
impl<V: ShaVariant, const B: usize, const D: usize, const S: usize> TryFrom<ShaState<V, B, S>>
    for ShaHasher<V, B, D>
{
    type Error = &'static str;
    fn try_from(s: ShaState<V, B, S>) -> Result<Self, Self::Error> {
        Self::try_from(&s)
    }
}
