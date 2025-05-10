// File: frontend/lib/floor-plan-utils.test.ts
import { describe, it, expect } from 'vitest';
import {
    Table,
    BackendTable,
    mapBackendTableToFrontend,
    mapFrontendTableToCreatePayload,
    mapFrontendTableToUpdatePayload
} from './floor-plan-utils';

describe('Floor Plan Utils - Mapping Functions', () => {

    // --- mapBackendTableToFrontend ---
    it('should correctly map backend shape to frontend type', () => {
        const backendCircle: BackendTable = {
            id: 1, name: 'T1', shape: 'circle', width: 100, height: 100, position_x: 50, position_y: 50, rotation: 0, seat_count: 4, status: 'available', floor_plan_id: 'fp1'
        };
        const backendRect: BackendTable = {
            id: 2, name: 'T2', shape: 'rectangle', width: 150, height: 80, position_x: 100, position_y: 100, rotation: 45, seat_count: 6, status: 'reserved', floor_plan_id: 'fp1'
        };
        const backendSquare: BackendTable = {
            id: 3, name: 'T3', shape: 'square', width: 120, height: 120, position_x: 200, position_y: 200, rotation: 0, seat_count: 4, status: 'out_of_service', floor_plan_id: 'fp1'
        };

        const frontendCircle = mapBackendTableToFrontend(backendCircle);
        const frontendRect = mapBackendTableToFrontend(backendRect);
        const frontendSquare = mapBackendTableToFrontend(backendSquare);

        expect(frontendCircle.type).toBe('circle');
        expect(frontendRect.type).toBe('rectangle');
        expect(frontendSquare.type).toBe('square');

        // Also test other basic mappings
        expect(frontendCircle.id).toBe('backend-1');
        expect(frontendRect.label).toBe('T2');
        expect(frontendSquare.seats).toBe(4);
        expect(frontendSquare.status).toBe('reserved'); // out_of_service maps to reserved
    });

    // --- mapFrontendTableToCreatePayload ---
    it('should correctly map frontend type to backend shape for create payload', () => {
        const frontendCircle: Table = {
            id: 'temp-1', type: 'circle', x: 50, y: 50, width: 100, height: 100, seats: 4, label: 'New Circle', status: 'available'
        };
        const frontendRect: Table = {
            id: 'temp-2', type: 'rectangle', x: 100, y: 100, width: 150, height: 80, seats: 6, label: 'New Rect', status: 'reserved'
        };
        const frontendSquare: Table = {
            id: 'temp-3', type: 'square', x: 200, y: 200, width: 120, height: 120, seats: 4, label: 'New Square', status: 'available'
        };

        const payloadCircle = mapFrontendTableToCreatePayload(frontendCircle, 'fp-test');
        const payloadRect = mapFrontendTableToCreatePayload(frontendRect, 'fp-test');
        const payloadSquare = mapFrontendTableToCreatePayload(frontendSquare, 'fp-test');

        expect(payloadCircle.shape).toBe('circle');
        expect(payloadRect.shape).toBe('rectangle');
        expect(payloadSquare.shape).toBe('square');

        // Also test other basic mappings
        expect(payloadCircle.name).toBe('New Circle');
        expect(payloadRect.seat_count).toBe(6);
        expect(payloadSquare.position_x).toBe(200);
        expect(payloadCircle.floor_plan_id).toBe('fp-test');
    });

     // --- mapFrontendTableToUpdatePayload ---
    it('should correctly map frontend type to backend shape for update payload if changed', () => {
        const frontendTable: Table = {
            id: 'backend-1', type: 'rectangle', x: 50, y: 50, width: 100, height: 100, seats: 4, label: 'T1 Updated', status: 'available', rotation: 90
        };
        const backendTable: BackendTable = {
            id: 1, name: 'T1', shape: 'circle', width: 100, height: 100, position_x: 50, position_y: 50, rotation: 0, seat_count: 4, status: 'available', floor_plan_id: 'fp1'
        };

        const updatePayload = mapFrontendTableToUpdatePayload(frontendTable, backendTable);

        expect(updatePayload).not.toBeNull();
        expect(updatePayload?.shape).toBe('rectangle'); // Shape changed
        expect(updatePayload?.name).toBe('T1 Updated'); // Label changed
        expect(updatePayload?.rotation).toBe(90); // Rotation changed
        expect(updatePayload?.width).toBeUndefined(); // Width didn't change
    });

    it('should return null for update payload if only position changed slightly (within rounding)', () => {
         const frontendTable: Table = {
            id: 'backend-1', type: 'circle', x: 50.4, y: 49.6, width: 100, height: 100, seats: 4, label: 'T1', status: 'available', rotation: 0
        };
        const backendTable: BackendTable = {
            id: 1, name: 'T1', shape: 'circle', width: 100, height: 100, position_x: 50, position_y: 50, rotation: 0, seat_count: 4, status: 'available', floor_plan_id: 'fp1'
        };

        const updatePayload = mapFrontendTableToUpdatePayload(frontendTable, backendTable);
        expect(updatePayload).toBeNull(); // No significant changes
    });

     it('should return payload for update if position changed significantly', () => {
         const frontendTable: Table = {
            id: 'backend-1', type: 'circle', x: 60, y: 70, width: 100, height: 100, seats: 4, label: 'T1', status: 'available', rotation: 0
        };
        const backendTable: BackendTable = {
            id: 1, name: 'T1', shape: 'circle', width: 100, height: 100, position_x: 50, position_y: 50, rotation: 0, seat_count: 4, status: 'available', floor_plan_id: 'fp1'
        };

        const updatePayload = mapFrontendTableToUpdatePayload(frontendTable, backendTable);
        expect(updatePayload).not.toBeNull();
        expect(updatePayload?.position_x).toBe(60);
        expect(updatePayload?.position_y).toBe(70);
    });

});