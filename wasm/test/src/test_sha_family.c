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

DEFINE_SHA_TEST_GROUP(sha224, Sha224, 28, "SHA224ShortMsg.rsp", sha224_short_msg);
DEFINE_SHA_TEST_GROUP(sha224, Sha224, 28, "SHA224LongMsg.rsp", sha224_long_msg);

DEFINE_SHA_TEST_GROUP(sha256, Sha256, 32, "SHA256ShortMsg.rsp", sha256_short_msg);
DEFINE_SHA_TEST_GROUP(sha256, Sha256, 32, "SHA256LongMsg.rsp", sha256_long_msg);

DEFINE_SHA_TEST_GROUP(sha384, Sha384, 48, "SHA384ShortMsg.rsp", sha384_short_msg);
DEFINE_SHA_TEST_GROUP(sha384, Sha384, 48, "SHA384LongMsg.rsp", sha384_long_msg);

DEFINE_SHA_TEST_GROUP(sha512, Sha512, 64, "SHA512ShortMsg.rsp", sha512_short_msg);
DEFINE_SHA_TEST_GROUP(sha512, Sha512, 64, "SHA512LongMsg.rsp", sha512_long_msg);

DEFINE_SHA_TEST_GROUP(sha512_256, Sha512_256, 32, "SHA512_256ShortMsg.rsp", sha512_256_short_msg);
DEFINE_SHA_TEST_GROUP(sha512_256, Sha512_256, 32, "SHA512_256LongMsg.rsp", sha512_256_long_msg);
