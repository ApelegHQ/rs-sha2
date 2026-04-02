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

#ifndef RSP_PARSER_H
#define RSP_PARSER_H

#include <stdint.h>
#include <stdlib.h>

/**
 * @brief Represents a single test case from an .rsp file.
 */
typedef struct {
    /** Message length in bits. */
    int len_bits;
    /** Raw message bytes. */
    uint8_t *msg;
    /** Length of the msg buffer in bytes. */
    size_t msg_len_bytes;
    /** Expected message digest. */
    uint8_t *md;
    /** Length of the md buffer in bytes. */
    size_t md_len_bytes;
} test_vector_t;

/**
 * @brief Represents a parsed .rsp file.
 */
typedef struct {
    /** Digest output length in bytes (from the `[L = N]` header). */
    int digest_length_bytes;
    /** Array of test vectors. */
    test_vector_t *vectors;
    /** Number of test vectors in the array. */
    size_t vector_count;
} vector_file_t;

/**
 * @brief Parses a NIST CAVS `.rsp` response file from the given path.
 *
 * @param file_path The path to the .rsp file.
 * @return A pointer to a newly allocated vector_file_t structure. The caller
 *         is responsible for freeing this structure using `free_vector_file`.
 *         Returns NULL on failure (e.g., file not found, memory allocation error).
 */
vector_file_t* parse_vector_file(const char *file_path);

/**
 * @brief Frees the memory allocated for a vector_file_t structure.
 *
 * @param vf The vector file structure to free.
 */
void free_vector_file(vector_file_t *vf);

#endif /* RSP_PARSER_H */
