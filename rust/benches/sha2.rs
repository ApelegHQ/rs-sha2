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

use ::criterion::{BenchmarkId, Criterion, Throughput, criterion_group, criterion_main};
use ::std::hint::black_box;

const SIZES: [usize; 4] = [32, 1024, 64 * 1024, 1024 * 1024];
const STREAMING_CHUNK_SIZE: usize = 1024;

fn bench_hasher<const DIGEST: usize, H, F>(c: &mut Criterion, group_name: &str, mut new_hasher: F)
where
    H: HasherOps<DIGEST> + 'static,
    F: FnMut() -> H + Copy + 'static,
{
    let mut group = c.benchmark_group(group_name);

    for size in SIZES {
        let data = vec![0xA5; size];
        group.throughput(Throughput::Bytes(size as u64));

        group.bench_with_input(BenchmarkId::new("single_update", size), &data, |b, data| {
            b.iter(|| {
                let mut hasher = new_hasher();
                hasher.update(black_box(data));
                black_box(hasher.finalize());
            });
        });

        group.bench_with_input(
            BenchmarkId::new("chunked_update", size),
            &data,
            |b, data| {
                b.iter(|| {
                    let mut hasher = new_hasher();
                    for chunk in black_box(data).chunks(STREAMING_CHUNK_SIZE) {
                        hasher.update(chunk);
                    }
                    black_box(hasher.finalize());
                });
            },
        );
    }

    group.finish();
}

trait HasherOps<const DIGEST: usize> {
    fn update(&mut self, data: &[u8]);
    fn finalize(&mut self) -> [u8; DIGEST];
}

#[cfg(feature = "sha224")]
impl HasherOps<28> for sha2::Sha224 {
    fn update(&mut self, data: &[u8]) {
        sha2::Sha224::update(self, data);
    }

    fn finalize(&mut self) -> [u8; 28] {
        sha2::Sha224::finalize(self)
    }
}

#[cfg(feature = "sha256")]
impl HasherOps<32> for sha2::Sha256 {
    fn update(&mut self, data: &[u8]) {
        sha2::Sha256::update(self, data);
    }

    fn finalize(&mut self) -> [u8; 32] {
        sha2::Sha256::finalize(self)
    }
}

#[cfg(feature = "sha384")]
impl HasherOps<48> for sha2::Sha384 {
    fn update(&mut self, data: &[u8]) {
        sha2::Sha384::update(self, data);
    }

    fn finalize(&mut self) -> [u8; 48] {
        sha2::Sha384::finalize(self)
    }
}

#[cfg(feature = "sha512")]
impl HasherOps<64> for sha2::Sha512 {
    fn update(&mut self, data: &[u8]) {
        sha2::Sha512::update(self, data);
    }

    fn finalize(&mut self) -> [u8; 64] {
        sha2::Sha512::finalize(self)
    }
}

#[cfg(feature = "sha512_256")]
impl HasherOps<32> for sha2::Sha512_256 {
    fn update(&mut self, data: &[u8]) {
        sha2::Sha512_256::update(self, data);
    }

    fn finalize(&mut self) -> [u8; 32] {
        sha2::Sha512_256::finalize(self)
    }
}

#[cfg(feature = "sha224")]
fn bench_sha224(c: &mut Criterion) {
    bench_hasher::<28, sha2::Sha224, _>(c, "sha224", sha2::Sha224::new);
}

#[cfg(not(feature = "sha224"))]
fn bench_sha224(_: &mut Criterion) {}

#[cfg(feature = "sha256")]
fn bench_sha256(c: &mut Criterion) {
    bench_hasher::<32, sha2::Sha256, _>(c, "sha256", sha2::Sha256::new);
}

#[cfg(not(feature = "sha256"))]
fn bench_sha256(_: &mut Criterion) {}

#[cfg(feature = "sha384")]
fn bench_sha384(c: &mut Criterion) {
    bench_hasher::<48, sha2::Sha384, _>(c, "sha384", sha2::Sha384::new);
}

#[cfg(not(feature = "sha384"))]
fn bench_sha384(_: &mut Criterion) {}

#[cfg(feature = "sha512")]
fn bench_sha512(c: &mut Criterion) {
    bench_hasher::<64, sha2::Sha512, _>(c, "sha512", sha2::Sha512::new);
}

#[cfg(not(feature = "sha512"))]
fn bench_sha512(_: &mut Criterion) {}

#[cfg(feature = "sha512_256")]
fn bench_sha512_256(c: &mut Criterion) {
    bench_hasher::<32, sha2::Sha512_256, _>(c, "sha512_256", sha2::Sha512_256::new);
}

#[cfg(not(feature = "sha512_256"))]
fn bench_sha512_256(_: &mut Criterion) {}

criterion_group!(
    benches,
    bench_sha224,
    bench_sha256,
    bench_sha384,
    bench_sha512,
    bench_sha512_256
);
criterion_main!(benches);
