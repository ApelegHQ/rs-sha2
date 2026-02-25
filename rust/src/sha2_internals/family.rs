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

use super::word::ShaWord;

/// A SHA-2 compression-function family.
///
/// One implementation per word width: `Sha2_32` (SHA-224/256)
/// and `Sha2_64` (SHA-384/512/512-256).
///
/// The default [`compress`](ShaFamily::compress) is written once;
/// families only supply sigma functions, round constants, and length encoding.
#[cfg(any(
    feature = "sha224",
    feature = "sha256",
    feature = "sha384",
    feature = "sha512",
    feature = "sha512_256"
))]
pub trait ShaFamily: 'static {
    type Word: ShaWord;

    /// Block size in bytes (64 or 128).
    const BLOCK_BYTES: usize;
    /// Number of compression rounds (64 or 80).
    const ROUNDS: usize;
    /// Width of the bit-length field in padding (8 or 16).
    const LEN_BYTES: usize;
    /// Pre-computed `8 × Word::BYTES` for convenience.
    const STATE_BYTES: usize;
    /// Round constants.
    const K: &'static [Self::Word];

    // ---- sigma functions (the only math that differs) ----

    fn small_sigma0(x: Self::Word) -> Self::Word;
    fn small_sigma1(x: Self::Word) -> Self::Word;
    fn big_sigma0(x: Self::Word) -> Self::Word;
    fn big_sigma1(x: Self::Word) -> Self::Word;

    // ---- length encoding (padding & serialization) ----

    /// Write `total_bytes` as a big-endian **bit** count (for final-block padding).
    fn encode_bit_len(total_bytes: u128, dst: &mut [u8]);
    /// Serialize byte count to a state checkpoint.
    fn write_len(total_bytes: u128, dst: &mut [u8]);
    /// Deserialize byte count from a state checkpoint.
    fn read_len(src: &[u8]) -> u128;

    // ---- default compression (written once, works for every family) ----

    /// Compress one block (`BLOCK_BYTES` bytes) into the 8-word chaining state.
    fn compress(state: &mut [Self::Word; 8], block: &[u8]) {
        let mut w = [Self::Word::ZERO; 16];
        let mut i = 0;
        while i < 16 {
            w[i] = Self::Word::from_be_bytes_at(block, i);
            i += 1;
        }

        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut h] = *state;

        i = 0;
        while i < Self::ROUNDS {
            if i >= 16 {
                let s0 = Self::small_sigma0(w[(i + 1) & 0xf]);
                let s1 = Self::small_sigma1(w[(i + 14) & 0xf]);
                w[i & 0xf] = w[i & 0xf]
                    .wrapping_add(s0)
                    .wrapping_add(w[(i + 9) & 0xf])
                    .wrapping_add(s1);
            }

            let ch = (e & f) ^ (!e & g);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let temp1 = h
                .wrapping_add(Self::big_sigma1(e))
                .wrapping_add(ch)
                .wrapping_add(Self::K[i])
                .wrapping_add(w[i & 0xf]);
            let temp2 = Self::big_sigma0(a).wrapping_add(maj);

            h = g;
            g = f;
            f = e;
            e = d.wrapping_add(temp1);
            d = c;
            c = b;
            b = a;
            a = temp1.wrapping_add(temp2);

            i += 1;
        }

        state[0] = state[0].wrapping_add(a);
        state[1] = state[1].wrapping_add(b);
        state[2] = state[2].wrapping_add(c);
        state[3] = state[3].wrapping_add(d);
        state[4] = state[4].wrapping_add(e);
        state[5] = state[5].wrapping_add(f);
        state[6] = state[6].wrapping_add(g);
        state[7] = state[7].wrapping_add(h);
    }
}

// ============================================================================
//  32-bit family (SHA-224, SHA-256)
// ============================================================================

#[cfg(any(feature = "sha224", feature = "sha256",))]
pub struct Sha2_32;

#[cfg(any(feature = "sha224", feature = "sha256",))]
impl ShaFamily for Sha2_32 {
    type Word = u32;
    const BLOCK_BYTES: usize = 64;
    const ROUNDS: usize = 64;
    const LEN_BYTES: usize = 8;
    const STATE_BYTES: usize = 32; // 8 × 4

    const K: &'static [u32] = &[
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];

    #[inline]
    fn small_sigma0(x: u32) -> u32 {
        x.rotate_right(7) ^ x.rotate_right(18) ^ (x >> 3)
    }
    #[inline]
    fn small_sigma1(x: u32) -> u32 {
        x.rotate_right(17) ^ x.rotate_right(19) ^ (x >> 10)
    }
    #[inline]
    fn big_sigma0(x: u32) -> u32 {
        x.rotate_right(2) ^ x.rotate_right(13) ^ x.rotate_right(22)
    }
    #[inline]
    fn big_sigma1(x: u32) -> u32 {
        x.rotate_right(6) ^ x.rotate_right(11) ^ x.rotate_right(25)
    }

    fn encode_bit_len(total_bytes: u128, dst: &mut [u8]) {
        dst[..8].copy_from_slice(&((total_bytes as u64) << 3).to_be_bytes());
    }
    fn write_len(total_bytes: u128, dst: &mut [u8]) {
        dst[..8].copy_from_slice(&(total_bytes as u64).to_be_bytes());
    }
    fn read_len(src: &[u8]) -> u128 {
        u64::from_be_bytes([
            src[0], src[1], src[2], src[3], src[4], src[5], src[6], src[7],
        ]) as u128
    }
}

// ============================================================================
//  64-bit family (SHA-384, SHA-512, SHA-512/256)
// ============================================================================

#[cfg(any(feature = "sha384", feature = "sha512", feature = "sha512_256"))]
pub struct Sha2_64;

#[cfg(any(feature = "sha384", feature = "sha512", feature = "sha512_256"))]
impl ShaFamily for Sha2_64 {
    type Word = u64;
    const BLOCK_BYTES: usize = 128;
    const ROUNDS: usize = 80;
    const LEN_BYTES: usize = 16;
    const STATE_BYTES: usize = 64; // 8 × 8

    const K: &'static [u64] = &[
        0x428a2f98d728ae22,
        0x7137449123ef65cd,
        0xb5c0fbcfec4d3b2f,
        0xe9b5dba58189dbbc,
        0x3956c25bf348b538,
        0x59f111f1b605d019,
        0x923f82a4af194f9b,
        0xab1c5ed5da6d8118,
        0xd807aa98a3030242,
        0x12835b0145706fbe,
        0x243185be4ee4b28c,
        0x550c7dc3d5ffb4e2,
        0x72be5d74f27b896f,
        0x80deb1fe3b1696b1,
        0x9bdc06a725c71235,
        0xc19bf174cf692694,
        0xe49b69c19ef14ad2,
        0xefbe4786384f25e3,
        0x0fc19dc68b8cd5b5,
        0x240ca1cc77ac9c65,
        0x2de92c6f592b0275,
        0x4a7484aa6ea6e483,
        0x5cb0a9dcbd41fbd4,
        0x76f988da831153b5,
        0x983e5152ee66dfab,
        0xa831c66d2db43210,
        0xb00327c898fb213f,
        0xbf597fc7beef0ee4,
        0xc6e00bf33da88fc2,
        0xd5a79147930aa725,
        0x06ca6351e003826f,
        0x142929670a0e6e70,
        0x27b70a8546d22ffc,
        0x2e1b21385c26c926,
        0x4d2c6dfc5ac42aed,
        0x53380d139d95b3df,
        0x650a73548baf63de,
        0x766a0abb3c77b2a8,
        0x81c2c92e47edaee6,
        0x92722c851482353b,
        0xa2bfe8a14cf10364,
        0xa81a664bbc423001,
        0xc24b8b70d0f89791,
        0xc76c51a30654be30,
        0xd192e819d6ef5218,
        0xd69906245565a910,
        0xf40e35855771202a,
        0x106aa07032bbd1b8,
        0x19a4c116b8d2d0c8,
        0x1e376c085141ab53,
        0x2748774cdf8eeb99,
        0x34b0bcb5e19b48a8,
        0x391c0cb3c5c95a63,
        0x4ed8aa4ae3418acb,
        0x5b9cca4f7763e373,
        0x682e6ff3d6b2b8a3,
        0x748f82ee5defb2fc,
        0x78a5636f43172f60,
        0x84c87814a1f0ab72,
        0x8cc702081a6439ec,
        0x90befffa23631e28,
        0xa4506cebde82bde9,
        0xbef9a3f7b2c67915,
        0xc67178f2e372532b,
        0xca273eceea26619c,
        0xd186b8c721c0c207,
        0xeada7dd6cde0eb1e,
        0xf57d4f7fee6ed178,
        0x06f067aa72176fba,
        0x0a637dc5a2c898a6,
        0x113f9804bef90dae,
        0x1b710b35131c471b,
        0x28db77f523047d84,
        0x32caab7b40c72493,
        0x3c9ebe0a15c9bebc,
        0x431d67c49c100d4c,
        0x4cc5d4becb3e42b6,
        0x597f299cfc657e2a,
        0x5fcb6fab3ad6faec,
        0x6c44198c4a475817,
    ];

    #[inline]
    fn small_sigma0(x: u64) -> u64 {
        x.rotate_right(1) ^ x.rotate_right(8) ^ (x >> 7)
    }
    #[inline]
    fn small_sigma1(x: u64) -> u64 {
        x.rotate_right(19) ^ x.rotate_right(61) ^ (x >> 6)
    }
    #[inline]
    fn big_sigma0(x: u64) -> u64 {
        x.rotate_right(28) ^ x.rotate_right(34) ^ x.rotate_right(39)
    }
    #[inline]
    fn big_sigma1(x: u64) -> u64 {
        x.rotate_right(14) ^ x.rotate_right(18) ^ x.rotate_right(41)
    }

    fn encode_bit_len(total_bytes: u128, dst: &mut [u8]) {
        dst[..16].copy_from_slice(&(total_bytes << 3).to_be_bytes());
    }
    fn write_len(total_bytes: u128, dst: &mut [u8]) {
        dst[..16].copy_from_slice(&total_bytes.to_be_bytes());
    }
    fn read_len(src: &[u8]) -> u128 {
        u128::from_be_bytes([
            src[0], src[1], src[2], src[3], src[4], src[5], src[6], src[7], src[8], src[9],
            src[10], src[11], src[12], src[13], src[14], src[15],
        ])
    }
}
