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
use ::sha2::Sha224;
#[cfg(all(
    feature = "streaming",
    any(feature = "deserialize", feature = "serialize")
))]
use ::sha2::Sha224State;
#[cfg(any(feature = "streaming", feature = "sync"))]
use ::sha2::{Sha224Cfg, ShaVariant};

/// # Safety
///
/// C bindings. Caller is responsible for ensuring memory correctness.
#[cfg(feature = "streaming")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sha224_init(s: *mut Sha224) -> usize {
    if !s.is_null() {
        let s = unsafe { &mut *s };
        *s = Sha224::new();
    }

    ::core::mem::size_of::<Sha224>()
}

/// # Safety
///
/// C bindings. Caller is responsible for ensuring memory correctness.
#[cfg(feature = "streaming")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sha224_reset(s: *mut Sha224) {
    let s = unsafe { &mut *s };
    s.reset();
}

/// # Safety
///
/// C bindings. Caller is responsible for ensuring memory correctness.
#[cfg(feature = "streaming")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sha224_update(s: *mut Sha224, data: *const u8, len: usize) {
    let s = unsafe { &mut *s };
    let data = unsafe { ::core::slice::from_raw_parts(data, len) };
    s.update(data);
}

/// # Safety
///
/// C bindings. Caller is responsible for ensuring memory correctness.
#[cfg(feature = "streaming")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sha224_finalize(s: *mut Sha224, result_ptr: *mut u8) -> usize {
    if !result_ptr.is_null() {
        let s = unsafe { &mut *s };
        let result_buf =
            unsafe { ::core::slice::from_raw_parts_mut(result_ptr, Sha224Cfg::DIGEST_BYTES) };
        let result = s.finalize();
        result_buf.copy_from_slice(&result);
    }

    Sha224Cfg::DIGEST_BYTES
}

/// # Safety
///
/// C bindings. Caller is responsible for ensuring memory correctness.
#[cfg(feature = "sync")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sha224_digest(data: *const u8, len: usize, result_ptr: *mut u8) -> usize {
    if !result_ptr.is_null() {
        let data = unsafe { ::core::slice::from_raw_parts(data, len) };
        let result_buf =
            unsafe { ::core::slice::from_raw_parts_mut(result_ptr, Sha224Cfg::DIGEST_BYTES) };
        let result = Sha224::digest(data);
        result_buf.copy_from_slice(&result);
    }

    Sha224Cfg::DIGEST_BYTES
}

/// # Safety
///
/// C bindings. Caller is responsible for ensuring memory correctness.
#[cfg(all(feature = "streaming", feature = "serialize"))]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sha224_serialize(s: *const Sha224, result_ptr: *mut u8) -> usize {
    if !result_ptr.is_null() {
        let s = unsafe { &*s };
        let result_buf =
            unsafe { ::core::slice::from_raw_parts_mut(result_ptr, Sha224State::RAW_SIZE) };
        result_buf.copy_from_slice(<Sha224State>::from(s).raw());
    }

    Sha224State::RAW_SIZE
}

/// # Safety
///
/// C bindings. Caller is responsible for ensuring memory correctness.
#[cfg(all(feature = "streaming", feature = "deserialize"))]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sha224_deserialize(state: *const Sha224State, s: *mut Sha224) -> usize {
    if !s.is_null() {
        let state = unsafe { &*state };
        let s = unsafe { &mut *s };
        let result = <Sha224>::try_from(state);
        match result {
            Ok(result) => *s = result,
            Err(_) => return 0,
        }
    }

    ::core::mem::size_of::<Sha224>()
}
