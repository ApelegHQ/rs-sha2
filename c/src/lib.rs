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

#[cfg(all(
    not(feature = "std"),
    not(test),
    not(all(
        any(
            feature = "sha224",
            feature = "sha256",
            feature = "sha384",
            feature = "sha512",
            feature = "sha512_256"
        ),
        any(feature = "streaming", feature = "sync")
    ))
))]
#[panic_handler]
fn panic(_info: &::core::panic::PanicInfo) -> ! {
    loop {}
}

#[cfg(feature = "sha224")]
mod sha224;
#[cfg(feature = "sha256")]
mod sha256;
#[cfg(feature = "sha384")]
mod sha384;
#[cfg(feature = "sha512")]
mod sha512;
#[cfg(feature = "sha512_256")]
mod sha512_256;

#[cfg(any(feature = "streaming", feature = "sync"))]
mod exports {
    #[cfg(feature = "sha224")]
    pub use super::sha224::*;
    #[cfg(feature = "sha256")]
    pub use super::sha256::*;
    #[cfg(feature = "sha384")]
    pub use super::sha384::*;
    #[cfg(feature = "sha512")]
    pub use super::sha512::*;
    #[cfg(feature = "sha512_256")]
    pub use super::sha512_256::*;
}

#[cfg(all(
        any(
            feature = "sha224",
            feature = "sha256",
            feature = "sha384",
            feature = "sha512",
            feature = "sha512_256"
        ),
    any(feature = "streaming", feature = "sync"))
)]
pub use exports::*;
