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

// ====================================================================
//  SHA-256 — basic vectors
// ====================================================================

#[cfg(all(test, feature = "sha256"))]
mod sha256_test {
    use crate::*;

    #[cfg(feature = "sync")]
    #[test]
    fn sha256_empty() {
        let expected: [u8; 32] = [
            0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14, 0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f,
            0xb9, 0x24, 0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c, 0xa4, 0x95, 0x99, 0x1b,
            0x78, 0x52, 0xb8, 0x55,
        ];
        assert_eq!(Sha256::digest(b""), expected);
    }

    #[cfg(feature = "sync")]
    #[test]
    fn sha256_abc() {
        let expected: [u8; 32] = [
            0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde, 0x5d, 0xae,
            0x22, 0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 0xb4, 0x10, 0xff, 0x61,
            0xf2, 0x00, 0x15, 0xad,
        ];
        assert_eq!(Sha256::digest(b"abc"), expected);
    }

    #[cfg(feature = "sync")]
    #[test]
    fn sha256_two_blocks() {
        let expected: [u8; 32] = [
            0x24, 0x8d, 0x6a, 0x61, 0xd2, 0x06, 0x38, 0xb8, 0xe5, 0xc0, 0x26, 0x93, 0x0c, 0x3e,
            0x60, 0x39, 0xa3, 0x3c, 0xe4, 0x59, 0x64, 0xff, 0x21, 0x67, 0xf6, 0xec, 0xed, 0xd4,
            0x19, 0xdb, 0x06, 0xc1,
        ];
        assert_eq!(
            Sha256::digest(b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
            expected
        );
    }

    #[test]
    fn sha256_incremental() {
        let msg = b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq";
        let mut h = Sha256::new();
        for &byte in msg.iter() {
            h.update(&[byte]);
        }
        let expected: [u8; 32] = [
            0x24, 0x8d, 0x6a, 0x61, 0xd2, 0x06, 0x38, 0xb8, 0xe5, 0xc0, 0x26, 0x93, 0x0c, 0x3e,
            0x60, 0x39, 0xa3, 0x3c, 0xe4, 0x59, 0x64, 0xff, 0x21, 0x67, 0xf6, 0xec, 0xed, 0xd4,
            0x19, 0xdb, 0x06, 0xc1,
        ];
        assert_eq!(h.finalize(), expected);
    }
}

// ====================================================================
//  SHA-224 — proves a second variant "just works"
// ====================================================================

#[cfg(all(test, feature = "sync", feature = "sha224"))]
mod sha224_test {
    use crate::*;

    #[test]
    fn sha224_empty() {
        let expected: [u8; 28] = [
            0xd1, 0x4a, 0x02, 0x8c, 0x2a, 0x3a, 0x2b, 0xc9, 0x47, 0x61, 0x02, 0xbb, 0x28, 0x82,
            0x34, 0xc4, 0x15, 0xa2, 0xb0, 0x1f, 0x82, 0x8e, 0xa6, 0x2a, 0xc5, 0xb3, 0xe4, 0x2f,
        ];
        assert_eq!(Sha224::digest(b""), expected);
    }

    #[test]
    fn sha224_abc() {
        let expected: [u8; 28] = [
            0x23, 0x09, 0x7d, 0x22, 0x34, 0x05, 0xd8, 0x22, 0x86, 0x42, 0xa4, 0x77, 0xbd, 0xa2,
            0x55, 0xb3, 0x2a, 0xad, 0xbc, 0xe4, 0xbd, 0xa0, 0xb3, 0xf7, 0xe3, 0x6c, 0x9d, 0xa7,
        ];
        assert_eq!(Sha224::digest(b"abc"), expected);
    }
}
// ====================================================================
//  SHA-512 — proves the 64-bit family works
// ====================================================================

#[cfg(all(test, feature = "sync", feature = "sha512"))]
mod sha512_test {
    use crate::*;

    #[test]
    fn sha512_empty() {
        let expected: [u8; 64] = [
            0xcf, 0x83, 0xe1, 0x35, 0x7e, 0xef, 0xb8, 0xbd, 0xf1, 0x54, 0x28, 0x50, 0xd6, 0x6d,
            0x80, 0x07, 0xd6, 0x20, 0xe4, 0x05, 0x0b, 0x57, 0x15, 0xdc, 0x83, 0xf4, 0xa9, 0x21,
            0xd3, 0x6c, 0xe9, 0xce, 0x47, 0xd0, 0xd1, 0x3c, 0x5d, 0x85, 0xf2, 0xb0, 0xff, 0x83,
            0x18, 0xd2, 0x87, 0x7e, 0xec, 0x2f, 0x63, 0xb9, 0x31, 0xbd, 0x47, 0x41, 0x7a, 0x81,
            0xa5, 0x38, 0x32, 0x7a, 0xf9, 0x27, 0xda, 0x3e,
        ];
        assert_eq!(Sha512::digest(b""), expected);
    }

    #[test]
    fn sha512_abc() {
        let expected: [u8; 64] = [
            0xdd, 0xaf, 0x35, 0xa1, 0x93, 0x61, 0x7a, 0xba, 0xcc, 0x41, 0x73, 0x49, 0xae, 0x20,
            0x41, 0x31, 0x12, 0xe6, 0xfa, 0x4e, 0x89, 0xa9, 0x7e, 0xa2, 0x0a, 0x9e, 0xee, 0xe6,
            0x4b, 0x55, 0xd3, 0x9a, 0x21, 0x92, 0x99, 0x2a, 0x27, 0x4f, 0xc1, 0xa8, 0x36, 0xba,
            0x3c, 0x23, 0xa3, 0xfe, 0xeb, 0xbd, 0x45, 0x4d, 0x44, 0x23, 0x64, 0x3c, 0xe8, 0x0e,
            0x2a, 0x9a, 0xc9, 0x4f, 0xa5, 0x4c, 0xa4, 0x9f,
        ];
        assert_eq!(Sha512::digest(b"abc"), expected);
    }
}

// ====================================================================
//  SHA-256 state export / import
// ====================================================================

#[cfg(all(
    test,
    feature = "sha256",
    feature = "deserialize",
    feature = "serialize"
))]
mod state_sha256_test {
    use crate::*;

    #[cfg(feature = "sync")]
    #[test]
    fn roundtrip_fresh_hasher() {
        let h = Sha256::new();
        let buf = Sha256State::from(h);
        let mut h2 = Sha256::try_from(buf).unwrap();
        assert_eq!(h2.finalize(), Sha256::digest(b""));
    }

    #[test]
    fn roundtrip_preserves_bytes_exactly() {
        let mut h = Sha256::new();
        h.update(b"some data here");
        let a = Sha256State::from(h);
        let b = Sha256State::from(Sha256::try_from(&a).unwrap());
        assert_eq!(a.inner, b.inner);
    }

    #[cfg(feature = "sync")]
    #[test]
    fn split_at_every_byte() {
        let msg = b"abcdefghij";
        let expected = Sha256::digest(msg);
        for split in 0..=msg.len() {
            let mut h = Sha256::new();
            h.update(&msg[..split]);
            let state = Sha256State::from(h);
            let mut h2 = Sha256::try_from(&state).unwrap();
            h2.update(&msg[split..]);
            assert_eq!(h2.finalize(), expected, "split at {split}");
        }
    }

    #[cfg(feature = "sync")]
    #[test]
    fn split_across_block_boundary() {
        let msg = [0xABu8; 100];
        let expected = Sha256::digest(&msg);
        for &split in &[0, 1, 63, 64, 65, 99, 100] {
            let mut h = Sha256::new();
            h.update(&msg[..split]);
            let state = Sha256State::from(h);
            let mut h2 = Sha256::try_from(&state).unwrap();
            h2.update(&msg[split..]);
            assert_eq!(h2.finalize(), expected, "split at {split}");
        }
    }

    #[test]
    fn export_after_exact_block() {
        let block = [0x42u8; 64];
        let mut h = Sha256::new();
        h.update(&block);
        let exported = Sha256State::from(h);
        assert_eq!(exported.buffer_len(), Some(0));
        assert_eq!(exported.total_len(), 64);
    }

    #[test]
    fn format_initial_state_is_big_endian() {
        let exported = Sha256State::from(Sha256::new());
        assert_eq!(&exported.inner[0..4], &[0x6a, 0x09, 0xe6, 0x67]);
        assert_eq!(&exported.inner[4..8], &[0xbb, 0x67, 0xae, 0x85]);
        assert_eq!(&exported.inner[28..32], &[0x5b, 0xe0, 0xcd, 0x19]);
        assert_eq!(exported.buffer_len(), Some(0));
        assert_eq!(exported.total_len(), 0);
    }

    #[test]
    fn format_preserves_buffer_and_counters() {
        let mut h = Sha256::new();
        h.update(b"hello");
        let exported = Sha256State::from(h);
        assert_eq!(&exported.buffer()[0..5], b"hello");
        assert_eq!(exported.buffer_len(), Some(5));
        assert_eq!(exported.total_len(), 5);
    }

    #[test]
    fn import_rejects_buffer_len_64() {
        let mut buf = Sha256State::from(Sha256::new());
        buf.set_buffer_len(64);
        assert!(Sha256::try_from(&buf).is_err());
    }

    #[test]
    fn import_rejects_buffer_len_max() {
        let mut buf = Sha256State::from(Sha256::new());
        buf.set_buffer_len(u8::MAX);
        assert!(Sha256::try_from(&buf).is_err());
    }

    #[test]
    fn import_accepts_buffer_len_0_and_63() {
        let mut buf = Sha256State::from(Sha256::new());
        buf.set_buffer_len(0);
        assert!(Sha256::try_from(&buf).is_ok());
        buf.set_buffer_len(63);
        assert!(Sha256::try_from(&buf).is_ok());
    }
}
// ====================================================================
//  SHA-512 state round-trip (proves generic state works for 64-bit)
// ====================================================================

#[cfg(all(
    test,
    feature = "sha512",
    feature = "deserialize",
    feature = "serialize"
))]
mod state_sha512_test {
    use crate::*;

    #[test]
    fn sha512_state_roundtrip() {
        let msg = b"The quick brown fox jumps over the lazy dog";
        let expected = Sha512::digest(msg);
        let split = 20;

        let mut h = Sha512::new();
        h.update(&msg[..split]);
        let state = Sha512State::from(h);

        let mut h2 = Sha512::try_from(&state).unwrap();
        h2.update(&msg[split..]);
        assert_eq!(h2.finalize(), expected);
    }
}

/*
#[cfg(test)]
mod test_vectors {
    use super::*;

    struct Algorithm<T> {
        Sha224: T,
        Sha256: T,
        Sha384: T,
        Sha512: T,
        Sha512_256: T,
    }

    struct TestVector<'a> {
        input: &'a [u8],
        result: Algorithm<&'a [u8]>,
    }

    impl<'a> TestVector<'a> {
        const fn new(input: &'a [u8], result: Algorithm<&'a [u8]>) -> Self {
            Self { input, result }
        }
    }

    static TEST_VECTORS: &[TestVector] = &[
            TestVector::new(b"", Algorithm {

                Sha256: b"\xe3\xb0\xc4\x42\x98\xfc\x1c\x14\x9a\xfb\xf4\xc8\x99\x6f\xb9\x24\x27\xae\x41\xe4\x64\x9b\x93\x4c\xa4\x95\x99\x1b\x78\x52\xb8\x55",

                }),
            TestVector::new(b"abc", b"\xba\x78\x16\xbf\x8f\x01\xcf\xea\x41\x41\x40\xde\x5d\xae\x22\x23\xb0\x03\x61\xa3\x96\x17\x7a\x9c\xb4\x10\xff\x61\xf2\x00\x15\xad"),
            TestVector::new(b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", b"\x24\x8d\x6a\x61\xd2\x06\x38\xb8\xe5\xc0\x26\x93\x0c\x3e\x60\x39\xa3\x3c\xe4\x59\x64\xff\x21\x67\xf6\xec\xed\xd4\x19\xdb\x06\xc1"),
            TestVector::new(b"abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu", b"\xcf\x5b\x16\xa7\x78\xaf\x83\x80\x03\x6c\xe5\x9e\x7b\x04\x92\x37\x0b\x24\x9b\x11\xe8\xf0\x7a\x51\xaf\xac\x45\x03\x7a\xfe\xe9\xd1"),
            TestVector::new(b"The quick brown fox jumps over the lazy dog", b"\xd7\xa8\xfb\xb3\x07\xd7\x80\x94\x69\xca\x9a\xbc\xb0\x08\x2e\x4f\x8d\x56\x51\xe4\x6d\x3c\xdb\x76\x2d\x02\xd0\xbf\x37\xc9\xe5\x92"),
            TestVector::new(b"The quick brown fox jumps over the lazy dof", b"\xa1\xcb\xac\x0e\x93\x07\x5a\xb6\x6a\xd5\x9f\xf5\x4c\x32\xc8\xab\xca\xeb\x53\x3f\x05\x68\xe1\x09\x28\x1e\xd5\x7e\xb5\x19\x68\x55"),
        ];

    #[test]
    fn sha256() {
        for vector in vectors {
            let result = Sha256::digest(vector.input);
            assert_eq!(result, vector.result);
        }
    }
}
*/
