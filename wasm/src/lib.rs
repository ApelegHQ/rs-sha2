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

#[cfg(all(feature = "std", not(test)))]
extern crate std;

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

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(all(target_family = "wasm", feature = "wee_alloc"))]
#[global_allocator]
static ALLOC: ::wee_alloc::WeeAlloc = ::wee_alloc::WeeAlloc::INIT;

#[cfg(all(
    any(
        feature = "sha224",
        feature = "sha256",
        feature = "sha384",
        feature = "sha512",
        feature = "sha512_256"
    ),
    any(feature = "sync", feature = "streaming")
))]
pub use c_sha2::*;
