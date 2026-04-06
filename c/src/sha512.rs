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

#[cfg(any(feature = "streaming", feature = "sync"))]
use ::sha2::Sha512;
#[cfg(all(
    feature = "streaming",
    any(feature = "deserialize", feature = "serialize")
))]
use ::sha2::Sha512State;
#[cfg(any(feature = "streaming", feature = "sync"))]
use ::sha2::{Sha512Cfg, ShaVariant};

impl_sha_init!(sha512_init, Sha512);
impl_sha_reset!(sha512_reset, Sha512);
impl_sha_update!(sha512_update, Sha512);
impl_sha_finalize!(sha512_finalize, Sha512, Sha512Cfg);
impl_sha_digest!(sha512_digest, Sha512, Sha512Cfg);
impl_sha_serialize!(sha512_serialize, Sha512, Sha512State);
impl_sha_deserialize!(sha512_deserialize, Sha512, Sha512State);
