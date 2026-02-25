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

extern crate cbindgen;

use ::cbindgen::Language;
use ::std::env;

fn main() {
    println!("cargo:rerun-if-changed=src/lib.rs");

    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();

    ::cbindgen::Builder::new()
        .with_crate_and_name(manifest_dir, "c-sha2")
        .with_language(Language::C)
        .with_pragma_once(true)
        .with_cpp_compat(true)
        .with_include_version(false)
        .with_autogen_warning("/* WARNING: FILE GENERATED AUTOMATICALLY */")
        .with_include_guard("RS_SHA2_BINDINGS_edf0268a_a789_45ac_8cf6_320c40cbb8e7__")
        .with_only_target_dependencies(true)
        .generate()
        .expect("Unable to generate C bindings")
        .write_to_file(format!("{}/bindings.h", env::var("OUT_DIR").unwrap()));
}
