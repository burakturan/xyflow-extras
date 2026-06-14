/**
 * Magnetic drag for React Flow. It adds node collision, which React Flow does not ship.
 *
 * You get the pure logic in computeRepulsion and a small hook in useMagneticDrag. Copy this folder
 * into any React Flow project. The only thing it needs is @xyflow/react. Add magnetic.css for the
 * smooth slide between push steps.
 */
export { computeRepulsion, nodeRect, type Rect, type RepelOptions } from './repel';
export { useMagneticDrag } from './useMagneticDrag';
