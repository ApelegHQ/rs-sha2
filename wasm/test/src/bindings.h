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

#ifndef RS_SHA2_BINDINGS_H
#define RS_SHA2_BINDINGS_H

#pragma once

#include <stdint.h>

#ifdef __cplusplus
extern "C"
{
#endif /* __cplusplus */

struct Sha224;
struct Sha256;
struct Sha384;
struct Sha512;
struct Sha512_256;

struct Sha224State;
struct Sha256State;
struct Sha384State;
struct Sha512State;
struct Sha512_256State;

typedef struct Sha224 Sha224;
typedef struct Sha256 Sha256;
typedef struct Sha384 Sha384;
typedef struct Sha512 Sha512;
typedef struct Sha512_224 Sha512_224;
typedef struct Sha512_256 Sha512_256;

typedef struct Sha224State Sha224State;
typedef struct Sha256State Sha256State;
typedef struct Sha384State Sha384State;
typedef struct Sha512State Sha512State;
typedef struct Sha512_256State Sha512_224State;
typedef struct Sha512_256State Sha512_256State;

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_init(Sha224 *ctx, uintptr_t ctx_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha224_reset(Sha224 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha224_update(Sha224 *ctx, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_finalize(Sha224 *ctx, uint8_t *result_ptr, uintptr_t result_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_digest(uint8_t *result_ptr, uintptr_t result_size, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_serialize(Sha224State *result_ptr, uintptr_t result_size, const Sha224 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_deserialize(Sha224 *ctx, uintptr_t ctx_size, const Sha224State *state, uintptr_t state_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_init(Sha256 *ctx, uintptr_t ctx_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha256_reset(Sha256 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha256_update(Sha256 *ctx, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_finalize(Sha256 *ctx, uint8_t *result_ptr, uintptr_t result_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_digest(uint8_t *result_ptr, uintptr_t result_size, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_serialize(Sha256State *result_ptr, uintptr_t result_size, const Sha256 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_deserialize(Sha256 *ctx, uintptr_t ctx_size, const Sha256State *state, uintptr_t state_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_init(Sha384 *ctx, uintptr_t ctx_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha384_reset(Sha384 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha384_update(Sha384 *ctx, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_finalize(Sha384 *ctx, uint8_t *result_ptr, uintptr_t result_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_digest(uint8_t *result_ptr, uintptr_t result_size, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_serialize(Sha384State *result_ptr, uintptr_t result_size, const Sha384 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_deserialize(Sha384 *ctx, uintptr_t ctx_size, const Sha384State *state, uintptr_t state_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_init(Sha512 *ctx, uintptr_t ctx_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_reset(Sha512 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_update(Sha512 *ctx, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_finalize(Sha512 *ctx, uint8_t *result_ptr, uintptr_t result_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_digest(uint8_t *result_ptr, uintptr_t result_size, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_serialize(Sha512State *result_ptr, uintptr_t result_size, const Sha512 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_deserialize(Sha512 *ctx, uintptr_t ctx_size, const Sha512State *state, uintptr_t state_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_224_init(Sha512_224 *ctx, uintptr_t ctx_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_224_reset(Sha512_224 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_224_update(Sha512_224 *ctx, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_224_finalize(Sha512_224 *ctx, uint8_t *result_ptr, uintptr_t result_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_224_digest(uint8_t *result_ptr, uintptr_t result_size, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_224_serialize(Sha512_224State *result_ptr, uintptr_t result_size, const Sha512_224 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_224_deserialize(Sha512_224 *ctx, uintptr_t ctx_size, const Sha512_224State *state, uintptr_t state_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_init(Sha512_256 *ctx, uintptr_t ctx_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_256_reset(Sha512_256 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_256_update(Sha512_256 *ctx, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_finalize(Sha512_256 *ctx, uint8_t *result_ptr, uintptr_t result_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_digest(uint8_t *result_ptr, uintptr_t result_size, const uint8_t *data, uintptr_t data_size);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_serialize(Sha512_256State *result_ptr, uintptr_t result_size,const Sha512_256 *ctx);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_deserialize(Sha512_256 *ctx, uintptr_t ctx_size, const Sha512_256State *state, uintptr_t state_size);

#ifdef __cplusplus
}  /* extern "C" */
#endif  /* __cplusplus */

#endif  /* RS_SHA2_BINDINGS_H */
