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

#ifndef TEST_MACROS_H
#define TEST_MACROS_H

#include <stdarg.h>
#include <stddef.h>
#include <setjmp.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <cmocka.h>

#include "bindings.h"
#include "helpers/rsp_parser.h"

/* State for this group of tests. It will hold the parsed vector file. */
typedef struct {
    vector_file_t *vf;
} test_state_t;

/**
 * @brief Main macro to define a complete test group for a SHA algorithm and a vector file.
 *
 * @param ALG_LOWER             The lowercase algorithm name for function calls (e.g., sha224).
 * @param ALG_UPPER             The uppercase algorithm name for type definitions (e.g., Sha224).
 * @param DIGEST_LEN_BYTES      The expected digest length in bytes (e.g., 28 for SHA-224).
 * @param VECTOR_FILE_BASENAME  The filename of the .rsp file in `tests/vectors/`.
 * @param GROUP_NAME            A unique identifier for this test group (e.g., sha224_short_msg).
 */
#define DEFINE_SHA_TEST_GROUP(ALG_LOWER, ALG_UPPER, DIGEST_LEN_BYTES, VECTOR_FILE_BASENAME, GROUP_NAME) \
    \
    /* Group setup function: runs once before all tests in this group. */ \
    static int GROUP_NAME##_setup(void **state) \
    { \
        char file_path[256]; \
        test_state_t *ts = (test_state_t*)calloc(1, sizeof(test_state_t)); \
        if (!ts) { \
            return -1; \
        } \
        snprintf(file_path, sizeof(file_path), "tests/vectors/%s", VECTOR_FILE_BASENAME); \
        ts->vf = parse_vector_file(file_path); \
        if (!ts->vf) { \
            fprintf(stderr, "Failed to parse vector file: %s\n", file_path); \
            free(ts); \
            return -1; \
        } \
        if (ts->vf->digest_length_bytes != DIGEST_LEN_BYTES) { \
            fprintf(stderr, "Unexpected digest length in %s: Got %d, expected %d\n", \
                    VECTOR_FILE_BASENAME, ts->vf->digest_length_bytes, DIGEST_LEN_BYTES); \
            free_vector_file(ts->vf); \
            free(ts); \
            return -1; \
        } \
        *state = ts; \
        return 0; \
    } \
    \
    /* Group teardown function: runs once after all tests in this group. */ \
    static int GROUP_NAME##_teardown(void **state) \
    { \
        if (state && *state) { \
            test_state_t *ts = (test_state_t*)*state; \
            free_vector_file(ts->vf); \
            free(ts); \
        } \
        return 0; \
    } \
    \
    /* Tests the one-shot `_digest` function. */ \
    static void GROUP_NAME##_test_oneshot(void **state) \
    { \
        test_state_t *ts = (test_state_t *)*state; \
        vector_file_t *vf = ts->vf; \
        size_t i; \
        uint8_t result_md[DIGEST_LEN_BYTES]; \
        for (i = 0; i < vf->vector_count; ++i) { \
            test_vector_t *v = &vf->vectors[i]; \
            assert_int_equal(v->msg_len_bytes, v->len_bits / 8); \
            ALG_LOWER##_digest(v->msg, v->msg_len_bytes, result_md); \
            assert_memory_equal(result_md, v->md, v->md_len_bytes); \
        } \
    } \
    \
    /* Tests the streaming API (`init`, `update`, `finalize`). */ \
    static void GROUP_NAME##_test_streaming(void **state) \
    { \
        test_state_t *ts = (test_state_t *)*state; \
        vector_file_t *vf = ts->vf; \
        uint8_t result_md[DIGEST_LEN_BYTES]; \
        uintptr_t state_size = ALG_LOWER##_init(NULL); \
        ALG_UPPER *sha_state = malloc(state_size); \
        size_t i, j; \
        for (i = 0; i < vf->vector_count; ++i) { \
            test_vector_t *v = &vf->vectors[i]; \
            ALG_LOWER##_init(sha_state); \
            ALG_LOWER##_update(sha_state, v->msg, v->msg_len_bytes); \
            ALG_LOWER##_finalize(sha_state, result_md); \
            assert_memory_equal(result_md, v->md, v->md_len_bytes); \
            if (v->len_bits > 0) { \
                uint8_t empty_md[DIGEST_LEN_BYTES]; \
                ALG_LOWER##_reset(sha_state); \
                ALG_LOWER##_finalize(sha_state, empty_md); \
                for(j=0; j<vf->vector_count; ++j) { \
                    if (vf->vectors[j].len_bits == 0) { \
                         assert_memory_equal(empty_md, vf->vectors[j].md, vf->vectors[j].md_len_bytes); \
                         break; \
                    } \
                } \
            } \
        } \
        free(sha_state); \
    } \
    \
    /* Public function to register and run the tests for this suite */ \
    int run_##GROUP_NAME##_tests(void) \
    { \
        const struct CMUnitTest tests[] = { \
            cmocka_unit_test(GROUP_NAME##_test_oneshot), \
            cmocka_unit_test(GROUP_NAME##_test_streaming), \
        }; \
        return cmocka_run_group_tests(tests, GROUP_NAME##_setup, GROUP_NAME##_teardown); \
    } \
    extern void DEFINE_SHA_TEST_GROUP__require_semicolon__##__LINE__

#endif /* TEST_MACROS_H */
