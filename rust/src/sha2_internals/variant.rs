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

#[cfg(any(feature = "sha224", feature = "sha256"))]
use super::family::Sha2_32;
#[cfg(any(feature = "sha384", feature = "sha512", feature = "sha512_256"))]
use super::family::Sha2_64;
#[cfg(any(
    test,
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
use super::family::ShaFamily;

/// A specific SHA-2 algorithm. Two constants over a shared
/// [`ShaFamily`] fully define a variant.
#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
pub trait ShaVariant: 'static {
    type Family: ShaFamily;
    /// Initial hash values.
    const IV: [<Self::Family as ShaFamily>::Word; 8];
    /// Digest output length in bytes.
    const DIGEST_BYTES: usize;
}

// ---- 32-bit variants -----------------------------------------------------

#[cfg(feature = "sha256")]
pub struct Sha256Cfg;
#[cfg(feature = "sha256")]
impl ShaVariant for Sha256Cfg {
    type Family = Sha2_32;
    const IV: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];
    const DIGEST_BYTES: usize = 32;
}

#[cfg(feature = "sha224")]
pub struct Sha224Cfg;
#[cfg(feature = "sha224")]
impl ShaVariant for Sha224Cfg {
    type Family = Sha2_32;
    const IV: [u32; 8] = [
        0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7,
        0xbefa4fa4,
    ];
    const DIGEST_BYTES: usize = 28;
}

// ---- 64-bit variants -----------------------------------------------------

#[cfg(feature = "sha512")]
pub struct Sha512Cfg;
#[cfg(feature = "sha512")]
impl ShaVariant for Sha512Cfg {
    type Family = Sha2_64;
    const IV: [u64; 8] = [
        0x6a09e667f3bcc908,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    ];
    const DIGEST_BYTES: usize = 64;
}

#[cfg(feature = "sha384")]
pub struct Sha384Cfg;
#[cfg(feature = "sha384")]
impl ShaVariant for Sha384Cfg {
    type Family = Sha2_64;
    const IV: [u64; 8] = [
        0xcbbb9d5dc1059ed8,
        0x629a292a367cd507,
        0x9159015a3070dd17,
        0x152fecd8f70e5939,
        0x67332667ffc00b31,
        0x8eb44a8768581511,
        0xdb0c2e0d64f98fa7,
        0x47b5481dbefa4fa4,
    ];
    const DIGEST_BYTES: usize = 48;
}

#[cfg(feature = "sha512_256")]
pub struct Sha512_256Cfg;
#[cfg(feature = "sha512_256")]
impl ShaVariant for Sha512_256Cfg {
    type Family = Sha2_64;
    const IV: [u64; 8] = [
        0x22312194fc2bf72c,
        0x9f555fa3c84c64c2,
        0x2393b86b6f53b151,
        0x963877195940eabd,
        0x96283ee2a88effe3,
        0xbe5e1e2553863992,
        0x2b0199fc2c85b8aa,
        0x0eb72ddc81c52ca2,
    ];
    const DIGEST_BYTES: usize = 32;
}
