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

import binaryen from 'binaryen';

// ============================================================================
// Core transformation logic
// ============================================================================

/**
 * Replace all i32.rotl and i64.rotl instructions in the module.
 * Returns the total number of replacements made.
 *
 * Mathematical identity used:
 *   rotl(x, k) = (x << k) | (x >>> (W - k))
 * where W is the bit width and >>> is unsigned right shift.
 *
 * Since Wasm shifts already mask the shift amount (mod W), this identity
 * holds for all values of k. To avoid double-evaluation of x and k
 * (which may have side effects), use local.tee / local.get.
 *
 * @param {*} module
 * @returns {*}
 */
export function replaceAllRotl(module) {
	let totalReplacements = 0;
	const numFunctions = module.getNumFunctions();

	for (let i = 0; i < numFunctions; i++) {
		const funcRef = module.getFunctionByIndex(i);
		const info = binaryen.getFunctionInfo(funcRef);

		// First pass: count rotl instructions to know how many extra locals
		// are needed
		const rotlCounts = { i32: 0, i64: 0 };
		countRotl(info.body, rotlCounts);

		const totalRotl = rotlCounts.i32 + rotlCounts.i64;
		if (totalRotl === 0) continue;

		// Compute existing local info
		const paramTypes = binaryen.expandType(info.params);
		const numParams = paramTypes.length;
		const existingVarTypes = info.vars.map((t) => binaryen.expandType(t));
		const existingVarCount = existingVarTypes.length;

		// 2 new locals per rotl:
		// one for the value, one for the shift amount
		// Build the extra var types array
		const extraVarTypes = [];
		for (let r = 0; r < rotlCounts.i32; r++) {
			extraVarTypes.push(binaryen.i32); // for x
			extraVarTypes.push(binaryen.i32); // for k
		}
		for (let r = 0; r < rotlCounts.i64; r++) {
			extraVarTypes.push(binaryen.i64); // for x
			extraVarTypes.push(binaryen.i64); // for k
		}

		// State for the rewriter: tracks the next available extra local index
		const state = {
			nextExtraIndex: numParams + existingVarCount,
		};

		// Second pass: rewrite the body (bottom-up / post-order)
		const newBody = rewriteExpression(module, info.body, state);

		// Rebuild the function with the extra locals
		const allVarTypes = [...existingVarTypes, ...extraVarTypes];

		module.removeFunction(info.name);
		module.addFunction(
			info.name,
			info.params,
			info.results,
			allVarTypes,
			newBody,
		);

		// If this function was exported or was the start,
		// re-exports still reference by name, so they should be fine.

		totalReplacements += totalRotl;
	}

	return totalReplacements;
}

/**
 * Count rotl instructions in an expression tree.
 */
function countRotl(expr, counts) {
	if (expr === 0) return;
	visitChildren(expr, (child) => countRotl(child, counts));

	if (binaryen.Expression.getId(expr) === binaryen.BinaryId) {
		const op = binaryen.Binary.getOp(expr);
		if (op === binaryen.RotLInt32) counts.i32++;
		if (op === binaryen.RotLInt64) counts.i64++;
	}
}

/**
 * Rewrite an expression tree, replacing rotl with shift+or equivalent.
 * Returns the (possibly new) expression. The original expression may be reused.
 */
function rewriteExpression(module, expr, state) {
	if (expr === 0) return 0;

	// First, recursively rewrite children
	rewriteChildren(module, expr, state);

	// Then check if this node is a rotl
	if (binaryen.Expression.getId(expr) !== binaryen.BinaryId) return expr;

	const op = binaryen.Binary.getOp(expr);
	if (op !== binaryen.RotLInt32 && op !== binaryen.RotLInt64) return expr;

	const isI32 = op === binaryen.RotLInt32;
	const W = isI32 ? 32 : 64;

	const left = binaryen.Binary.getLeft(expr); // x
	const right = binaryen.Binary.getRight(expr); // k

	// Allocate two fresh locals
	const localX = state.nextExtraIndex++;
	const localK = state.nextExtraIndex++;

	let replacement;
	if (isI32) {
		// (i32.or
		//   (i32.shl (local.tee $x, <left>) (local.tee $k, <right>))
		//   (i32.shr_u (local.get $x) (i32.sub (i32.const 32) (local.get $k)))
		// )
		replacement = module.i32.or(
			module.i32.shl(
				module.local.tee(localX, left, binaryen.i32),
				module.local.tee(localK, right, binaryen.i32),
			),
			module.i32.shr_u(
				module.local.get(localX, binaryen.i32),
				module.i32.sub(
					module.i32.const(W),
					module.local.get(localK, binaryen.i32),
				),
			),
		);
	} else {
		// i64 version
		replacement = module.i64.or(
			module.i64.shl(
				module.local.tee(localX, left, binaryen.i64),
				module.local.tee(localK, right, binaryen.i64),
			),
			module.i64.shr_u(
				module.local.get(localX, binaryen.i64),
				module.i64.sub(
					module.i64.const(W, 0),
					module.local.get(localK, binaryen.i64),
				),
			),
		);
	}

	return replacement;
}

// ============================================================================
// Child traversal helpers
// ============================================================================

/**
 * Visit all children of an expression, calling `fn(child)` on each.
 */
function visitChildren(expr, fn) {
	if (expr === 0) return;
	const id = binaryen.Expression.getId(expr);

	switch (id) {
		case binaryen.BlockId: {
			const n = binaryen.Block.getNumChildren(expr);
			for (let i = 0; i < n; i++) fn(binaryen.Block.getChildAt(expr, i));
			break;
		}
		case binaryen.IfId: {
			fn(binaryen.If.getCondition(expr));
			fn(binaryen.If.getIfTrue(expr));
			const f = binaryen.If.getIfFalse(expr);
			if (f) fn(f);
			break;
		}
		case binaryen.LoopId:
			fn(binaryen.Loop.getBody(expr));
			break;
		case binaryen.BreakId: {
			const c = binaryen.Break.getCondition(expr);
			if (c) fn(c);
			const v = binaryen.Break.getValue(expr);
			if (v) fn(v);
			break;
		}
		case binaryen.SwitchId: {
			const c = binaryen.Switch.getCondition(expr);
			if (c) fn(c);
			const v = binaryen.Switch.getValue(expr);
			if (v) fn(v);
			break;
		}
		case binaryen.CallId: {
			const n = binaryen.Call.getNumOperands(expr);
			for (let i = 0; i < n; i++) fn(binaryen.Call.getOperandAt(expr, i));
			break;
		}
		case binaryen.CallIndirectId: {
			fn(binaryen.CallIndirect.getTarget(expr));
			const n = binaryen.CallIndirect.getNumOperands(expr);
			for (let i = 0; i < n; i++)
				fn(binaryen.CallIndirect.getOperandAt(expr, i));
			break;
		}
		case binaryen.LocalGetId:
			break;
		case binaryen.LocalSetId:
			fn(binaryen.LocalSet.getValue(expr));
			break;
		case binaryen.GlobalGetId:
			break;
		case binaryen.GlobalSetId:
			fn(binaryen.GlobalSet.getValue(expr));
			break;
		case binaryen.LoadId:
			fn(binaryen.Load.getPtr(expr));
			break;
		case binaryen.StoreId:
			fn(binaryen.Store.getPtr(expr));
			fn(binaryen.Store.getValue(expr));
			break;
		case binaryen.UnaryId:
			fn(binaryen.Unary.getValue(expr));
			break;
		case binaryen.BinaryId:
			fn(binaryen.Binary.getLeft(expr));
			fn(binaryen.Binary.getRight(expr));
			break;
		case binaryen.SelectId:
			fn(binaryen.Select.getIfTrue(expr));
			fn(binaryen.Select.getIfFalse(expr));
			fn(binaryen.Select.getCondition(expr));
			break;
		case binaryen.DropId:
			fn(binaryen.Drop.getValue(expr));
			break;
		case binaryen.ReturnId: {
			const v = binaryen.Return.getValue(expr);
			if (v) fn(v);
			break;
		}
		case binaryen.MemoryGrowId:
			fn(binaryen.MemoryGrow.getDelta(expr));
			break;
		case binaryen.AtomicRMWId:
			fn(binaryen.AtomicRMW.getPtr(expr));
			fn(binaryen.AtomicRMW.getValue(expr));
			break;
		case binaryen.AtomicCmpxchgId:
			fn(binaryen.AtomicCmpxchg.getPtr(expr));
			fn(binaryen.AtomicCmpxchg.getExpected(expr));
			fn(binaryen.AtomicCmpxchg.getReplacement(expr));
			break;
		case binaryen.TupleExtractId:
			fn(binaryen.TupleExtract.getTuple(expr));
			break;
		case binaryen.TupleMakeId: {
			const n = binaryen.TupleMake.getNumOperands(expr);
			for (let i = 0; i < n; i++)
				fn(binaryen.TupleMake.getOperandAt(expr, i));
			break;
		}
		// Leaf nodes or less common:
		// NopId, UnreachableId, ConstId, MemorySizeId, etc.
		default:
			break;
	}
}

/**
 * Recursively rewrite children of an expression in-place.
 * For children that get replaced, update the parent's child pointer.
 */
function rewriteChildren(module, expr, state) {
	if (expr === 0) return;
	const id = binaryen.Expression.getId(expr);

	switch (id) {
		case binaryen.BlockId: {
			const n = binaryen.Block.getNumChildren(expr);
			for (let i = 0; i < n; i++) {
				const child = binaryen.Block.getChildAt(expr, i);
				const newChild = rewriteExpression(module, child, state);
				if (newChild !== child)
					binaryen.Block.setChildAt(expr, i, newChild);
			}
			break;
		}
		case binaryen.IfId: {
			const c = binaryen.If.getCondition(expr);
			const nc = rewriteExpression(module, c, state);
			if (nc !== c) binaryen.If.setCondition(expr, nc);

			const t = binaryen.If.getIfTrue(expr);
			const nt = rewriteExpression(module, t, state);
			if (nt !== t) binaryen.If.setIfTrue(expr, nt);

			const f = binaryen.If.getIfFalse(expr);
			if (f) {
				const nf = rewriteExpression(module, f, state);
				if (nf !== f) binaryen.If.setIfFalse(expr, nf);
			}
			break;
		}
		case binaryen.LoopId: {
			const b = binaryen.Loop.getBody(expr);
			const nb = rewriteExpression(module, b, state);
			if (nb !== b) binaryen.Loop.setBody(expr, nb);
			break;
		}
		case binaryen.BreakId: {
			const c = binaryen.Break.getCondition(expr);
			if (c) {
				const nc = rewriteExpression(module, c, state);
				if (nc !== c) binaryen.Break.setCondition(expr, nc);
			}
			const v = binaryen.Break.getValue(expr);
			if (v) {
				const nv = rewriteExpression(module, v, state);
				if (nv !== v) binaryen.Break.setValue(expr, nv);
			}
			break;
		}
		case binaryen.SwitchId: {
			const c = binaryen.Switch.getCondition(expr);
			if (c) {
				const nc = rewriteExpression(module, c, state);
				if (nc !== c) binaryen.Switch.setCondition(expr, nc);
			}
			const v = binaryen.Switch.getValue(expr);
			if (v) {
				const nv = rewriteExpression(module, v, state);
				if (nv !== v) binaryen.Switch.setValue(expr, nv);
			}
			break;
		}
		case binaryen.CallId: {
			const n = binaryen.Call.getNumOperands(expr);
			for (let i = 0; i < n; i++) {
				const child = binaryen.Call.getOperandAt(expr, i);
				const nc = rewriteExpression(module, child, state);
				if (nc !== child) binaryen.Call.setOperandAt(expr, i, nc);
			}
			break;
		}
		case binaryen.CallIndirectId: {
			const t = binaryen.CallIndirect.getTarget(expr);
			const nt = rewriteExpression(module, t, state);
			if (nt !== t) binaryen.CallIndirect.setTarget(expr, nt);

			const n = binaryen.CallIndirect.getNumOperands(expr);
			for (let i = 0; i < n; i++) {
				const child = binaryen.CallIndirect.getOperandAt(expr, i);
				const nc = rewriteExpression(module, child, state);
				if (nc !== child)
					binaryen.CallIndirect.setOperandAt(expr, i, nc);
			}
			break;
		}
		case binaryen.LocalSetId: {
			const v = binaryen.LocalSet.getValue(expr);
			const nv = rewriteExpression(module, v, state);
			if (nv !== v) binaryen.LocalSet.setValue(expr, nv);
			break;
		}
		case binaryen.GlobalSetId: {
			const v = binaryen.GlobalSet.getValue(expr);
			const nv = rewriteExpression(module, v, state);
			if (nv !== v) binaryen.GlobalSet.setValue(expr, nv);
			break;
		}
		case binaryen.LoadId: {
			const p = binaryen.Load.getPtr(expr);
			const np = rewriteExpression(module, p, state);
			if (np !== p) binaryen.Load.setPtr(expr, np);
			break;
		}
		case binaryen.StoreId: {
			const p = binaryen.Store.getPtr(expr);
			const np = rewriteExpression(module, p, state);
			if (np !== p) binaryen.Store.setPtr(expr, np);

			const v = binaryen.Store.getValue(expr);
			const nv = rewriteExpression(module, v, state);
			if (nv !== v) binaryen.Store.setValue(expr, nv);
			break;
		}
		case binaryen.UnaryId: {
			const v = binaryen.Unary.getValue(expr);
			const nv = rewriteExpression(module, v, state);
			if (nv !== v) binaryen.Unary.setValue(expr, nv);
			break;
		}
		case binaryen.BinaryId: {
			const l = binaryen.Binary.getLeft(expr);
			const nl = rewriteExpression(module, l, state);
			if (nl !== l) binaryen.Binary.setLeft(expr, nl);

			const r = binaryen.Binary.getRight(expr);
			const nr = rewriteExpression(module, r, state);
			if (nr !== r) binaryen.Binary.setRight(expr, nr);
			break;
		}
		case binaryen.SelectId: {
			const t = binaryen.Select.getIfTrue(expr);
			const nt = rewriteExpression(module, t, state);
			if (nt !== t) binaryen.Select.setIfTrue(expr, nt);

			const f = binaryen.Select.getIfFalse(expr);
			const nf = rewriteExpression(module, f, state);
			if (nf !== f) binaryen.Select.setIfFalse(expr, nf);

			const c = binaryen.Select.getCondition(expr);
			const nc = rewriteExpression(module, c, state);
			if (nc !== c) binaryen.Select.setCondition(expr, nc);
			break;
		}
		case binaryen.DropId: {
			const v = binaryen.Drop.getValue(expr);
			const nv = rewriteExpression(module, v, state);
			if (nv !== v) binaryen.Drop.setValue(expr, nv);
			break;
		}
		case binaryen.ReturnId: {
			const v = binaryen.Return.getValue(expr);
			if (v) {
				const nv = rewriteExpression(module, v, state);
				if (nv !== v) binaryen.Return.setValue(expr, nv);
			}
			break;
		}
		case binaryen.MemoryGrowId: {
			const d = binaryen.MemoryGrow.getDelta(expr);
			const nd = rewriteExpression(module, d, state);
			if (nd !== d) binaryen.MemoryGrow.setDelta(expr, nd);
			break;
		}
		case binaryen.TupleExtractId: {
			const t = binaryen.TupleExtract.getTuple(expr);
			const nt = rewriteExpression(module, t, state);
			if (nt !== t) binaryen.TupleExtract.setTuple(expr, nt);
			break;
		}
		case binaryen.TupleMakeId: {
			const n = binaryen.TupleMake.getNumOperands(expr);
			for (let i = 0; i < n; i++) {
				const child = binaryen.TupleMake.getOperandAt(expr, i);
				const nc = rewriteExpression(module, child, state);
				if (nc !== child) binaryen.TupleMake.setOperandAt(expr, i, nc);
			}
			break;
		}
		default:
			// Leaf nodes or unhandled - no children to rewrite
			break;
	}
}
