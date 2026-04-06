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

#include "test_macros.h"

#define DEFINE_SHA_SERIALIZE_TEST_GROUP(ALG_LOWER, ALG_UPPER, ALG_STATE, DIGEST_LEN_BYTES, GROUP_NAME) \
    static void GROUP_NAME##_test_round_trip(void **state) \
    { \
        static const uint8_t msg[] = "The quick brown fox jumps over the lazy dog"; \
        size_t split = sizeof(msg) / 2; \
        uint8_t expected_md[DIGEST_LEN_BYTES]; \
        uint8_t result_md[DIGEST_LEN_BYTES]; \
        uintptr_t sha_size = ALG_LOWER##_init(NULL, 0); \
        uintptr_t state_size = ALG_LOWER##_serialize(NULL, 0, NULL); \
        ALG_UPPER *sha_state = malloc(sha_size); \
        ALG_UPPER *restored_state = malloc(sha_size); \
        ALG_STATE *serialized_state = malloc(state_size); \
        (void) state; \
        assert_non_null(sha_state); \
        assert_non_null(restored_state); \
        assert_non_null(serialized_state); \
        ALG_LOWER##_digest(expected_md, DIGEST_LEN_BYTES, msg, sizeof(msg) - 1); \
        assert_int_equal(ALG_LOWER##_init(sha_state, sha_size), sha_size); \
        ALG_LOWER##_update(sha_state, msg, split); \
        assert_int_equal(ALG_LOWER##_serialize(serialized_state, state_size, sha_state), state_size); \
        assert_int_equal(ALG_LOWER##_deserialize(restored_state, sha_size, serialized_state, state_size), sha_size); \
        ALG_LOWER##_update(restored_state, msg + split, (sizeof(msg) - 1) - split); \
        assert_int_equal(ALG_LOWER##_finalize(restored_state, result_md, DIGEST_LEN_BYTES), DIGEST_LEN_BYTES); \
        assert_memory_equal(result_md, expected_md, DIGEST_LEN_BYTES); \
        free(serialized_state); \
        free(restored_state); \
        free(sha_state); \
    } \
    \
    static void GROUP_NAME##_test_empty_round_trip(void **state) \
    { \
        uint8_t expected_md[DIGEST_LEN_BYTES]; \
        uint8_t result_md[DIGEST_LEN_BYTES]; \
        uintptr_t sha_size = ALG_LOWER##_init(NULL, 0); \
        uintptr_t state_size = ALG_LOWER##_serialize(NULL, 0, NULL); \
        ALG_UPPER *sha_state = malloc(sha_size); \
        ALG_UPPER *expected_state = malloc(sha_size); \
        ALG_UPPER *restored_state = malloc(sha_size); \
        ALG_STATE *serialized_state = malloc(state_size); \
        (void) state; \
        assert_non_null(sha_state); \
        assert_non_null(expected_state); \
        assert_non_null(restored_state); \
        assert_non_null(serialized_state); \
        assert_int_equal(ALG_LOWER##_init(expected_state, sha_size), sha_size); \
        assert_int_equal(ALG_LOWER##_finalize(expected_state, expected_md, DIGEST_LEN_BYTES), DIGEST_LEN_BYTES); \
        assert_int_equal(ALG_LOWER##_init(sha_state, sha_size), sha_size); \
        assert_int_equal(ALG_LOWER##_serialize(serialized_state, state_size, sha_state), state_size); \
        assert_int_equal(ALG_LOWER##_deserialize(restored_state, sha_size, serialized_state, state_size), sha_size); \
        assert_int_equal(ALG_LOWER##_finalize(restored_state, result_md, DIGEST_LEN_BYTES), DIGEST_LEN_BYTES); \
        assert_memory_equal(result_md, expected_md, DIGEST_LEN_BYTES); \
        free(serialized_state); \
        free(restored_state); \
        free(expected_state); \
        free(sha_state); \
    } \
    \
    static void GROUP_NAME##_test_independence(void **state) \
    { \
        static const uint8_t prefix[] = "prefix-data"; \
        static const uint8_t original_suffix[] = "original-suffix"; \
        static const uint8_t restored_suffix[] = "restored-suffix"; \
        uint8_t expected_original_md[DIGEST_LEN_BYTES]; \
        uint8_t expected_restored_md[DIGEST_LEN_BYTES]; \
        uint8_t original_md[DIGEST_LEN_BYTES]; \
        uint8_t restored_md[DIGEST_LEN_BYTES]; \
        uintptr_t sha_size = ALG_LOWER##_init(NULL, 0); \
        uintptr_t state_size = ALG_LOWER##_serialize(NULL, 0, NULL); \
        ALG_UPPER *sha_state = malloc(sha_size); \
        ALG_UPPER *restored_state = malloc(sha_size); \
        ALG_STATE *serialized_state = malloc(state_size); \
        (void) state; \
        assert_non_null(sha_state); \
        assert_non_null(restored_state); \
        assert_non_null(serialized_state); \
        assert_int_equal(ALG_LOWER##_init(sha_state, sha_size), sha_size); \
        ALG_LOWER##_update(sha_state, prefix, sizeof(prefix) - 1); \
        assert_int_equal(ALG_LOWER##_serialize(serialized_state, state_size, sha_state), state_size); \
        assert_int_equal(ALG_LOWER##_deserialize(restored_state, sha_size, serialized_state, state_size), sha_size); \
        ALG_LOWER##_update(sha_state, original_suffix, sizeof(original_suffix) - 1); \
        ALG_LOWER##_update(restored_state, restored_suffix, sizeof(restored_suffix) - 1); \
        assert_int_equal(ALG_LOWER##_finalize(sha_state, original_md, DIGEST_LEN_BYTES), DIGEST_LEN_BYTES); \
        assert_int_equal(ALG_LOWER##_finalize(restored_state, restored_md, DIGEST_LEN_BYTES), DIGEST_LEN_BYTES); \
        { \
            uintptr_t verify_size = ALG_LOWER##_init(NULL, 0); \
            ALG_UPPER *verify_state = malloc(verify_size); \
            assert_non_null(verify_state); \
            assert_int_equal(ALG_LOWER##_init(verify_state, verify_size), verify_size); \
            ALG_LOWER##_update(verify_state, prefix, sizeof(prefix) - 1); \
            ALG_LOWER##_update(verify_state, original_suffix, sizeof(original_suffix) - 1); \
            assert_int_equal(ALG_LOWER##_finalize(verify_state, expected_original_md, DIGEST_LEN_BYTES), DIGEST_LEN_BYTES); \
            free(verify_state); \
        } \
        { \
            uintptr_t verify_size = ALG_LOWER##_init(NULL, 0); \
            ALG_UPPER *verify_state = malloc(verify_size); \
            assert_non_null(verify_state); \
            assert_int_equal(ALG_LOWER##_init(verify_state, verify_size), verify_size); \
            ALG_LOWER##_update(verify_state, prefix, sizeof(prefix) - 1); \
            ALG_LOWER##_update(verify_state, restored_suffix, sizeof(restored_suffix) - 1); \
            assert_int_equal(ALG_LOWER##_finalize(verify_state, expected_restored_md, DIGEST_LEN_BYTES), DIGEST_LEN_BYTES); \
            free(verify_state); \
        } \
        assert_memory_equal(original_md, expected_original_md, DIGEST_LEN_BYTES); \
        assert_memory_equal(restored_md, expected_restored_md, DIGEST_LEN_BYTES); \
        assert_memory_not_equal(original_md, restored_md, DIGEST_LEN_BYTES); \
        free(serialized_state); \
        free(restored_state); \
        free(sha_state); \
    } \
    \
    int run_##GROUP_NAME##_tests(void) \
    { \
        const struct CMUnitTest tests[] = { \
            cmocka_unit_test(GROUP_NAME##_test_round_trip), \
            cmocka_unit_test(GROUP_NAME##_test_empty_round_trip), \
            cmocka_unit_test(GROUP_NAME##_test_independence), \
        }; \
        return cmocka_run_group_tests(tests, NULL, NULL); \
    } \
    extern int TEST_MACROS_CONCAT_(DEFINE_SHA_SERIALIZE_TEST_GROUP__require_semicolon__, __LINE__)

DEFINE_SHA_SERIALIZE_TEST_GROUP(sha224, Sha224, Sha224State, 28, sha224_serialize);
DEFINE_SHA_SERIALIZE_TEST_GROUP(sha256, Sha256, Sha256State, 32, sha256_serialize);
DEFINE_SHA_SERIALIZE_TEST_GROUP(sha384, Sha384, Sha384State, 48, sha384_serialize);
DEFINE_SHA_SERIALIZE_TEST_GROUP(sha512, Sha512, Sha512State, 64, sha512_serialize);
DEFINE_SHA_SERIALIZE_TEST_GROUP(sha512_224, Sha512_224, Sha512_224State, 28, sha512_224_serialize);
DEFINE_SHA_SERIALIZE_TEST_GROUP(sha512_256, Sha512_256, Sha512_256State, 32, sha512_256_serialize);
