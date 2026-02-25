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

mod engine;
mod family;
mod hasher;
mod state;
mod variant;
mod word;

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
pub use self::state::ShaState;
#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
pub use self::{hasher::ShaHasher, variant::ShaVariant};

#[cfg(feature = "sha224")]
pub use self::variant::Sha224Cfg;
#[cfg(feature = "sha256")]
pub use self::variant::Sha256Cfg;
#[cfg(feature = "sha384")]
pub use self::variant::Sha384Cfg;
#[cfg(feature = "sha512_256")]
pub use self::variant::Sha512_256Cfg;
#[cfg(feature = "sha512")]
pub use self::variant::Sha512Cfg;

// ======================== hasher aliases ====================================
//                                    Variant         Block  Digest
#[cfg(feature = "sha224")]
pub type Sha224 = ShaHasher<Sha224Cfg, 64, 28>;
#[cfg(feature = "sha256")]
pub type Sha256 = ShaHasher<Sha256Cfg, 64, 32>;
#[cfg(feature = "sha384")]
pub type Sha384 = ShaHasher<Sha384Cfg, 128, 48>;
#[cfg(feature = "sha512")]
pub type Sha512 = ShaHasher<Sha512Cfg, 128, 64>;
#[cfg(feature = "sha512_256")]
pub type Sha512_256 = ShaHasher<Sha512_256Cfg, 128, 32>;

// ==================== serialised-state aliases =============================
//                                    Variant         Block  Serial
//                                                   (STATE_BYTES+BLOCK+1+LEN_BYTES)

#[cfg(all(
    any(feature = "deserialize", feature = "serialize",),
    feature = "sha224",
))]
pub type Sha224State = ShaState<Sha224Cfg, 64, 105>;
#[cfg(all(
    any(feature = "deserialize", feature = "serialize",),
    feature = "sha256",
))]
pub type Sha256State = ShaState<Sha256Cfg, 64, 105>;
#[cfg(all(
    any(feature = "deserialize", feature = "serialize",),
    feature = "sha384",
))]
pub type Sha384State = ShaState<Sha384Cfg, 128, 209>;
#[cfg(all(
    any(feature = "deserialize", feature = "serialize",),
    feature = "sha512",
))]
pub type Sha512State = ShaState<Sha512Cfg, 128, 209>;
#[cfg(all(
    any(feature = "deserialize", feature = "serialize",),
    feature = "sha512_256",
))]
pub type Sha512_256State = ShaState<Sha512_256Cfg, 128, 209>;

#[cfg(test)]
mod tests;
