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

macro_rules! impl_sha_init {
    ($fn_name:ident, $sha_ty:ty) => {
        #[doc = "# Safety"]
        #[doc = ""]
        #[doc = "C bindings. Caller is responsible for ensuring memory correctness."]
        #[cfg(feature = "streaming")]
        #[unsafe(no_mangle)]
        pub unsafe extern "C" fn $fn_name(ctx: *mut $sha_ty, ctx_size: usize) -> usize {
            let size = ::core::mem::size_of::<$sha_ty>();

            if !ctx.is_null() {
                if ctx_size < size {
                    return 0;
                }

                let ctx = unsafe { &mut *ctx };
                *ctx = <$sha_ty>::new();
            }

            size
        }
    };
}

macro_rules! impl_sha_reset {
    ($fn_name:ident, $sha_ty:ty) => {
        #[doc = "# Safety"]
        #[doc = ""]
        #[doc = "C bindings. Caller is responsible for ensuring memory correctness."]
        #[cfg(feature = "streaming")]
        #[unsafe(no_mangle)]
        pub unsafe extern "C" fn $fn_name(ctx: *mut $sha_ty) {
            let ctx = unsafe { &mut *ctx };
            ctx.reset();
        }
    };
}

macro_rules! impl_sha_update {
    ($fn_name:ident, $sha_ty:ty) => {
        #[doc = "# Safety"]
        #[doc = ""]
        #[doc = "C bindings. Caller is responsible for ensuring memory correctness."]
        #[cfg(feature = "streaming")]
        #[unsafe(no_mangle)]
        pub unsafe extern "C" fn $fn_name(ctx: *mut $sha_ty, data: *const u8, data_size: usize) {
            if data.is_null() && data_size != 0 {
                return;
            }

            let ctx = unsafe { &mut *ctx };
            let data = unsafe { ::core::slice::from_raw_parts(data, data_size) };
            ctx.update(data);
        }
    };
}

macro_rules! impl_sha_finalize {
    ($fn_name:ident, $sha_ty:ty, $cfg_ty:ty) => {
        #[doc = "# Safety"]
        #[doc = ""]
        #[doc = "C bindings. Caller is responsible for ensuring memory correctness."]
        #[cfg(feature = "streaming")]
        #[unsafe(no_mangle)]
        pub unsafe extern "C" fn $fn_name(
            ctx: *mut $sha_ty,
            result_ptr: *mut u8,
            result_size: usize,
        ) -> usize {
            let size = <$cfg_ty>::DIGEST_BYTES;

            if !result_ptr.is_null() {
                if result_size < size {
                    return 0;
                }

                let ctx = unsafe { &mut *ctx };
                let result_buf = unsafe { ::core::slice::from_raw_parts_mut(result_ptr, size) };
                let result = ctx.finalize();
                result_buf.copy_from_slice(&result);
            }

            size
        }
    };
}

macro_rules! impl_sha_digest {
    ($fn_name:ident, $sha_ty:ty, $cfg_ty:ty) => {
        #[doc = "# Safety"]
        #[doc = ""]
        #[doc = "C bindings. Caller is responsible for ensuring memory correctness."]
        #[cfg(feature = "sync")]
        #[unsafe(no_mangle)]
        pub unsafe extern "C" fn $fn_name(
            result_ptr: *mut u8,
            result_size: usize,
            data: *const u8,
            data_size: usize,
        ) -> usize {
            let size = <$cfg_ty>::DIGEST_BYTES;

            if !result_ptr.is_null() {
                if result_size < size {
                    return 0;
                }

                let data = unsafe { ::core::slice::from_raw_parts(data, data_size) };
                let result_buf = unsafe { ::core::slice::from_raw_parts_mut(result_ptr, size) };
                let result = <$sha_ty>::digest(data);
                result_buf.copy_from_slice(&result);
            }

            size
        }
    };
}

macro_rules! impl_sha_serialize {
    ($fn_name:ident, $sha_ty:ty, $state_ty:ty) => {
        #[doc = "# Safety"]
        #[doc = ""]
        #[doc = "C bindings. Caller is responsible for ensuring memory correctness."]
        #[cfg(all(feature = "streaming", feature = "serialize"))]
        #[unsafe(no_mangle)]
        pub unsafe extern "C" fn $fn_name(
            result_ptr: *mut u8,
            result_size: usize,
            ctx: *const $sha_ty,
        ) -> usize {
            let size = <$state_ty>::RAW_SIZE;

            if !result_ptr.is_null() {
                if result_size < size {
                    return 0;
                }

                let ctx = unsafe { &*ctx };
                let result_buf = unsafe { ::core::slice::from_raw_parts_mut(result_ptr, size) };
                result_buf.copy_from_slice(<$state_ty>::from(ctx).raw());
            }

            size
        }
    };
}

macro_rules! impl_sha_deserialize {
    ($fn_name:ident, $sha_ty:ty, $state_ty:ty) => {
        #[doc = "# Safety"]
        #[doc = ""]
        #[doc = "C bindings. Caller is responsible for ensuring memory correctness."]
        #[cfg(all(feature = "streaming", feature = "deserialize"))]
        #[unsafe(no_mangle)]
        pub unsafe extern "C" fn $fn_name(
            ctx: *mut $sha_ty,
            ctx_size: usize,
            state: *const $state_ty,
            state_size: usize,
        ) -> usize {
            let size = ::core::mem::size_of::<$sha_ty>();

            if !ctx.is_null() {
                if state_size != <$state_ty>::RAW_SIZE || ctx_size < size {
                    return 0;
                }

                let state = unsafe { &*state };
                let ctx = unsafe { &mut *ctx };
                match <$sha_ty>::try_from(state) {
                    Ok(result) => *ctx = result,
                    Err(_) => return 0,
                }
            }

            size
        }
    };
}

#[cfg(feature = "sha224")]
mod sha224;
#[cfg(feature = "sha256")]
mod sha256;
#[cfg(feature = "sha384")]
mod sha384;
#[cfg(feature = "sha512")]
mod sha512;
#[cfg(feature = "sha512_224")]
mod sha512_224;
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
    #[cfg(feature = "sha512_224")]
    pub use super::sha512_224::*;
    #[cfg(feature = "sha512_256")]
    pub use super::sha512_256::*;
}

#[cfg(all(
    any(
        feature = "sha224",
        feature = "sha256",
        feature = "sha384",
        feature = "sha512",
        feature = "sha512_224",
        feature = "sha512_256"
    ),
    any(feature = "streaming", feature = "sync")
))]
pub use exports::*;
