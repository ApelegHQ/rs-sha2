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

#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

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
typedef struct Sha512_256 Sha512_256;

typedef struct Sha224State Sha224State;
typedef struct Sha256State Sha256State;
typedef struct Sha384State Sha384State;
typedef struct Sha512State Sha512State;
typedef struct Sha512_256State Sha512_256State;

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_init(Sha224 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha224_reset(Sha224 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha224_update(Sha224 *s, const uint8_t *data, uintptr_t len);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_finalize(Sha224 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_digest(const uint8_t *data, uintptr_t len, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_serialize(const Sha224 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha224_deserialize(const Sha224State *state, Sha224 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_init(Sha256 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha256_reset(Sha256 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha256_update(Sha256 *s, const uint8_t *data, uintptr_t len);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_finalize(Sha256 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_digest(const uint8_t *data, uintptr_t len, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_serialize(const Sha256 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha256_deserialize(const Sha256State *state, Sha256 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_init(Sha384 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha384_reset(Sha384 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha384_update(Sha384 *s, const uint8_t *data, uintptr_t len);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_finalize(Sha384 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_digest(const uint8_t *data, uintptr_t len, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_serialize(const Sha384 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha384_deserialize(const Sha384State *state, Sha384 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_init(Sha512 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_reset(Sha512 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_update(Sha512 *s, const uint8_t *data, uintptr_t len);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_finalize(Sha512 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_digest(const uint8_t *data, uintptr_t len, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_serialize(const Sha512 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_deserialize(const Sha512State *state, Sha512 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_init(Sha512_256 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_256_reset(Sha512_256 *s);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
void sha512_256_update(Sha512_256 *s, const uint8_t *data, uintptr_t len);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_finalize(Sha512_256 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_digest(const uint8_t *data, uintptr_t len, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_serialize(const Sha512_256 *s, uint8_t *result_ptr);

/**
 * # Safety
 *
 * C bindings. Caller is responsible for ensuring memory correctness.
 */
uintptr_t sha512_256_deserialize(const Sha512_256State *state, Sha512_256 *s);

#ifdef __cplusplus
}  /* extern "C" */
#endif  /* __cplusplus */

#endif  /* RS_SHA2_BINDINGS_H */
