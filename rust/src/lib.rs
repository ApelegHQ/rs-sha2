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

#![cfg_attr(all(not(feature = "std"), not(test)), no_std)]

#[cfg(all(not(feature = "std"), not(test)))]
#[panic_handler]
fn panic(_info: &::core::panic::PanicInfo) -> ! {
    loop {}
}

#[cfg(all(feature = "std", not(test)))]
extern crate std;

mod sha2_internals;

#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
pub use crate::sha2_internals::ShaVariant;

#[cfg(any(feature = "serialize", feature = "deserialize"))]
pub use crate::sha2_internals::ShaState;

#[cfg(all(
    feature = "sha224",
    any(feature = "serialize", feature = "deserialize")
))]
pub use crate::sha2_internals::Sha224State;
#[cfg(feature = "sha224")]
pub use crate::sha2_internals::{Sha224, Sha224Cfg};

#[cfg(all(
    feature = "sha256",
    any(feature = "serialize", feature = "deserialize")
))]
pub use crate::sha2_internals::Sha256State;
#[cfg(feature = "sha256")]
pub use crate::sha2_internals::{Sha256, Sha256Cfg};

#[cfg(all(
    feature = "sha384",
    any(feature = "serialize", feature = "deserialize")
))]
pub use crate::sha2_internals::Sha384State;
#[cfg(feature = "sha384")]
pub use crate::sha2_internals::{Sha384, Sha384Cfg};

#[cfg(all(
    feature = "sha512",
    any(feature = "serialize", feature = "deserialize")
))]
pub use crate::sha2_internals::Sha512State;
#[cfg(feature = "sha512")]
pub use crate::sha2_internals::{Sha512, Sha512Cfg};

#[cfg(all(
    feature = "sha512_256",
    any(feature = "serialize", feature = "deserialize")
))]
pub use crate::sha2_internals::Sha512_256State;
#[cfg(feature = "sha512_256")]
pub use crate::sha2_internals::{Sha512_256, Sha512_256Cfg};

pub fn x() {
    let _ = Sha256State::from(Sha256::new());
}
